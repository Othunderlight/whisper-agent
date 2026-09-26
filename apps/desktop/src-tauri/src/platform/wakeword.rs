use circular_buffer::CircularBuffer;
use std::path::{Path, PathBuf};
use std::time::Instant;
use tract_onnx::prelude::*;

pub const OWW_MODEL_CHUNK_SIZE: usize = 1280;
pub const FEATURE_BUFFER_SIZE: usize = 16;
pub const MEL_CIRC_SIZE: usize = 16; // 80 / 5

// Model files shipped under `resources/models`. They are gitignored, so these
// names must match what is actually on disk.
pub const MEL_MODEL_FILE: &str = "melspectrogram.onnx";
pub const EMBEDDING_MODEL_FILE: &str = "embedding_model.onnx";
pub const WAKEWORD_MODEL_FILE: &str = "Meea.onnx";
pub const STOPWORD_MODEL_FILE: &str = "stop.onnx";

type ModelType = RunnableModel<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>;

pub struct AudioFeatures {
    mel: ModelType,
    emb: ModelType,
    feature_buffer: CircularBuffer<FEATURE_BUFFER_SIZE, Tensor>,
    mel_spectrogram_buffer: CircularBuffer<MEL_CIRC_SIZE, Tensor>,
}

impl AudioFeatures {
    pub fn new(mel_path: &Path, emb_path: &Path) -> TractResult<Self> {
        let mel = tract_onnx::onnx()
            .model_for_path(mel_path)?
            .with_input_fact(0, f32::fact([1, 1280]).into())?
            .into_optimized()?
            .into_runnable()?;

        let emb = tract_onnx::onnx()
            .model_for_path(emb_path)?
            .with_input_fact(0, f32::fact([1, 76, 32, 1]).into())?
            .into_optimized()?
            .into_runnable()?;

        let mut feature_buffer = CircularBuffer::<FEATURE_BUFFER_SIZE, Tensor>::new();
        for _ in 0..FEATURE_BUFFER_SIZE {
            feature_buffer.push_back(Tensor::from_shape(&[1, 1, 1, 96], &[0f32; 96])?);
        }
        let mut mel_spectrogram_buffer = CircularBuffer::<MEL_CIRC_SIZE, Tensor>::new();
        for _ in 0..MEL_CIRC_SIZE {
            mel_spectrogram_buffer.push_back(Tensor::from_shape(&[5, 32], &[0f32; 5 * 32])?);
        }

        Ok(Self {
            mel,
            emb,
            feature_buffer,
            mel_spectrogram_buffer,
        })
    }

    fn get_melspectrogram(&mut self, data: &[f32]) -> TractResult<Tensor> {
        let tensor = Tensor::from_shape(&[1, 1280], data)?;
        let outputs = self.mel.run(tvec!(tensor.into()))?;
        let out_tensor = outputs[0].clone().into_tensor();
        let resized = out_tensor.into_shape(&[5, 32])?;
        let a = resized.into_array::<f32>()?.into_owned();
        let updated = a.mapv(|v| (v / 10.0) + 2.0).into_tensor();
        Ok(updated)
    }

    pub fn get_audio_features(&mut self, data: &[f32]) -> TractResult<Tensor> {
        let mel_chunk = self.get_melspectrogram(data)?;
        self.mel_spectrogram_buffer.push_back(mel_chunk);
        
        let stacked_mels = Tensor::stack_tensors(0, &self.mel_spectrogram_buffer.to_vec())?;
        let smaller = stacked_mels.slice(0, 4, 80)?;
        let reshaped = smaller.into_shape(&[1, 76, 32, 1])?;

        let embeddings = self.emb.run(tvec!(reshaped.into()))?;
        self.feature_buffer.push_back(embeddings[0].clone().into_tensor());

        let stacked = Tensor::stack_tensors(0, &self.feature_buffer.to_vec())?;
        let reshaped = stacked.into_shape(&[FEATURE_BUFFER_SIZE, 96])?;
        Ok(reshaped)
    }
}

pub struct WakeWordModel {
    model: ModelType,
    threshold: f32,
    detections_buffer: CircularBuffer<12, f32>,
    last_detection_time: Instant,
}

impl WakeWordModel {
    fn new(model_path: &Path, threshold: f32) -> TractResult<Self> {
        Ok(Self {
            model: tract_onnx::onnx()
                .model_for_path(model_path)?
                .into_optimized()?
                .into_runnable()?,
            threshold,
            detections_buffer: CircularBuffer::new(),
            last_detection_time: Instant::now() - std::time::Duration::from_secs(10),
        })
    }

    /// Scores one wake word against features that are shared by every model.
    /// Returns `(detected, average_probability)`.
    fn detect(&mut self, features: &Tensor) -> TractResult<(bool, f32)> {
        let out = self.model.run(tvec!(features.clone().into()))?;
        let probability = out[0].clone().into_tensor().cast_to::<f32>()?.as_slice::<f32>()?[0];

        self.detections_buffer.push_back(probability);

        let avg = self.calculate_average();
        let since_last = self.last_detection_time.elapsed().as_millis();

        // Fires as the word ends: probability has dropped back down while the
        // window behind it was still high.
        let detected = probability < 0.1 && avg > self.threshold && since_last > 2000;
        if detected {
            self.last_detection_time = Instant::now();
        }

        Ok((detected, avg))
    }

    fn calculate_average(&self) -> f32 {
        let items = self.detections_buffer.to_vec();
        if items.is_empty() { return 0.0; }
        
        let mut sum = 0.0;
        let mut count = 0.0;
        for &d in &items {
            if d > self.threshold {
                sum += d;
                count += 1.0;
            }
        }
        
        if count > 3.0 && (sum / count) > self.threshold {
            sum / count
        } else {
            0.0
        }
    }
}

/// Extracts the audio features once per chunk, then scores every configured
/// wake word model against them.
pub struct WakeWordDetector {
    audio_features: AudioFeatures,
    models: Vec<WakeWordModel>,
}

impl WakeWordDetector {
    pub fn new(
        mel_path: &Path,
        emb_path: &Path,
        word_paths: &[PathBuf],
        threshold: f32,
    ) -> TractResult<Self> {
        let mut models = Vec::with_capacity(word_paths.len());
        for path in word_paths {
            models.push(WakeWordModel::new(path, threshold)?);
        }

        Ok(Self {
            audio_features: AudioFeatures::new(mel_path, emb_path)?,
            models,
        })
    }

    pub fn process_chunk(&mut self, chunk: &[f32]) -> TractResult<Vec<(bool, f32)>> {
        let features = self.audio_features.get_audio_features(chunk)?;
        let input = features.into_shape(&[1, 16, 96])?;

        self.models
            .iter_mut()
            .map(|model| model.detect(&input))
            .collect()
    }
}
