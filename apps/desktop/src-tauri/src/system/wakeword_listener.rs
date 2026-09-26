use crate::platform::wakeword::{
    EMBEDDING_MODEL_FILE, MEL_MODEL_FILE, OWW_MODEL_CHUNK_SIZE, WakeWordDetector,
};
use crate::system::wakeword_models::{read_config, resource_models_dir, resolve_model};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rubato::audioadapter_buffers::direct::InterleavedSlice;
use rubato::{Fft, FixedSync, Resampler};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::RecvTimeoutError;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

/// The running listener. Replaced whenever settings change, so the previous
/// thread can be told to drop its microphone stream.
#[derive(Default)]
pub struct WakewordListenerHandle(pub Mutex<Option<Arc<AtomicBool>>>);

pub fn start_wakeword_listener(app_handle: AppHandle) {
    let shutdown = Arc::new(AtomicBool::new(false));

    if let Some(handle) = app_handle.try_state::<WakewordListenerHandle>() {
        if let Ok(mut running) = handle.0.lock() {
            if let Some(previous) = running.replace(shutdown.clone()) {
                previous.store(true, Ordering::Relaxed);
                log::info!("Restarting wake word listener");
            }
        }
    }

    thread::spawn(move || {
        if let Err(e) = run_listener(app_handle, shutdown) {
            log::error!("Wake word listener error: {}", e);
        }
    });
}

fn run_listener(
    app_handle: AppHandle,
    shutdown: Arc<AtomicBool>,
) -> Result<(), Box<dyn std::error::Error>> {
    let resource_dir = resource_models_dir(&app_handle)?;

    let mel_path = resource_dir.join(MEL_MODEL_FILE);
    let emb_path = resource_dir.join(EMBEDDING_MODEL_FILE);

    for path in [&mel_path, &emb_path] {
        if !path.exists() {
            return Err(format!("Wake word model not found: {:?}", path).into());
        }
    }

    let config = read_config(&app_handle);

    // Each slot resolves on its own, so a missing or broken model only disables
    // its own word. `None` in the config turns a slot off.
    // The stop word slot stays disabled: detection only completes once the word
    // has already been captured, so it leaks into the transcription.
    let slots: [(Option<String>, &str); 2] = [
        (config.dictation, "wake_word_detected"),
        (config.agent, "agent_wake_word_detected"),
    ];

    let mut loaded: Vec<(String, &str)> = Vec::new();
    let mut word_paths: Vec<PathBuf> = Vec::new();
    for (model, event) in slots {
        let Some(model) = model else { continue };
        match resolve_model(&app_handle, &model) {
            Some(path) => {
                word_paths.push(path);
                loaded.push((model, event));
            }
            None => log::warn!("Wake word model '{model}' not found, {event} disabled"),
        }
    }

    if loaded.is_empty() {
        return Err("No wake word models available".into());
    }

    let mut detector = WakeWordDetector::new(&mel_path, &emb_path, &word_paths, 0.5)?;

    if shutdown.load(Ordering::Relaxed) {
        return Ok(());
    }

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

    while !shutdown.load(Ordering::Relaxed) {
        let input_chunk = match rx.recv_timeout(Duration::from_millis(250)) {
            Ok(chunk) => chunk,
            Err(RecvTimeoutError::Timeout) => continue,
            Err(RecvTimeoutError::Disconnected) => break,
        };

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
            let detections = detector.process_chunk(&mono_resampled[0..OWW_MODEL_CHUNK_SIZE])?;
            for ((model, event), (detected, avg)) in loaded.iter().zip(detections) {
                if detected {
                    log::info!("Wake word '{model}' detected (avg={avg:.2}), emitting {event}");
                    app_handle.emit(*event, ())?;
                }
            }
        }
    }

    log::info!("Wake word listener stopped");
    Ok(())
}
