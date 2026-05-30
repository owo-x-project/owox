//! Git workflow endpoints.
//!
//! @spec SPEC-git-workflow
//! @spec SPEC-shared-http-api (Git)
//! @spec SPEC-shared-destructive-confirmation
//! @spec SPEC-shared-error-display
//! @spec SPEC-ui-diff-view
//!
//! Each handler resolves the selected project root via the workspace boundary
//! and delegates to [`owox_core::git`], whose every git invocation runs with
//! `current_dir` pinned to that validated repo root. `GitError` is mapped onto
//! the shared HTTP error envelope with the classified `kind` / status; the
//! redacted operation stdout / stderr is persisted to a `gitop_<id>` log so the
//! error / result carries a log reference.

use crate::error::AppError;
use crate::routes::AppRouter;
use crate::state::AppState;
use axum::Json;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::routing::{get, post};
use owox_core::git::{self, GitDiff, GitError, GitErrorKind, GitOp, OperationRequest};
use owox_core::http::{ApiError, ApiErrorResponse, ErrorKind, Recoverability};
use serde::{Deserialize, Serialize};

pub fn routes() -> AppRouter {
    AppRouter::new()
        .route("/api/projects/{project_id}/git/status", get(get_status))
        .route("/api/projects/{project_id}/git/diff", get(get_diff))
        .route("/api/projects/{project_id}/git/branches", get(get_branches))
        .route("/api/projects/{project_id}/git/log", get(get_log))
        .route(
            "/api/projects/{project_id}/git/operations",
            post(post_operation),
        )
}

const DEFAULT_DIFF_LIMIT: u64 = 65536;

async fn get_status(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
) -> Result<Json<git::GitStatus>, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let status = git::status(&project.path).map_err(|e| map_git_error(&state, e))?;
    Ok(Json(status))
}

async fn get_branches(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
) -> Result<Json<git::GitBranches>, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let branches = git::branches(&project.path).map_err(|e| map_git_error(&state, e))?;
    Ok(Json(branches))
}

#[derive(Debug, Deserialize)]
struct LogQuery {
    #[serde(default)]
    offset: Option<usize>,
    #[serde(default)]
    limit: Option<usize>,
}

async fn get_log(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Query(query): Query<LogQuery>,
) -> Result<Json<git::CommitLog>, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let offset = query.offset.unwrap_or(0);
    let limit = query.limit.unwrap_or(30).min(100);
    let log = git::commit_log(&project.path, offset, limit)
        .map_err(|e| map_git_error(&state, e))?;
    Ok(Json(log))
}

#[derive(Debug, Deserialize)]
struct DiffQuery {
    #[serde(default = "default_mode")]
    mode: String,
    #[serde(default)]
    path: Option<String>,
    #[serde(default)]
    offset: Option<u64>,
    #[serde(default)]
    limit: Option<u64>,
}

fn default_mode() -> String {
    "unstaged".to_string()
}

async fn get_diff(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Query(query): Query<DiffQuery>,
) -> Result<Json<GitDiff>, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let offset = query.offset.unwrap_or(0);
    let limit = query.limit.unwrap_or(DEFAULT_DIFF_LIMIT);
    let diff = git::diff(
        &project.path,
        &query.mode,
        query.path.as_deref(),
        offset,
        limit,
    )
    .map_err(|e| map_git_error(&state, e))?;
    Ok(Json(diff))
}

#[derive(Debug, Deserialize)]
struct OperationBody {
    op: String,
    #[serde(default)]
    paths: Vec<String>,
    #[serde(default)]
    message: Option<String>,
    #[serde(default)]
    branch: Option<String>,
    #[serde(default)]
    remote: Option<String>,
    #[serde(default)]
    confirm_token: Option<String>,
}

#[derive(Debug, Serialize)]
struct OperationResponse {
    command_id: String,
    status: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    exit_code: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    log_ref: Option<String>,
}

async fn post_operation(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Json(body): Json<OperationBody>,
) -> Result<(StatusCode, Json<OperationResponse>), AppError> {
    let project = state.boundary.find_project(&project_id)?;
    let Some(op) = GitOp::parse(&body.op) else {
        return Err(AppError::validation("Unknown git operation", "op"));
    };

    let request = OperationRequest {
        paths: body.paths,
        message: body.message,
        branch: body.branch,
        remote: body.remote,
        confirm_token: body.confirm_token,
    };

    let result = git::run_operation(&project.path, &project_id, op, &request)
        .map_err(|e| map_git_error(&state, e))?;

    // Persist redacted output to a gitop log so the result carries a log ref.
    let command_id = new_command_id();
    let log_ref = persist_operation_log(&state, &command_id, &result);

    let status = if result.exit_code == Some(0) {
        "succeeded"
    } else {
        "exited_nonzero"
    };
    let message = (!result.message.is_empty()).then(|| result.message.clone());

    Ok((
        StatusCode::ACCEPTED,
        Json(OperationResponse {
            command_id,
            status,
            exit_code: result.exit_code,
            message,
            log_ref,
        }),
    ))
}

