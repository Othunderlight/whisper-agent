use crate::platform::wakeword::{
    EMBEDDING_MODEL_FILE, MEL_MODEL_FILE, OWW_MODEL_CHUNK_SIZE, WakeWordDetector, WAKEWORD_MODEL_FILE,
};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rubato::audioadapter_buffers::direct::InterleavedSlice;
use rubato::{Fft, FixedSync, Resampler};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, Manager, path::BaseDirectory};

pub fn start_wakeword_listener(app_handle: AppHandle) {
    thread::spawn(move || {
        if let Err(e) = run_listener(app_handle) {
            log::error!("Wake word listener error: {}", e);
        }
    });
}

fn run_listener(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let resource_dir = app_handle.path().resolve("resources/models", BaseDirectory::Resource)?;
    
    let mel_path = resource_dir.join(MEL_MODEL_FILE);
    let emb_path = resource_dir.join(EMBEDDING_MODEL_FILE);
    let ww_path = resource_dir.join(WAKEWORD_MODEL_FILE);

    for path in [&mel_path, &emb_path, &ww_path] {
        if !path.exists() {
            return Err(format!("Wake word model not found: {:?}", path).into());
        }
    }

    let mut detector = WakeWordDetector::new(&mel_path, &emb_path, &ww_path, 0.5)?;

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or("No default input device available")?;

    let config: cpal::StreamConfig = device.default_input_config()?.into();
    let sample_rate = config.sample_rate.0 as usize;
    let channels = config.channels as usize;

    // Resampling setup: from sample_rate to 16000
    let target_rate = 16000;
    
    // We'll process in chunks that correspond to 80ms (1280 samples) at 16kHz
    let input_chunk_size = (OWW_MODEL_CHUNK_SIZE * sample_rate) / target_rate;
    
    // We'll use 1 channel for resampling to save CPU, so we'll convert to mono first
    let mut resampler = Fft::<f32>::new(
        sample_rate,
        target_rate,
        input_chunk_size,
        1,
        1, // 1 channel
        FixedSync::Input
    )?;

    let (tx, rx) = std::sync::mpsc::channel::<Vec<f32>>();
    let audio_buffer = Arc::new(Mutex::new(Vec::new()));
    let audio_buffer_clone = audio_buffer.clone();

    let stream = device.build_input_stream(
        &config,
        move |data: &[f32], _: &cpal::InputCallbackInfo| {
            if let Ok(mut buffer) = audio_buffer_clone.lock() {
                buffer.extend_from_slice(data);
                if buffer.len() >= input_chunk_size * channels {
                    let to_process = buffer.drain(0..input_chunk_size * channels).collect::<Vec<f32>>();
                    let _ = tx.send(to_process);
                }
            }
        },
        |err| log::error!("Audio stream error: {}", err),
        None
    )?;

    stream.play()?;

    log::info!("Wake word listener started on device: {} (rate: {}, channels: {})", device.name()?, sample_rate, channels);

    while let Ok(input_chunk) = rx.recv() {
        // Convert to mono
        let mut mono_input = Vec::with_capacity(input_chunk_size);
        for i in 0..input_chunk_size {
            let mut sum = 0.0;
            for c in 0..channels {
                sum += input_chunk[i * channels + c];
            }
            mono_input.push(sum / channels as f32);
        }

        // Resample
        let input_adapter = InterleavedSlice::new(&mono_input, 1, input_chunk_size)?;
        let resampled = resampler.process(&input_adapter, 0, None)?;
        
        let mono_resampled = resampled.take_data();

        // Process chunks of 1280 samples
        if mono_resampled.len() >= OWW_MODEL_CHUNK_SIZE {
            let (detected, _prob) = detector.process_chunk(&mono_resampled[0..OWW_MODEL_CHUNK_SIZE])?;
            if detected {
                log::info!("Wake word detected!");
                app_handle.emit("wake_word_detected", ())?;
            }
        }
    }

    Ok(())
}
