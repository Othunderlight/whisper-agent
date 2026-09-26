use std::path::Path;
use tract_onnx::prelude::*;

/// Prints the declared input shape of every model in `resources/models`.
///
/// The mel/embedding/wakeword pipeline feeds tensors of fixed shape, so a model
/// that expects something else only fails once audio starts flowing and takes
/// the whole listener down with it. Check new wake word models here first:
///
///     cargo run --example inspect_models
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let dir = Path::new("resources/models");

    let mut files: Vec<_> = std::fs::read_dir(dir)?
        .filter_map(|entry| entry.ok().map(|entry| entry.path()))
        .filter(|path| path.extension().is_some_and(|ext| ext == "onnx"))
        .collect();
    files.sort();

    for path in files {
        let model = tract_onnx::onnx().model_for_path(&path)?;

        let mut inputs = Vec::new();
        for input in model.input_outlets()? {
            inputs.push(format!("{:?}", model.outlet_fact(*input)?));
        }

        let name = path.file_name().unwrap_or_default().to_string_lossy();
        println!("{name}: {}", inputs.join(", "));
    }

    Ok(())
}
