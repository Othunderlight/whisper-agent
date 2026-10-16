[2026-10-16][08:53:20.486][INFO][desktop_lib::platform::linux::wl::compositor] Synced 2 GNOME compositor hotkeys
[2026-10-16][08:53:42.216][DEBUG][webview:debug@http://localhost:1420/node_modules/.vite/deps/@tauri-apps_plugin-log.js:71:12] Loading enterprise target
[2026-10-16][08:53:42.217][INFO][desktop_lib::commands] Reading enterprise target from "/home/omar/.config/com.voquill.desktop.local/enterprise.json"
[2026-10-16][08:53:42.219][DEBUG][webview:debug@http://localhost:1420/node_modules/.vite/deps/@tauri-apps_plugin-log.js:71:12] Enterprise target reloaded from {"path":"/home/omar/.config/com.voquill.desktop.local/enterprise.json","raw":null} null
[2026-10-16][08:53:42.573][INFO][zbus::connection::handshake::common] write_command; command=Auth(Some(External), Some([49, 48, 48, 48]))
[2026-10-16][08:53:42.573][INFO][zbus::connection::handshake::common] write_commands; commands=[Auth(Some(External), Some([49, 48, 48, 48]))] extra_bytes=None
[2026-10-16][08:53:42.573][INFO][tracing::span] read_command;
[2026-10-16][08:53:42.573][INFO][zbus::connection::handshake::common] read_commands; n_commands=1
[2026-10-16][08:53:42.574][INFO][zbus::connection::handshake::common] write_commands; commands=[NegotiateUnixFD, Begin] extra_bytes=Some([108, 1, 0, 1, 0, 0, 0, 0, 13, 0, 0, 0, 109, 0, 0, 0, 1, 1, 111, 0, 21, 0, 0, 0, 47, 111, 114, 103, 47, 102, 114, 101, 101, 100, 101, 115, 107, 116, 111, 112, 47, 68, 66, 117, 115, 0, 0, 0, 2, 1, 115, 0, 20, 0, 0, 0, 111, 114, 103, 46, 102, 114, 101, 101, 100, 101, 115, 107, 116, 111, 112, 46, 68, 66, 117, 115, 0, 0, 0, 0, 3, 1, 115, 0, 5, 0, 0, 0, 72, 101, 108, 108, 111, 0, 0, 0, 6, 1, 115, 0, 20, 0, 0, 0, 111, 114, 103, 46, 102, 114, 101, 101, 100, 101, 115, 107, 116, 111, 112, 46, 68, 66, 117, 115, 0, 0, 0, 0])
[2026-10-16][08:53:42.574][INFO][zbus::connection::handshake::common] read_commands; n_commands=1
[2026-10-16][08:53:42.575][DEBUG][xcap::platform::wayland_capture] org_gnome_shell_screenshot failed org.freedesktop.DBus.Error.AccessDenied: ScreenshotArea is not allowed
[2026-10-16][08:53:45.225][DEBUG][h2::client] binding client connection
[2026-10-16][08:53:45.226][DEBUG][h2::client] client connection bound
[2026-10-16][08:53:45.226][DEBUG][h2::codec::framed_write] send frame=Settings { flags: (0x0), enable_push: 0, initial_window_size: 2097152, max_frame_size: 16384, max_header_list_size: 16384 }
[2026-10-16][08:53:45.226][DEBUG][h2::proto::connection] Connection; peer=Client
[2026-10-16][08:53:45.226][DEBUG][h2::codec::framed_write] send frame=WindowUpdate { stream_id: StreamId(0), size_increment: 5177345 }
[2026-10-16][08:53:45.226][DEBUG][h2::codec::framed_write] send frame=Headers { stream_id: StreamId(1), flags: (0x4: END_HEADERS) }
[2026-10-16][08:53:45.227][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:45.227][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:45.227][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:45.227][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:45.340][DEBUG][h2::codec::framed_read] received frame=Settings { flags: (0x0), max_concurrent_streams: 100, initial_window_size: 65536, max_frame_size: 16777215 }
[2026-10-16][08:53:45.340][DEBUG][h2::codec::framed_write] send frame=Settings { flags: (0x1: ACK) }
[2026-10-16][08:53:45.340][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(0), size_increment: 2147418112 }
[2026-10-16][08:53:45.340][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:45.470][DEBUG][h2::codec::framed_read] received frame=Settings { flags: (0x1: ACK) }
[2026-10-16][08:53:45.471][DEBUG][h2::proto::settings] received settings ACK; applying Settings { flags: (0x0), enable_push: 0, initial_window_size: 2097152, max_frame_size: 16384, max_header_list_size: 16384 }
[2026-10-16][08:53:45.471][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 65536 }
[2026-10-16][08:53:45.471][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:45.591][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:45.591][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:45.591][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:45.750][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:45.751][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:45.751][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:45.751][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:45.751][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:45.876][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:45.876][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16393 }
[2026-10-16][08:53:45.876][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:45.876][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16393 }
[2026-10-16][08:53:45.876][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:45.988][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:45.988][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:45.988][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:45.988][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:45.988][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:46.110][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:46.110][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.111][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.111][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16402 }
[2026-10-16][08:53:46.111][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:46.247][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:46.247][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.247][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.247][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.247][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:46.362][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:46.362][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.362][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.362][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16402 }
[2026-10-16][08:53:46.362][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:46.513][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:46.513][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.513][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.514][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.514][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:46.659][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:46.659][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.660][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.660][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16402 }
[2026-10-16][08:53:46.660][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:46.784][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:46.785][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.785][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.785][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.785][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:46.908][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:46.908][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.908][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:46.909][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16402 }
[2026-10-16][08:53:46.909][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:47.041][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:47.042][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.042][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.042][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.042][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:47.162][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:47.162][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.162][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.162][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16402 }
[2026-10-16][08:53:47.162][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:47.292][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:47.292][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.292][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.292][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.293][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:47.421][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:47.421][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.422][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.422][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16402 }
[2026-10-16][08:53:47.422][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:47.544][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:47.545][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.545][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.545][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.545][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:47.655][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:47.655][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.656][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.656][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:47.777][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16402 }
[2026-10-16][08:53:47.777][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:47.777][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.777][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.777][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.778][DEBUG][h2::codec::framed_write] send frame=Data { stream_id: StreamId(1), flags: (0x1: END_STREAM) }
[2026-10-16][08:53:47.906][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:47.906][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:47.906][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:48.050][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16375 }
[2026-10-16][08:53:48.050][DEBUG][h2::codec::framed_read] received frame=WindowUpdate { stream_id: StreamId(1), size_increment: 16384 }
[2026-10-16][08:53:48.780][DEBUG][h2::codec::framed_read] received frame=Headers { stream_id: StreamId(1), flags: (0x4: END_HEADERS) }
[2026-10-16][08:53:48.889][DEBUG][h2::codec::framed_read] received frame=Data { stream_id: StreamId(1) }
[2026-10-16][08:53:48.889][DEBUG][h2::codec::framed_read] received frame=Data { stream_id: StreamId(1), flags: (0x1: END_STREAM) }
[2026-10-16][08:53:48.891][DEBUG][h2::codec::framed_write] send frame=GoAway { error_code: NO_ERROR, last_stream_id: StreamId(0) }
[2026-10-16][08:53:48.891][DEBUG][h2::proto::connection] Connection::poll; connection error error=GoAway(b"", NO_ERROR, Library)
[2026-10-16][08:53:48.898][DEBUG][sqlx::query] summary="INSERT INTO focus_checks ( …" db.statement="\n\nINSERT INTO focus_checks (\n             id, created_at, screenshot_path, status, distraction_score,\n             focused_probability, distracted_probability, neutral_probability,\n             confidence, error\n         )\n         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)\n" rows_affected=1 rows_returned=0 elapsed=1.768586ms elapsed_secs=0.001768586
