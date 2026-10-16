CREATE TABLE IF NOT EXISTS focus_checks (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    screenshot_path TEXT NOT NULL,
    status TEXT NOT NULL,
    distraction_score REAL NOT NULL,
    focused_probability REAL NOT NULL,
    distracted_probability REAL NOT NULL,
    neutral_probability REAL NOT NULL,
    confidence REAL NOT NULL,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_focus_checks_created_at ON focus_checks (created_at DESC);

CREATE TABLE IF NOT EXISTS focus_settings (
    id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    account_id TEXT NOT NULL DEFAULT '',
    salt TEXT NOT NULL DEFAULT '',
    key_hash TEXT NOT NULL DEFAULT '',
    key_ciphertext TEXT NOT NULL DEFAULT '',
    key_suffix TEXT,
    task_description TEXT NOT NULL DEFAULT '',
    questions_json TEXT NOT NULL DEFAULT '',
    interval_minutes INTEGER NOT NULL DEFAULT 10,
    clean_history_daily INTEGER NOT NULL DEFAULT 1,
    notify_when_focused INTEGER NOT NULL DEFAULT 0
);
