use serde::{Deserialize, Serialize};

/// A single focus check result produced by the CLEF vision model for one
/// screenshot. `status` is one of "focused" | "distracted" | "neutral" | "error".
#[derive(Clone, Debug, Deserialize, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FocusCheck {
    pub id: String,
    pub created_at: i64,
    pub screenshot_path: String,
    pub status: String,
    pub distraction_score: f64,
    pub focused_probability: f64,
    pub distracted_probability: f64,
    pub neutral_probability: f64,
    pub confidence: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Raw arguments accepted by the `focus_check_create` command. The timestamp is
/// assigned by the backend, not the caller.
#[derive(Clone, Debug, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FocusCheckCreateArgs {
    pub id: String,
    pub screenshot_path: String,
    pub status: String,
    pub distraction_score: f64,
    pub focused_probability: f64,
    pub distracted_probability: f64,
    pub neutral_probability: f64,
    pub confidence: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Persisted focus settings row. The Cloudflare API token is stored encrypted
/// (salt / key_hash / key_ciphertext) exactly like API keys.
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusSettingsRecord {
    pub id: String,
    pub enabled: bool,
    pub account_id: String,
    pub salt: String,
    pub key_hash: String,
    pub key_ciphertext: String,
    pub key_suffix: Option<String>,
    pub task_description: String,
    pub questions_json: String,
    pub interval_minutes: i64,
    pub clean_history_daily: bool,
    pub notify_when_focused: bool,
}

/// Arguments accepted by the `focus_settings_set` command. The token is raw and
/// only re-encrypted when provided; `None` keeps the stored token untouched.
#[derive(Clone, Debug, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FocusSettingsSaveRequest {
    pub enabled: bool,
    pub account_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
    pub task_description: String,
    pub questions_json: String,
    pub interval_minutes: i64,
    pub clean_history_daily: bool,
    pub notify_when_focused: bool,
}

/// Focus settings as exposed to the frontend. The stored token is revealed
/// (`token_full`) so the webview can call the Cloudflare CLEF API directly.
#[derive(Clone, Debug, Deserialize, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FocusSettingsView {
    pub enabled: bool,
    pub account_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token_suffix: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token_full: Option<String>,
    pub task_description: String,
    pub questions_json: String,
    pub interval_minutes: i64,
    pub clean_history_daily: bool,
    pub notify_when_focused: bool,
}

/// Result of a screenshot capture: the on-disk path (for history) and a data
/// URI (ready to send to the CLEF model).
#[derive(Clone, Debug, Deserialize, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FocusScreenshot {
    pub path: String,
    pub data_uri: String,
}

impl FocusSettingsRecord {
    pub fn into_view(self, token_full: Option<String>) -> FocusSettingsView {
        FocusSettingsView {
            enabled: self.enabled,
            account_id: self.account_id,
            token_suffix: self.key_suffix,
            token_full,
            task_description: self.task_description,
            questions_json: self.questions_json,
            interval_minutes: self.interval_minutes,
            clean_history_daily: self.clean_history_daily,
            notify_when_focused: self.notify_when_focused,
        }
    }
}
