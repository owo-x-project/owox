//! Terminal session HTTP endpoints.
//!
//! @spec SPEC-shared-http-api (Terminal section)
//! @spec SPEC-runtime-terminal-session (5-state lifecycle)
//! @spec SPEC-runtime-terminal-log-reconnect (log range = reconnect replay)
//! @spec SPEC-shared-workspace-boundary (cwd resolved inside the project repo)
//!
//! Terminal IO and resize travel over the WebSocket (`/api/events`), not HTTP.
//! These endpoints manage the session resource (create/list/get/delete) and the
//! append-log range read used to replay output after a browser reload.

use crate::error::AppError;
use crate::routes::AppRouter;
use crate::state::AppState;
use axum::Json;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::routing::get;
use owox_core::db::{ProjectRecord, SessionRecord};
use owox_core::log_store::LogRange;
use owox_core::terminal::{CreateSession, SessionInfo, SessionState, TerminalError};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub fn routes() -> AppRouter {
    AppRouter::new()
        .route(
            "/api/projects/{project_id}/sessions",
            get(list_sessions).post(create_session),
        )
        .route(
            "/api/projects/{project_id}/sessions/{session_id}",
            get(get_session).delete(delete_session),
        )
        .route(
            "/api/projects/{project_id}/sessions/{session_id}/log",
            get(get_session_log),
        )
}

const DEFAULT_COLS: u16 = 80;
const DEFAULT_ROWS: u16 = 24;
const DEFAULT_LOG_LIMIT: u64 = 65536;

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn map_terminal_error(error: TerminalError) -> AppError {
    match error {
        TerminalError::Boundary => {
            AppError::boundary("Path is outside the selected project", "cwd")
        }
        TerminalError::NotFound => AppError::not_found("Session is unavailable", "session_id"),
        TerminalError::SpawnFailed(_) | TerminalError::Io(_) => {
            AppError::internal("Terminal session failed", "session")
        }
    }
}

#[derive(Debug, Deserialize)]
struct CreateSessionRequest {
    #[serde(default = "default_cwd")]
    cwd: String,
    #[serde(default)]
    command: String,
    #[serde(default)]
    args: Vec<String>,
    #[serde(default)]
    env: BTreeMap<String, String>,
    #[serde(default)]
    cols: Option<u16>,
    #[serde(default)]
    rows: Option<u16>,
    #[serde(default)]
    label: Option<String>,
}

fn default_cwd() -> String {
    ".".to_string()
}

#[derive(Debug, Serialize)]
struct CreateSessionResponse {
    session: CreatedSession,
}

#[derive(Debug, Serialize)]
struct CreatedSession {
    id: String,
    state: SessionState,
    label: Option<String>,
}

/// POST /api/projects/{project_id}/sessions
async fn create_session(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Json(request): Json<CreateSessionRequest>,
) -> Result<(StatusCode, Json<CreateSessionResponse>), AppError> {
    let project = state.boundary.find_project(&project_id)?;

    let create = CreateSession {
        project_id: project_id.clone(),
        cwd: request.cwd.clone(),
        command: request.command,
        args: request.args,
        env: request.env,
        cols: request.cols.unwrap_or(DEFAULT_COLS),
        rows: request.rows.unwrap_or(DEFAULT_ROWS),
        label: request.label.clone(),
    };

    let info = state
        .terminal
        .create_session(&state.boundary, &project.path, create, now_ms())
        .map_err(map_terminal_error)?;

    // Ensure the project row exists so the session FK resolves regardless of
    // whether the client listed projects first.
    state
        .store
        .projects()
        .upsert(&ProjectRecord {
            id: project.id.clone(),
            name: project.name.clone(),
            repo_kind: project.repo_kind.clone(),
            status: project.status.clone(),
            git_branch: project.git_branch.clone(),
            last_opened_at: project.last_opened_at,
        })
        .await?;

    // Persist session metadata (SQLite is the durable side of reconnect).
    state
        .store
        .sessions()
        .upsert(&session_record(&info, request.cols, request.rows))
        .await?;

    Ok((
        StatusCode::CREATED,
        Json(CreateSessionResponse {
            session: CreatedSession {
                id: info.id,
                state: info.state,
                label: info.label,
            },
        }),
    ))
}

fn session_record(info: &SessionInfo, cols: Option<u16>, rows: Option<u16>) -> SessionRecord {
    SessionRecord {
        id: info.id.clone(),
        project_id: info.project_id.clone(),
        command: info.command.clone(),
        cwd: info.cwd.clone(),
        state: info.state.as_str().to_string(),
        started_at: info.started_at,
        ended_at: info.ended_at,
        log_id: Some(info.log_id.clone()),
        label: info.label.clone(),
        cols: cols.map(i64::from),
        rows: rows.map(i64::from),
        exit_code: info.exit_code.map(i64::from),
        pid: info.pid.map(i64::from),
    }
}

#[derive(Debug, Serialize)]
struct SessionsListResponse {
    sessions: Vec<SessionSummary>,
}

