use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

use crate::platform::wakeword::{
    AGENT_WAKEWORD_MODEL_FILE, EMBEDDING_MODEL_FILE, MEL_MODEL_FILE, WakeWordModel,
    WAKEWORD_MODEL_FILE,
};

const CUSTOM_DIR_NAME: &str = "wakeword_models";
const CONFIG_FILENAME: &str = "wakeword.json";

/// Which model each wake word slot listens for. `None` turns the slot off.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct WakewordConfig {
    pub dictation: Option<String>,
    pub agent: Option<String>,
}

impl Default for WakewordConfig {
    fn default() -> Self {
        Self {
            dictation: Some(WAKEWORD_MODEL_FILE.to_string()),
            agent: Some(AGENT_WAKEWORD_MODEL_FILE.to_string()),
        }
    }
}

/// A wake word model offered in settings.
#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct WakewordModelInfo {
    pub name: String,
    pub builtin: bool,
}

/// Bundled models, next to the mel/embedding feature models the pipeline needs.
pub fn resource_models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .resolve("resources/models", BaseDirectory::Resource)
        .map_err(|err| err.to_string())
}

/// User-imported models. The bundled directory ships with the RPM and is owned
/// by root, so imports have to live somewhere writable.
pub fn custom_models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_data_dir().map_err(|err| err.to_string())?;
    path.push(CUSTOM_DIR_NAME);
    fs::create_dir_all(&path).map_err(|err| err.to_string())?;
    Ok(path)
}

pub fn list_models(app: &AppHandle) -> Result<Vec<WakewordModelInfo>, String> {
    let mut models: Vec<WakewordModelInfo> = match resource_models_dir(app) {
        Ok(dir) => onnx_files(&dir)
            .into_iter()
            .filter(|path| !is_feature_model(path))
            .map(|path| WakewordModelInfo {
                name: file_name(&path),
                builtin: true,
            })
            .collect(),
        Err(err) => {
            log::warn!("Could not list bundled wake word models: {err}");
            Vec::new()
        }
    };

    for path in onnx_files(&custom_models_dir(app)?) {
        let name = file_name(&path);
        models.retain(|model| model.name != name);
        models.push(WakewordModelInfo {
            name,
            builtin: false,
        });
    }

    models.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(models)
}

/// Finds a model by name, preferring a user-imported copy over the bundled one.
pub fn resolve_model(app: &AppHandle, name: &str) -> Option<PathBuf> {
    if !is_safe_name(name) {
        return None;
    }

    let custom = custom_models_dir(app).ok()?.join(name);
    if custom.exists() {
        return Some(custom);
    }

    let bundled = resource_models_dir(app).ok()?.join(name);
    bundled.exists().then_some(bundled)
}

/// Stores an imported model and refuses anything the detector cannot run.
pub fn import_model(app: &AppHandle, name: String, bytes: Vec<u8>) -> Result<String, String> {
    let name = Path::new(&name)
        .file_name()
        .map(|file_name| file_name.to_string_lossy().into_owned())
        .unwrap_or_default();

    if !is_safe_name(&name) {
        return Err("Only .onnx models can be imported.".to_string());
    }

    if bytes.is_empty() {
        return Err("The selected file is empty.".to_string());
    }

    let path = custom_models_dir(app)?.join(&name);
    fs::write(&path, &bytes).map_err(|err| format!("Could not save '{name}': {err}"))?;

    if let Err(err) = WakeWordModel::validate(&path) {
        let _ = fs::remove_file(&path);
        return Err(format!(
            "'{name}' is not a compatible openWakeWord model: {err}"
        ));
    }

    log::info!("Imported wake word model '{name}'");
    Ok(name)
}

pub fn read_config(app: &AppHandle) -> WakewordConfig {
    let Ok(path) = config_path(app) else {
        return WakewordConfig::default();
    };
    let Ok(bytes) = fs::read(path) else {
        return WakewordConfig::default();
    };

    serde_json::from_slice(&bytes).unwrap_or_else(|err| {
        log::warn!("Ignoring unreadable wake word config: {err}");
        WakewordConfig::default()
    })
}

pub fn write_config(app: &AppHandle, config: &WakewordConfig) -> Result<(), String> {
    let path = config_path(app)?;
    let bytes = serde_json::to_vec_pretty(config).map_err(|err| err.to_string())?;
    fs::write(path, bytes).map_err(|err| format!("Could not save wake word settings: {err}"))
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_config_dir().map_err(|err| err.to_string())?;
    path.push(CONFIG_FILENAME);
    Ok(path)
}

fn onnx_files(dir: &Path) -> Vec<PathBuf> {
    let Ok(entries) = fs::read_dir(dir) else {
        return Vec::new();
    };

    entries
        .filter_map(|entry| entry.ok().map(|entry| entry.path()))
        .filter(|path| path.extension().is_some_and(|ext| ext == "onnx"))
        .collect()
}

fn file_name(path: &Path) -> String {
    path.file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_default()
}

fn is_feature_model(path: &Path) -> bool {
    let name = file_name(path);
    name == MEL_MODEL_FILE || name == EMBEDDING_MODEL_FILE
}

/// Keeps a name in its own directory so a config can never reach outside the
/// model folders.
fn is_safe_name(name: &str) -> bool {
    name.ends_with(".onnx")
        && Path::new(name)
            .file_name()
            .is_some_and(|file_name| file_name == std::ffi::OsStr::new(name))
}
