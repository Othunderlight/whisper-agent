use crate::platform::paste_keybind::{parse_paste_keystroke, PasteKeystroke};
use std::io::{Read, Write};
use std::process::{Child, Command, ExitStatus, Stdio};
use std::thread;
use std::time::{Duration, Instant};

/// Mirrors the clipboard restore delay so both selections return together.
const PRIMARY_RESTORE_DELAY_MS: u64 = 800;
/// wl-copy and xsel fork a background process that takes ownership of the
/// selection asynchronously; poll until the new owner is actually readable
/// so the paste keystroke cannot race it.
const PRIMARY_SET_TIMEOUT_MS: u64 = 500;
/// Selection helpers wait on the process owning the selection and block
/// indefinitely when that owner is unresponsive, which would stall the paste
/// forever. Every helper therefore runs under this hard deadline.
const SELECTION_COMMAND_TIMEOUT_MS: u64 = 1000;

fn wait_with_deadline(child: &mut Child, program: &str) -> Result<ExitStatus, String> {
    let deadline = Instant::now() + Duration::from_millis(SELECTION_COMMAND_TIMEOUT_MS);
    loop {
        match child.try_wait() {
            Ok(Some(status)) => return Ok(status),
            Ok(None) if Instant::now() < deadline => {
                thread::sleep(Duration::from_millis(20));
            }
            Ok(None) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(format!(
                    "{program} timed out after {SELECTION_COMMAND_TIMEOUT_MS}ms"
                ));
            }
            Err(err) => return Err(format!("{program} failed: {err}")),
        }
    }
}

fn drain(pipe: Option<impl Read>) -> String {
    let mut output = String::new();
    if let Some(mut pipe) = pipe {
        let _ = pipe.read_to_string(&mut output);
    }
    output
}

/// Reads a selection. Readers never fork, so their output pipes close with
/// them and are safe to drain once they exit.
fn selection_read(program: &str, args: &[&str]) -> Result<String, String> {
    let mut child = Command::new(program)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|err| format!("{program} failed to start: {err}"))?;

    let status = wait_with_deadline(&mut child, program)?;
    let stdout = drain(child.stdout.take());
    let stderr = drain(child.stderr.take());

    if !status.success() {
        return Err(format!("{program} exited with {status}: {}", stderr.trim()));
    }

    Ok(stdout)
}

/// Claims a selection. These helpers fork a background owner that inherits the
/// standard pipes, so their output is discarded: draining those pipes would
/// block until the forked owner is itself replaced.
fn selection_write(program: &str, args: &[&str], text: &str) -> Result<(), String> {
    let mut child = Command::new(program)
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|err| format!("{program} failed to start: {err}"))?;

    let write_result = child
        .stdin
        .take()
        .ok_or_else(|| format!("{program} stdin unavailable"))
        .and_then(|mut pipe| {
            pipe.write_all(text.as_bytes())
                .map_err(|err| format!("{program} failed to accept text: {err}"))
        });

    let status = wait_with_deadline(&mut child, program);
    write_result?;
    status.map(|_| ())
}

/// Terminals bind Shift+Insert and middle-click to the PRIMARY selection,
/// which is a separate selection from the CLIPBOARD the paste backends write.
fn primary_get() -> Result<String, String> {
    if super::detect::is_wayland() {
        selection_read("wl-paste", &["-p", "--no-newline"])
    } else {
        selection_read("xsel", &["--primary", "--output"])
            .or_else(|_| selection_read("xclip", &["-selection", "primary", "-out"]))
    }
}

fn primary_set(text: &str) -> Result<(), String> {
    if super::detect::is_wayland() {
        selection_write("wl-copy", &["-p"], text)
    } else {
        selection_write("xsel", &["--primary", "--input"], text)
            .or_else(|_| selection_write("xclip", &["-selection", "primary", "-in"], text))
    }
}

fn primary_set_verified(text: &str) -> Result<(), String> {
    primary_set(text)?;

    let deadline = Instant::now() + Duration::from_millis(PRIMARY_SET_TIMEOUT_MS);
    loop {
        if primary_get().ok().as_deref() == Some(text) {
            return Ok(());
        }
        if Instant::now() >= deadline {
            return Err("primary selection owner did not take over in time".to_string());
        }
        thread::sleep(Duration::from_millis(20));
    }
}

fn restore_primary_selection(previous: Option<String>, pasted: String) {
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(PRIMARY_RESTORE_DELAY_MS));
        // Leave it alone if the user has selected something since the paste.
        if primary_get().ok().as_deref() != Some(pasted.as_str()) {
            return;
        }
        if let Some(previous) = previous {
            let _ = primary_set(&previous);
        }
    });
}

pub(crate) fn type_text_into_focused_field(
    text: &str,
    delay_ms: u64,
    cancel_flag: &std::sync::atomic::AtomicBool,
) -> Result<(), String> {
    if text.trim().is_empty() {
        return Ok(());
    }

    if super::detect::is_wayland() {
        super::wl::input::type_text_into_focused_field(text, delay_ms, cancel_flag)
    } else {
        super::x11::input::type_text_into_focused_field(text, delay_ms, cancel_flag)
    }
}

/// When the PRIMARY selection cannot be written, a Shift+Insert keystroke
/// would paste whatever stale content it already holds, so fall back to
/// pasting the CLIPBOARD the transcript was written to instead.
fn clipboard_fallback_keybind(keybind: Option<&str>) -> Option<&str> {
    match parse_paste_keystroke(keybind) {
        PasteKeystroke::ShiftInsert => Some("ctrl+shift+v"),
        _ => keybind,
    }
}

pub(crate) fn paste_text_into_focused_field(
    text: &str,
    keybind: Option<&str>,
    skip_clipboard_restore: bool,
) -> Result<(), String> {
    if text.trim().is_empty() {
        return Ok(());
    }

    let override_text = std::env::var("VOQUILL_DEBUG_PASTE_TEXT").ok();
    let target = override_text.as_deref().unwrap_or(text);
    log::info!(
        "attempting to inject text ({} chars)",
        target.chars().count()
    );

    let previous_primary = if skip_clipboard_restore {
        None
    } else {
        primary_get().ok()
    };
    let keybind = match primary_set_verified(target) {
        Ok(()) => {
            log::info!("primary selection mirrored for terminal paste");
            keybind
        }
        Err(err) => {
            log::warn!("Could not mirror transcript into the primary selection: {err}");
            clipboard_fallback_keybind(keybind)
        }
    };

    let result = if super::detect::is_wayland() {
        log::info!("Wayland session detected");
        super::wl::input::paste_text(target, keybind, skip_clipboard_restore)
    } else {
        super::x11::input::paste_text(target, keybind, skip_clipboard_restore)
    };

    if result.is_ok() && !skip_clipboard_restore {
        restore_primary_selection(previous_primary, target.to_string());
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shift_insert_falls_back_to_the_clipboard_binding_when_primary_is_unavailable() {
        assert_eq!(
            clipboard_fallback_keybind(Some("shift+insert")),
            Some("ctrl+shift+v")
        );
    }

    #[test]
    fn clipboard_bindings_are_left_alone() {
        assert_eq!(
            clipboard_fallback_keybind(Some("ctrl+shift+v")),
            Some("ctrl+shift+v")
        );
        assert_eq!(clipboard_fallback_keybind(Some("ctrl+v")), Some("ctrl+v"));
        assert_eq!(clipboard_fallback_keybind(None), None);
    }
}
