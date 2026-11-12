use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tauri::ipc::Channel;
use tauri::Manager;
use tauri_plugin_shell::process::{CommandChild, CommandEvent, TerminatedPayload};
use tauri_plugin_shell::ShellExt;

use crate::system::paths;

#[derive(Default)]
pub struct SidecarProcesses(Mutex<HashMap<u32, CommandChild>>);

#[derive(Clone, serde::Serialize)]
#[serde(tag = "event", content = "payload")]
pub enum SidecarEvent {
    Stdout(String),
    Stderr(String),
    Terminated(TerminatedPayload),
    Error(String),
}

pub fn spawn(
    app: &tauri::AppHandle,
    program: &str,
    args: Vec<String>,
    env: Option<HashMap<String, String>>,
    cwd: Option<PathBuf>,
    on_event: Channel<SidecarEvent>,
) -> Result<u32, String> {
    let path = resolve_path(program)?;
    log::info!("Spawning sidecar {program} from {}", path.display());

    let mut command = app.shell().command(&path).args(args);
    if let Some(env) = env {
        command = command.envs(env);
    }
    if let Some(cwd) = cwd {
        command = command.current_dir(cwd);
    }

    let (mut rx, child) = command.spawn().map_err(|err| {
        format!(
            "Failed to spawn sidecar {program} at {}: {err}",
            path.display()
        )
    })?;
    let pid = child.pid();

    if let Some(processes) = app.try_state::<SidecarProcesses>() {
        processes.0.lock().unwrap().insert(pid, child);
    }

    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            let js_event = match event {
                CommandEvent::Stdout(line) => {
                    SidecarEvent::Stdout(String::from_utf8_lossy(&line).into_owned())
                }
                CommandEvent::Stderr(line) => {
                    SidecarEvent::Stderr(String::from_utf8_lossy(&line).into_owned())
                }
                CommandEvent::Error(err) => SidecarEvent::Error(err),
                CommandEvent::Terminated(payload) => {
                    if let Some(processes) = app.try_state::<SidecarProcesses>() {
                        processes.0.lock().unwrap().remove(&pid);
                    }
                    SidecarEvent::Terminated(payload)
                }
                _ => continue,
            };

            if on_event.send(js_event).is_err() {
                break;
            }
        }
    });

    Ok(pid)
}

pub fn write(app: &tauri::AppHandle, pid: u32, buffer: &[u8]) -> Result<(), String> {
    if let Some(processes) = app.try_state::<SidecarProcesses>() {
        if let Some(child) = processes.0.lock().unwrap().get_mut(&pid) {
            child.write(buffer).map_err(|err| err.to_string())?;
        }
    }
    Ok(())
}

pub fn kill(app: &tauri::AppHandle, pid: u32) -> Result<(), String> {
    if let Some(processes) = app.try_state::<SidecarProcesses>() {
        if let Some(child) = processes.0.lock().unwrap().remove(&pid) {
            child.kill().map_err(|err| err.to_string())?;
        }
    }
    Ok(())
}

fn resolve_path(program: &str) -> Result<PathBuf, String> {
    let exe_dir =
        paths::exe_dir().map_err(|err| format!("Failed to locate executable directory: {err}"))?;
    let file_name = Path::new(program)
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| format!("Invalid sidecar program: {program}"))?;

    let mut path = exe_dir.join(file_name);

    if cfg!(target_os = "windows") && !path.extension().is_some_and(|ext| ext == "exe") {
        path.as_mut_os_string().push(".exe");
    }

    if path.exists() {
        Ok(path)
    } else {
        Err(format!("Sidecar {program} not found at {}", path.display()))
    }
}
