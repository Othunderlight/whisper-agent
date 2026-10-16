use sqlx::{sqlite::SqliteRow, Row, SqlitePool};

use crate::domain::{FocusCheck, FocusSettingsRecord};

/// The focus settings table holds exactly one row; this is its fixed primary key.
pub const SETTINGS_ROW_ID: &str = "default";

fn row_to_focus_check(row: SqliteRow) -> Result<FocusCheck, sqlx::Error> {
    Ok(FocusCheck {
        id: row.get::<String, _>("id"),
        created_at: row.get::<i64, _>("created_at"),
        screenshot_path: row.get::<String, _>("screenshot_path"),
        status: row.get::<String, _>("status"),
        distraction_score: row.get::<f64, _>("distraction_score"),
        focused_probability: row.get::<f64, _>("focused_probability"),
        distracted_probability: row.get::<f64, _>("distracted_probability"),
        neutral_probability: row.get::<f64, _>("neutral_probability"),
        confidence: row.get::<f64, _>("confidence"),
        error: row.get::<Option<String>, _>("error"),
    })
}

fn row_to_settings(row: SqliteRow) -> Result<FocusSettingsRecord, sqlx::Error> {
    Ok(FocusSettingsRecord {
        id: row.get::<String, _>("id"),
        enabled: row.get::<i64, _>("enabled") != 0,
        account_id: row.get::<String, _>("account_id"),
        salt: row.get::<String, _>("salt"),
        key_hash: row.get::<String, _>("key_hash"),
        key_ciphertext: row.get::<String, _>("key_ciphertext"),
        key_suffix: row.get::<Option<String>, _>("key_suffix"),
        task_description: row.get::<String, _>("task_description"),
        questions_json: row.get::<String, _>("questions_json"),
        interval_minutes: row.get::<i64, _>("interval_minutes"),
        clean_history_daily: row.get::<i64, _>("clean_history_daily") != 0,
        notify_when_focused: row.get::<i64, _>("notify_when_focused") != 0,
    })
}

pub async fn insert_focus_check(
    pool: SqlitePool,
    check: &FocusCheck,
) -> Result<FocusCheck, sqlx::Error> {
    sqlx::query(
        "INSERT INTO focus_checks (
             id, created_at, screenshot_path, status, distraction_score,
             focused_probability, distracted_probability, neutral_probability,
             confidence, error
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
    )
    .bind(&check.id)
    .bind(check.created_at)
    .bind(&check.screenshot_path)
    .bind(&check.status)
    .bind(check.distraction_score)
    .bind(check.focused_probability)
    .bind(check.distracted_probability)
    .bind(check.neutral_probability)
    .bind(check.confidence)
    .bind(&check.error)
    .execute(&pool)
    .await?;

    Ok(check.clone())
}

pub async fn fetch_focus_checks(
    pool: SqlitePool,
    limit: u32,
    offset: u32,
) -> Result<Vec<FocusCheck>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, created_at, screenshot_path, status, distraction_score,
                focused_probability, distracted_probability, neutral_probability,
                confidence, error
         FROM focus_checks
         ORDER BY created_at DESC
         LIMIT ?1 OFFSET ?2",
    )
    .bind(limit as i64)
    .bind(offset as i64)
    .fetch_all(&pool)
    .await?;

    rows.into_iter().map(row_to_focus_check).collect()
}

/// Deletes checks created before `before_timestamp` and returns their
/// screenshot paths so the caller can remove the backing files.
pub async fn delete_focus_checks_before(
    pool: SqlitePool,
    before_timestamp: i64,
) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT screenshot_path
         FROM focus_checks
         WHERE created_at < ?1",
    )
    .bind(before_timestamp)
    .fetch_all(&pool)
    .await?;

    let paths: Vec<String> = rows
        .into_iter()
        .map(|row| row.get::<String, _>("screenshot_path"))
        .collect();

    sqlx::query("DELETE FROM focus_checks WHERE created_at < ?1")
        .bind(before_timestamp)
        .execute(&pool)
        .await?;

    Ok(paths)
}

pub async fn fetch_focus_settings(
    pool: SqlitePool,
) -> Result<Option<FocusSettingsRecord>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, enabled, account_id, salt, key_hash, key_ciphertext, key_suffix,
                task_description, questions_json, interval_minutes,
                clean_history_daily, notify_when_focused
         FROM focus_settings
         WHERE id = ?1",
    )
    .bind(SETTINGS_ROW_ID)
    .fetch_optional(&pool)
    .await?;

    row.map(row_to_settings).transpose()
}

pub async fn upsert_focus_settings(
    pool: SqlitePool,
    settings: &FocusSettingsRecord,
) -> Result<FocusSettingsRecord, sqlx::Error> {
    sqlx::query(
        "INSERT INTO focus_settings (
             id, enabled, account_id, salt, key_hash, key_ciphertext, key_suffix,
             task_description, questions_json, interval_minutes,
             clean_history_daily, notify_when_focused
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
         ON CONFLICT(id) DO UPDATE SET
             enabled = excluded.enabled,
             account_id = excluded.account_id,
             salt = excluded.salt,
             key_hash = excluded.key_hash,
             key_ciphertext = excluded.key_ciphertext,
             key_suffix = excluded.key_suffix,
             task_description = excluded.task_description,
             questions_json = excluded.questions_json,
             interval_minutes = excluded.interval_minutes,
             clean_history_daily = excluded.clean_history_daily,
             notify_when_focused = excluded.notify_when_focused",
    )
    .bind(&settings.id)
    .bind(settings.enabled as i64)
    .bind(&settings.account_id)
    .bind(&settings.salt)
    .bind(&settings.key_hash)
    .bind(&settings.key_ciphertext)
    .bind(&settings.key_suffix)
    .bind(&settings.task_description)
    .bind(&settings.questions_json)
    .bind(settings.interval_minutes)
    .bind(settings.clean_history_daily as i64)
    .bind(settings.notify_when_focused as i64)
    .execute(&pool)
    .await?;

    Ok(settings.clone())
}
