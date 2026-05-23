use desktop_lib::platform::wakeword::{WakeWordDetector, OWW_MODEL_CHUNK_SIZE};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rubato::audioadapter_buffers::direct::InterleavedSlice;
use rubato::{Fft, FixedSync, Resampler};
use std::sync::{Arc, Mutex};
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging to see what's happening
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    println!("--- Wake Word Standalone Tester ---");
    
    // Paths to models (relative to apps/desktop/src-tauri)
    let mel_path = Path::new("resources/models/melspectrogram.onnx");
    let emb_path = Path::new("resources/models/embedding_model.onnx");
    let ww_path = Path::new("resources/models/hey_jarvis.onnx");

    if !mel_path.exists() {
        println!("Error: Model files not found! Run from apps/desktop/src-tauri");
        return Ok(());
    }

    println!("Loading models...");
    let mut detector = WakeWordDetector::new(&mel_path, &emb_path, &ww_path, 0.5)?;
    println!("Models loaded successfully.");

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or("No default input device available")?;

    let config: cpal::StreamConfig = device.default_input_config()?.into();
    let sample_rate = config.sample_rate.0 as usize;
    let channels = config.channels as usize;

    println!("Microphone: {}", device.name()?);
    println!("Sample Rate: {}, Channels: {}", sample_rate, channels);

    let target_rate = 16000;
    let input_chunk_size = (OWW_MODEL_CHUNK_SIZE * sample_rate) / target_rate;
    
    let mut resampler = Fft::<f32>::new(
        sample_rate,
        target_rate,
        input_chunk_size,
        1,
        1,
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
        |err| eprintln!("Audio stream error: {}", err),
        None
    )?;

    stream.play()?;

    println!("Listening for 'Alexa'... (Press Ctrl+C to stop)");

    let mut max_prob = 0.0f32;
    let mut last_print = std::time::Instant::now();

    while let Ok(input_chunk) = rx.recv() {
        let mut mono_input = Vec::with_capacity(input_chunk_size);
        for i in 0..input_chunk_size {
            let mut sum = 0.0;
            for c in 0..channels {
                sum += input_chunk[i * channels + c];
            }
            mono_input.push(sum / channels as f32);
        }

        let input_adapter = InterleavedSlice::new(&mono_input, 1, input_chunk_size)?;
        let resampled = resampler.process(&input_adapter, 0, None)?;
        let mono_resampled = resampled.take_data();

        if mono_resampled.len() >= OWW_MODEL_CHUNK_SIZE {
            let (detected, prob) = detector.process_chunk(&mono_resampled[0..OWW_MODEL_CHUNK_SIZE])?;
            if prob > max_prob {
                max_prob = prob;
            }
            if detected {
                println!("\n>>> DETECTED! (Prob: {:.2}) <<<", prob);
            }
        }

        if last_print.elapsed().as_millis() > 500 {
            print!("\rMax Prob (last 500ms): {:.4}    ", max_prob);
            use std::io::Write;
            std::io::stdout().flush().unwrap();
            max_prob = 0.0;
            last_print = std::time::Instant::now();
        }
    }

    Ok(())
}