#[derive(Debug, Serialize)]
struct SessionSummary {
    id: String,
    label: Option<String>,
    state: String,
    cwd: String,
    created_at: i64,
}

/// GET /api/projects/{project_id}/sessions
///
/// Merges durable DB metadata with live registry state: the live state wins for
/// any session still in the registry, so UI sees the current 5-state value.
/// Sessions that are recorded as creating/running in the DB but absent from the
/// live registry (e.g. after a server restart) are silently pruned.
async fn list_sessions(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
) -> Result<Json<SessionsListResponse>, AppError> {
    state.boundary.find_project(&project_id)?;

    let records = state.store.sessions().list_by_project(&project_id).await?;
    let mut sessions = Vec::new();
    for record in records {
        let live_state = state
            .terminal
            .snapshot(&record.id)
            .map(|info| info.state.as_str().to_string());

        let is_active_in_db = record.state == "creating" || record.state == "running";
        if is_active_in_db && live_state.is_none() {
            // Stale session: DB says active but no live process exists.
            // Remove the DB record silently.
            let _ = state.store.sessions().delete(&record.id).await;
            continue;
        }

        sessions.push(SessionSummary {
            id: record.id,
            label: record.label,
            state: live_state.unwrap_or(record.state),
            cwd: record.cwd,
            created_at: record.started_at,
        });
    }

    Ok(Json(SessionsListResponse { sessions }))
}

#[derive(Debug, Serialize)]
struct SessionDetailResponse {
    session: SessionDetail,
}

#[derive(Debug, Serialize)]
struct SessionDetail {
    id: String,
    state: String,
    exit_code: Option<i32>,
    started_at: i64,
    ended_at: Option<i64>,
}

/// GET /api/projects/{project_id}/sessions/{session_id}
async fn get_session(
    State(state): State<AppState>,
    Path((project_id, session_id)): Path<(String, String)>,
) -> Result<Json<SessionDetailResponse>, AppError> {
    state.boundary.find_project(&project_id)?;

    // Live registry first; fall back to durable DB record.
    if let Some(info) = state.terminal.snapshot(&session_id) {
        return Ok(Json(SessionDetailResponse {
            session: SessionDetail {
                id: info.id,
                state: info.state.as_str().to_string(),
                exit_code: info.exit_code,
                started_at: info.started_at,
                ended_at: info.ended_at,
            },
        }));
    }

    let record = state
        .store
        .sessions()
        .get(&session_id)
        .await?
        .ok_or_else(|| AppError::not_found("Session is unavailable", "session_id"))?;

    Ok(Json(SessionDetailResponse {
        session: SessionDetail {
            id: record.id,
            state: record.state,
            exit_code: record.exit_code.map(|c| c as i32),
            started_at: record.started_at,
            ended_at: record.ended_at,
        },
    }))
}

/// DELETE /api/projects/{project_id}/sessions/{session_id}
async fn delete_session(
    State(state): State<AppState>,
    Path((project_id, session_id)): Path<(String, String)>,
) -> Result<StatusCode, AppError> {
    state.boundary.find_project(&project_id)?;

    let now = now_ms();
    // Attempt to stop the live process; ignore NotFound (already exited or
    // only exists in DB after a server restart).
    match state.terminal.stop_session(&session_id, now) {
        Ok(()) => {}
        Err(owox_core::terminal::TerminalError::NotFound) => {}
        Err(e) => return Err(map_terminal_error(e)),
    }

    // Remove the session record from the database entirely.
    let _ = state.store.sessions().delete(&session_id).await;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
struct LogQuery {
    #[serde(default)]
    offset: Option<u64>,
    #[serde(default)]
    limit: Option<u64>,
}

/// GET /api/projects/{project_id}/sessions/{session_id}/log
///
/// Range-read of the per-session append log. This is the reconnect tail-replay
/// path: a freshly reconnected client fetches the log range, then attaches a
/// WebSocket for the live tail.
async fn get_session_log(
    State(state): State<AppState>,
    Path((project_id, session_id)): Path<(String, String)>,
    Query(query): Query<LogQuery>,
) -> Result<Json<LogRange>, AppError> {
    state.boundary.find_project(&project_id)?;

    let log_id = owox_core::terminal::TerminalRegistry::log_id_for(&session_id);
    let offset = query.offset.unwrap_or(0);
    let limit = query.limit.unwrap_or(DEFAULT_LOG_LIMIT);

    let range = state
        .terminal
        .log_store()
        .read_range(&log_id, offset, limit)
        .map_err(|error| match error {
            owox_core::log_store::LogStoreError::NotFound => {
                AppError::not_found("Log is unavailable", "log_id")
            }
            owox_core::log_store::LogStoreError::InvalidId => {
                AppError::validation("Invalid session id", "session_id")
            }
            owox_core::log_store::LogStoreError::Io(_) => {
                AppError::internal("Log read failed", "log")
            }
        })?;

    Ok(Json(range))
}
