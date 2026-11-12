use std::{fs, io, path::PathBuf};
use tauri::Manager;

use super::models::WhisperModelSize;

const MODELS_DIR_NAME: &str = "models";
const STORAGE_DIR_NAME: &str = "storage";

pub fn exe_dir() -> io::Result<PathBuf> {
    let exe = std::env::current_exe()?;
    exe.parent().map(PathBuf::from).ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::NotFound,
            format!("Executable path has no parent: {}", exe.display()),
        )
    })
}

/// Directories that may contain bundled resources.
///
/// Tauri's `resource_dir` derives from a canonicalized executable path, which
/// fails on some Windows setups (non-NTFS install volumes among them). The
/// executable's own directory is where the bundler puts resources, so it is
/// used as a fallback.
pub fn resource_dirs(app: &tauri::AppHandle) -> Vec<PathBuf> {
    let mut dirs = Vec::new();

    match app.path().resource_dir() {
        Ok(dir) => dirs.push(dir),
        Err(err) => log::warn!("Failed to resolve resource dir: {err}"),
    }

    if let Ok(dir) = exe_dir() {
        if !dirs.contains(&dir) {
            dirs.push(dir);
        }
    }

    dirs
}

pub fn database_path(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let mut path = app
        .path()
        .app_config_dir()
        .map_err(|err| io::Error::other(err.to_string()))?;
    fs::create_dir_all(&path)?;
    path.push(crate::db::DB_FILENAME);
    Ok(path)
}

pub fn database_url(app: &tauri::AppHandle) -> io::Result<String> {
    let path = database_path(app)?;
    let path_str = path
        .to_str()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "Invalid database path"))?;
    Ok(format!("sqlite:{path_str}"))
}

pub fn whisper_model_path(app: &tauri::AppHandle, size: WhisperModelSize) -> io::Result<PathBuf> {
    let mut path = models_dir(app)?;
    path.push(size.filename());
    Ok(path)
}

pub fn models_dir(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let mut path = app
        .path()
        .app_data_dir()
        .map_err(|err| io::Error::other(err.to_string()))?;
    path.push(MODELS_DIR_NAME);
    fs::create_dir_all(&path)?;
    Ok(path)
}

pub fn storage_dir(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let mut path = app
        .path()
        .app_data_dir()
        .map_err(|err| io::Error::other(err.to_string()))?;
    path.push(STORAGE_DIR_NAME);
    fs::create_dir_all(&path)?;
    Ok(path)
}

pub fn logs_dir(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let path = app
        .path()
        .app_log_dir()
        .map_err(|err| io::Error::other(err.to_string()))?;
    fs::create_dir_all(&path)?;
    Ok(path)
}

pub fn startup_diagnostics_path(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let mut path = logs_dir(app)?;
    path.push("startup_diagnostics.log");
    Ok(path)
}
