//! Log range-read / delete endpoints.
//!
//! @spec SPEC-shared-http-api (Log)
//! @spec SPEC-ui-log-view
//! @adr ADR-0004 (logs live under the managed data dir)
//!
//! The log store root is `data_dir/logs`. `log_id` is validated by the store
//! so traversal attempts surface as a validation error.

use crate::error::AppError;
use crate::routes::AppRouter;
use crate::state::AppState;
use axum::Json;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::routing::get;
use owox_core::log_store::{LogRange, LogStore, LogStoreError};
use serde::Deserialize;

pub fn routes() -> AppRouter {
    AppRouter::new().route("/api/logs/{log_id}", get(get_log).delete(delete_log))
}

const DEFAULT_LIMIT: u64 = 65536;

fn store(state: &AppState) -> LogStore {
    LogStore::new(state.data_dir.join("logs"))
}

fn map_log_error(error: LogStoreError) -> AppError {
    match error {
        LogStoreError::InvalidId => AppError::validation("Invalid log id", "log_id"),
        LogStoreError::NotFound => AppError::not_found("Log is unavailable", "log_id"),
        LogStoreError::Io(_) => AppError::internal("Log read failed", "log"),
    }
}

#[derive(Debug, Deserialize)]
struct LogQuery {
    #[serde(default)]
    offset: Option<u64>,
    #[serde(default)]
    limit: Option<u64>,
}

async fn get_log(
    State(state): State<AppState>,
    Path(log_id): Path<String>,
    Query(query): Query<LogQuery>,
) -> Result<Json<LogRange>, AppError> {
    let offset = query.offset.unwrap_or(0);
    let limit = query.limit.unwrap_or(DEFAULT_LIMIT);
    let range = store(&state)
        .read_range(&log_id, offset, limit)
        .map_err(map_log_error)?;
    Ok(Json(range))
}

async fn delete_log(
    State(state): State<AppState>,
    Path(log_id): Path<String>,
) -> Result<StatusCode, AppError> {
    store(&state).delete(&log_id).map_err(map_log_error)?;
    Ok(StatusCode::NO_CONTENT)
}
