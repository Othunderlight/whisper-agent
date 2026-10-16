use std::fs;
use std::io;
use std::path::PathBuf;

use base64::{engine::general_purpose, Engine as _};
use tauri::Manager;
use xcap::Monitor;

use crate::domain::FocusScreenshot;

const SCREENSHOTS_DIR_NAME: &str = "focus-screenshots";

/// Root directory where focus screenshots are stored, one sub-directory per day.
pub fn screenshots_dir(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let mut path = app
        .path()
        .app_data_dir()
        .map_err(|err| io::Error::other(err.to_string()))?;
    path.push(SCREENSHOTS_DIR_NAME);
    fs::create_dir_all(&path)?;
    Ok(path)
}

fn today_dir(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let mut path = screenshots_dir(app)?;
    path.push(chrono::Local::now().format("%Y-%m-%d").to_string());
    fs::create_dir_all(&path)?;
    Ok(path)
}

/// Captures the primary monitor, saves it as a PNG under a dated directory, and
/// returns both the on-disk path and a `data:` URI ready to send to CLEF.
pub fn capture_primary_screenshot(app: &tauri::AppHandle) -> io::Result<FocusScreenshot> {
    let monitors = Monitor::all().map_err(|err| io::Error::other(err.to_string()))?;

    let monitor = monitors
        .iter()
        .find(|monitor| monitor.is_primary().unwrap_or(false))
        .or_else(|| monitors.first())
        .ok_or_else(|| io::Error::other("No monitor available for screenshot capture"))?;

    let image = monitor
        .capture_image()
        .map_err(|err| io::Error::other(err.to_string()))?;

    let mut path = today_dir(app)?;
    let filename = format!(
        "{}.png",
        chrono::Local::now().format("%H%M%S%.3f").to_string()
    );
    path.push(filename);

    image
        .save(&path)
        .map_err(|err| io::Error::other(err.to_string()))?;

    let bytes = fs::read(&path)?;
    let data_uri = format!(
        "data:image/png;base64,{}",
        general_purpose::STANDARD.encode(&bytes)
    );

    Ok(FocusScreenshot {
        path: path.to_string_lossy().to_string(),
        data_uri,
    })
}

/// Deletes a screenshot file, but only if it lives inside the managed
/// focus-screenshots directory. Missing files are treated as success.
pub fn delete_screenshot_file(app: &tauri::AppHandle, file_path: &str) -> io::Result<()> {
    let root = screenshots_dir(app)?;
    let path = PathBuf::from(file_path);

    if !path.starts_with(&root) {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Refusing to delete screenshot outside of managed directory",
        ));
    }

    match fs::remove_file(&path) {
        Ok(()) => Ok(()),
        Err(err) if err.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(err) => Err(err),
    }
}
