use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use owox_core::db::{MetadataStore, ProjectRecord};
use owox_core::http::{ApiError, ApiErrorResponse};
use owox_core::workspace::{ProjectIdentity, WorkspaceBoundary, WorkspaceError};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub workspace_root: PathBuf,
    pub database_url: String,
}

impl ServerConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let workspace_root = std::env::var("OWOX_WORKSPACE_ROOT")
            .map(PathBuf::from)
            .unwrap_or(std::env::current_dir()?);
        let database_url = std::env::var("OWOX_DATABASE_URL")
            .unwrap_or_else(|_| "sqlite://owox.sqlite3?mode=rwc".to_string());
        Ok(Self {
            workspace_root,
            database_url,
        })
    }
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub boundary: Arc<WorkspaceBoundary>,
    pub store: MetadataStore,
}

impl AppState {
    pub async fn initialize(config: ServerConfig) -> anyhow::Result<Self> {
        let boundary = Arc::new(WorkspaceBoundary::new(config.workspace_root)?);
        let store = MetadataStore::connect(&config.database_url).await?;
        Ok(Self { boundary, store })
    }
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/api/projects", get(list_projects))
        .route("/api/projects/{project_id}", get(get_project))
        .route(
            "/api/projects/{project_id}/files/tree",
            get(not_implemented),
        )
        .route(
            "/api/projects/{project_id}/files/content",
            get(not_implemented).put(not_implemented),
        )
        .route(
            "/api/projects/{project_id}/files",
            post(not_implemented)
                .patch(not_implemented)
                .delete(not_implemented),
        )
        .route("/api/projects/{project_id}/sessions", post(not_implemented))
        .route(
            "/api/projects/{project_id}/sessions/{session_id}",
            get(not_implemented).delete(not_implemented),
        )
        .route(
            "/api/projects/{project_id}/logs/{log_id}",
            get(not_implemented).delete(not_implemented),
        )
        .route(
            "/api/projects/{project_id}/git/status",
            get(not_implemented),
        )
        .route("/api/projects/{project_id}/git/diff", get(not_implemented))
        .route(
            "/api/projects/{project_id}/git/operations",
            post(not_implemented),
        )
        .route("/api/plugins", get(not_implemented))
        .route("/api/events", get(ws_handler))
        .with_state(state)
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}

#[derive(Debug, Serialize)]
struct ProjectsResponse {
    projects: Vec<ProjectResponse>,
}

#[derive(Debug, Serialize)]
struct ProjectResponseEnvelope {
    project: ProjectResponse,
}

#[derive(Debug, Serialize)]
struct ProjectResponse {
    id: String,
    name: String,
    repo_kind: String,
    git_branch: Option<String>,
    status: String,
    last_opened_at: Option<i64>,
    warnings: Vec<String>,
}

impl From<ProjectIdentity> for ProjectResponse {
    fn from(project: ProjectIdentity) -> Self {
        Self {
            id: project.id,
            name: project.name,
            repo_kind: project.repo_kind,
            git_branch: project.git_branch,
            status: project.status,
            last_opened_at: project.last_opened_at,
            warnings: project.warnings,
        }
    }
}

async fn list_projects(State(state): State<AppState>) -> Result<Json<ProjectsResponse>, AppError> {
    let projects = state.boundary.discover_projects()?;
    let mut response_projects = Vec::new();

    for project in projects {
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
        response_projects.push(ProjectResponse::from(project));
    }

    Ok(Json(ProjectsResponse {
        projects: response_projects,
    }))
}

async fn get_project(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
) -> Result<Json<ProjectResponseEnvelope>, AppError> {
    let project = state.boundary.find_project(&project_id)?;
    Ok(Json(ProjectResponseEnvelope {
        project: ProjectResponse::from(project),
    }))
}

async fn not_implemented() -> AppError {
    AppError::not_implemented("route")
}

async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    let _ = socket
        .send(Message::Text(
            "{\"type\":\"sub.ack\",\"status\":\"connected\"}".into(),
        ))
        .await;
}

#[derive(Debug)]
pub struct AppError(ApiErrorResponse, StatusCode);

impl AppError {
    fn not_implemented(target: impl Into<String>) -> Self {
        Self(
            ApiErrorResponse::new(ApiError::not_implemented(target)),
            StatusCode::NOT_IMPLEMENTED,
        )
    }
}

impl From<WorkspaceError> for AppError {
    fn from(error: WorkspaceError) -> Self {
        match error {
            WorkspaceError::BoundaryViolation => Self(
                ApiErrorResponse::new(ApiError::boundary(
                    "Path is outside the selected project",
                    "path",
                )),
                StatusCode::BAD_REQUEST,
            ),
            WorkspaceError::ProjectUnavailable => Self(
                ApiErrorResponse::new(ApiError::validation("Project is unavailable", "project_id")),
                StatusCode::NOT_FOUND,
            ),
            _ => Self(
                ApiErrorResponse::new(ApiError::validation(
                    "Workspace is unavailable",
                    "workspace",
                )),
                StatusCode::INTERNAL_SERVER_ERROR,
            ),
        }
    }
}

impl From<sqlx::Error> for AppError {
    fn from(_: sqlx::Error) -> Self {
        Self(
            ApiErrorResponse::new(ApiError::validation(
                "Metadata store operation failed",
                "database",
            )),
            StatusCode::INTERNAL_SERVER_ERROR,
        )
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.1, Json(self.0)).into_response()
    }
}
