//! File / editor endpoints.
//!
//! @spec SPEC-shared-http-api (File / Editor)
//! @spec SPEC-ui-file-tree
//! @spec SPEC-ui-editor
//! @spec SPEC-shared-destructive-confirmation
//!
//! Each handler resolves the selected project root via the workspace boundary
//! and delegates to [`owox_core::fs`]. Filesystem-domain errors are mapped onto
//! the shared HTTP error envelope.

use crate::error::AppError;
use crate::routes::AppRouter;
use crate::state::AppState;
use axum::Json;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::routing::{get, post};
use owox_core::fs::{self, FsError};
use owox_core::http::{ApiError, ApiErrorResponse, ErrorKind, Recoverability};
use serde::Deserialize;

pub fn routes() -> AppRouter {
    AppRouter::new()
        .route("/api/projects/{project_id}/files/tree", get(get_tree))
        .route(
            "/api/projects/{project_id}/files/content",
            get(get_content).put(put_content),
        )
        .route(
            "/api/projects/{project_id}/files",
            post(create_file).patch(rename_file).delete(delete_file),
        )
}

/// Map a filesystem-domain error onto the shared HTTP error envelope.
fn map_fs_error(error: FsError) -> AppError {
    match error {
        FsError::Boundary => AppError::boundary("Path is outside the selected project", "path"),
        FsError::NotFound => AppError::not_found("Resource not found", "path"),
        FsError::NotADirectory => AppError::validation("Path is not a directory", "path"),
        FsError::AlreadyExists => conflict_error("Resource already exists", "path"),
        FsError::Conflict => conflict_error("expected_version did not match current state", "path"),
        FsError::Io(_) => AppError::internal("Filesystem operation failed", "file"),
    }
}

/// Build a `409 Conflict` envelope inline (avoids editing the shared error.rs).
fn conflict_error(message: impl Into<String>, target: impl Into<String>) -> AppError {
    let error = ApiError {
        kind: ErrorKind::Conflict,
        message: message.into(),
        target: Some(target.into()),
        recoverability: Recoverability::UserAction,
        next_action: Some("Reload the file and retry".to_string()),
        log_ref: None,
        request_id: new_request_id(),
    };
    AppError::new(ApiErrorResponse::new(error), StatusCode::CONFLICT)
}

/// Generate an opaque request id without pulling in a uuid dependency on the
/// server crate. Uniqueness only needs to hold for error correlation.
fn new_request_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    format!("req_{nanos:032x}")
}

#[derive(Debug, Deserialize)]
struct TreeQuery {
    #[serde(default)]
    path: Option<String>,
}

async fn get_tree(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Query(query): Query<TreeQuery>,
) -> Result<Json<fs::TreeListing>, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let path = query.path.unwrap_or_default();
    let listing = fs::read_tree(&state.boundary, &project.path, &path).map_err(map_fs_error)?;
    Ok(Json(listing))
}

#[derive(Debug, Deserialize)]
struct ContentQuery {
    path: String,
    #[serde(default)]
    offset: Option<u64>,
    #[serde(default)]
    limit: Option<u64>,
}

const DEFAULT_LIMIT: u64 = 65536;

async fn get_content(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Query(query): Query<ContentQuery>,
) -> Result<Json<fs::FileContent>, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let offset = query.offset.unwrap_or(0);
    let limit = query.limit.unwrap_or(DEFAULT_LIMIT);
    let content = fs::read_content(&state.boundary, &project.path, &query.path, offset, limit)
        .map_err(map_fs_error)?;
    Ok(Json(content))
}

#[derive(Debug, Deserialize)]
struct WriteBody {
    path: String,
    content: String,
    #[serde(default)]
    expected_version: Option<String>,
}

async fn put_content(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Json(body): Json<WriteBody>,
) -> Result<Json<fs::WriteResult>, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let result = fs::write_content(
        &state.boundary,
        &project.path,
        &body.path,
        &body.content,
        body.expected_version.as_deref(),
    )
    .map_err(map_fs_error)?;
    Ok(Json(result))
}

#[derive(Debug, Deserialize)]
struct CreateBody {
    path: String,
    kind: String,
    #[serde(default)]
    content: Option<String>,
}

async fn create_file(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Json(body): Json<CreateBody>,
) -> Result<(StatusCode, Json<fs::CreateResult>), AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let result = fs::create_entry(
        &state.boundary,
        &project.path,
        &body.path,
        &body.kind,
        body.content.as_deref(),
    )
    .map_err(map_fs_error)?;
    Ok((StatusCode::CREATED, Json(result)))
}

#[derive(Debug, Deserialize)]
struct RenameBody {
    path: String,
    target_path: String,
    #[serde(default)]
    expected_version: Option<String>,
}

async fn rename_file(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Json(body): Json<RenameBody>,
) -> Result<Json<fs::RenameResult>, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let result = fs::rename_entry(
        &state.boundary,
        &project.path,
        &body.path,
        &body.target_path,
        body.expected_version.as_deref(),
    )
    .map_err(map_fs_error)?;
    Ok(Json(result))
}

#[derive(Debug, Deserialize)]
struct DeleteBody {
    path: String,
    #[serde(default)]
    confirm_token: Option<String>,
}

/// Server-derivable confirmation token for a destructive file delete.
///
/// @spec SPEC-shared-destructive-confirmation
fn delete_confirm_token(project_id: &str, path: &str) -> String {
    format!("confirm:{project_id}:{path}")
}

async fn delete_file(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Json(body): Json<DeleteBody>,
) -> Result<StatusCode, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let expected = delete_confirm_token(&project_id, &body.path);
    match body.confirm_token.as_deref() {
        Some(token) if token == expected => {}
        _ => {
            return Err(AppError::validation(
                "Destructive delete requires a matching confirm_token",
                "confirm_token",
            ));
        }
    }
    fs::delete_entry(&state.boundary, &project.path, &body.path).map_err(map_fs_error)?;
    Ok(StatusCode::NO_CONTENT)
}
