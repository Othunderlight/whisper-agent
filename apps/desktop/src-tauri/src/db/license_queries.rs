use sqlx::{Row, SqlitePool};

pub async fn get_license_token(pool: SqlitePool) -> Result<Option<String>, sqlx::Error> {
    let row = sqlx::query("SELECT token FROM app_license WHERE id = 1")
        .fetch_optional(&pool)
        .await?;

    Ok(row.map(|row| row.get("token")))
}

pub async fn set_license_token(pool: SqlitePool, token: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO app_license (id, token)
         VALUES (1, ?1)
         ON CONFLICT(id) DO UPDATE SET token = excluded.token",
    )
    .bind(token)
    .execute(&pool)
    .await?;

    Ok(())
}

pub async fn clear_license_token(pool: SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM app_license WHERE id = 1")
        .execute(&pool)
        .await?;

    Ok(())
}
