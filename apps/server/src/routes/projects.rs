use crate::error::AppError;
use crate::routes::AppRouter;
use crate::state::AppState;
use axum::Json;
use axum::extract::{Path, State};
use axum::routing::get;
use owox_core::db::ProjectRecord;
use owox_core::workspace::ProjectIdentity;
use serde::Serialize;

pub fn routes() -> AppRouter {
    AppRouter::new()
        .route("/api/projects", get(list_projects))
        .route("/api/projects/{project_id}", get(get_project))
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