/// Persist the redacted stdout / stderr of an operation to a `gitop_<id>` log.
/// Returns the log id on success; a failed persist is non-fatal (no log_ref).
fn persist_operation_log(
    state: &AppState,
    command_id: &str,
    result: &git::OperationResult,
) -> Option<String> {
    let id = command_id.strip_prefix("cmd_").unwrap_or(command_id);
    let log_id = format!("gitop_{id}");
    let mut bytes = Vec::new();
    if !result.stdout.is_empty() {
        bytes.extend_from_slice(result.stdout.as_bytes());
    }
    if !result.stderr.is_empty() {
        if !bytes.is_empty() {
            bytes.push(b'\n');
        }
        bytes.extend_from_slice(result.stderr.as_bytes());
    }
    if bytes.is_empty() {
        return None;
    }
    state
        .terminal
        .log_store()
        .append(&log_id, &bytes)
        .ok()
        .map(|_| log_id)
}

fn new_command_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("cmd_{nanos:032x}")
}

fn new_request_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("req_{nanos:032x}")
}

/// Map a git-domain error onto the shared HTTP error envelope.
fn map_git_error(state: &AppState, error: GitError) -> AppError {
    match error {
        GitError::Spawn(_) => internal_git_error("Git command failed to start", "command"),
        GitError::NotARepo => AppError::validation("Not a git repository", "project_id"),
        GitError::ConfirmationRequired(req) => {
            // Persist nothing; surface the derived token + targets so the UI can
            // confirm and retry. A typed conflict envelope with the confirm_token
            // target carries the affected target list in field_errors.
            confirmation_required_error(&req)
        }
        GitError::Operation {
            kind,
            message,
            exit_code,
        } => {
            // Persist the redacted git message to a log for the error log_ref.
            let log_ref = persist_error_log(state, &message);
            map_operation_kind(kind, &message, exit_code, log_ref)
        }
    }
}

fn persist_error_log(state: &AppState, message: &str) -> Option<String> {
    if message.is_empty() {
        return None;
    }
    let id = new_command_id();
    let log_id = format!("gitop_{}", id.strip_prefix("cmd_").unwrap_or(&id));
    state
        .terminal
        .log_store()
        .append(&log_id, message.as_bytes())
        .ok()
        .map(|_| log_id)
}

fn map_operation_kind(
    kind: GitErrorKind,
    message: &str,
    _exit_code: Option<i32>,
    log_ref: Option<String>,
) -> AppError {
    let (error_kind, status, recoverability, next_action, target) = match kind {
        GitErrorKind::Auth => (
            ErrorKind::Auth,
            StatusCode::UNAUTHORIZED,
            Recoverability::UserAction,
            "Check Git remote credentials",
            "git_remote",
        ),
        GitErrorKind::Network => (
            ErrorKind::Network,
            StatusCode::BAD_GATEWAY,
            Recoverability::Retry,
            "Check connectivity and retry",
            "git_remote",
        ),
        GitErrorKind::Conflict => (
            ErrorKind::Conflict,
            StatusCode::CONFLICT,
            Recoverability::UserAction,
            "Review changes and retry",
            "working_tree",
        ),
        GitErrorKind::NotFound => (
            ErrorKind::NotFound,
            StatusCode::NOT_FOUND,
            Recoverability::UserAction,
            "Refresh and retry",
            "git",
        ),
        GitErrorKind::Validation => (
            ErrorKind::Validation,
            StatusCode::BAD_REQUEST,
            Recoverability::UserAction,
            "Fix the request and retry",
            "request",
        ),
        GitErrorKind::ConfirmationRequired => (
            ErrorKind::Validation,
            StatusCode::BAD_REQUEST,
            Recoverability::UserAction,
            "Confirm the destructive operation and retry",
            "confirm_token",
        ),
        GitErrorKind::Unknown => (
            ErrorKind::Unknown,
            StatusCode::INTERNAL_SERVER_ERROR,
            Recoverability::None,
            "Inspect the log and retry if safe",
            "operation",
        ),
    };

    let display = if message.is_empty() {
        "Git operation failed".to_string()
    } else {
        message.to_string()
    };
    let error = ApiError {
        kind: error_kind,
        message: display,
        target: Some(target.to_string()),
        recoverability,
        next_action: Some(next_action.to_string()),
        log_ref,
        request_id: new_request_id(),
    };
    AppError::new(ApiErrorResponse::new(error), status)
}

/// A confirmation-required envelope: a validation error targeting `confirm_token`
/// whose `next_action` carries the derived token, with the affected targets
/// listed as field errors.
fn confirmation_required_error(req: &git::ConfirmationRequirement) -> AppError {
    let mut error = ApiError::validation(
        format!(
            "Destructive operation '{}' requires confirmation",
            req.op
        ),
        "confirm_token",
    );
    error.kind = ErrorKind::Validation;
    error.next_action = Some(format!("Retry with confirm_token={}", req.confirm_token));

    let field_errors = req
        .targets
        .iter()
        .map(|target| owox_core::http::FieldError {
            field: "target".to_string(),
            code: "confirm_required".to_string(),
            message: "Affected by the destructive operation".to_string(),
            expected: Some(req.confirm_token.clone()),
            actual: Some(target.clone()),
        })
        .collect::<Vec<_>>();

    AppError::new(ApiErrorResponse::new(error), StatusCode::BAD_REQUEST).with_field_errors(field_errors)
}

fn internal_git_error(message: &str, target: &str) -> AppError {
    let error = ApiError {
        kind: ErrorKind::Unknown,
        message: message.to_string(),
        target: Some(target.to_string()),
        recoverability: Recoverability::None,
        next_action: Some("Inspect the log and retry if safe".to_string()),
        log_ref: None,
        request_id: new_request_id(),
    };
    AppError::new(ApiErrorResponse::new(error), StatusCode::INTERNAL_SERVER_ERROR)
}
