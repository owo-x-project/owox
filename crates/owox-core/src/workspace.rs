use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Component, Path, PathBuf};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum WorkspaceError {
    #[error("workspace root is not a directory")]
    InvalidRoot,
    #[error("path is outside the selected project")]
    BoundaryViolation,
    #[error("project is unavailable")]
    ProjectUnavailable,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProjectIdentity {
    pub id: String,
    pub name: String,
    pub repo_kind: String,
    pub git_branch: Option<String>,
    pub status: String,
    pub last_opened_at: Option<i64>,
    pub warnings: Vec<String>,
    #[serde(skip)]
    pub path: PathBuf,
}

#[derive(Debug, Clone)]
pub struct WorkspaceBoundary {
    root: PathBuf,
}

impl WorkspaceBoundary {
    pub fn new(root: impl AsRef<Path>) -> Result<Self, WorkspaceError> {
        let canonical = fs::canonicalize(root)?;
        if !canonical.is_dir() {
            return Err(WorkspaceError::InvalidRoot);
        }
        Ok(Self { root: canonical })
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn discover_projects(&self) -> Result<Vec<ProjectIdentity>, WorkspaceError> {
        let mut projects = Vec::new();
        for entry in fs::read_dir(&self.root)? {
            let entry = entry?;
            let path = entry.path();
            if !path.is_dir() || !path.join(".git").exists() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            projects.push(ProjectIdentity {
                id: project_id_from_name(&name),
                name,
                repo_kind: "git".to_string(),
                git_branch: read_git_branch(&path).ok(),
                status: "available".to_string(),
                last_opened_at: None,
                warnings: Vec::new(),
                path,
            });
        }
        projects.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(projects)
    }

    pub fn find_project(&self, project_id: &str) -> Result<ProjectIdentity, WorkspaceError> {
        self.discover_projects()?
            .into_iter()
            .find(|project| project.id == project_id)
            .ok_or(WorkspaceError::ProjectUnavailable)
    }

    pub fn validate_project_root(
        &self,
        project_root: impl AsRef<Path>,
    ) -> Result<PathBuf, WorkspaceError> {
        let canonical = fs::canonicalize(project_root)?;
        if canonical.parent() != Some(self.root.as_path()) || !canonical.join(".git").exists() {
            return Err(WorkspaceError::BoundaryViolation);
        }
        Ok(canonical)
    }

    pub fn resolve_repo_path(
        &self,
        project_root: impl AsRef<Path>,
        relative_path: impl AsRef<Path>,
    ) -> Result<PathBuf, WorkspaceError> {
        let project_root = self.validate_project_root(project_root)?;
        let relative_path = relative_path.as_ref();
        reject_absolute_or_parent(relative_path)?;

        let candidate = project_root.join(relative_path);
        let resolved = canonicalize_existing_or_parent(&candidate)?;
        if !resolved.starts_with(&project_root) {
            return Err(WorkspaceError::BoundaryViolation);
        }
        Ok(candidate)
    }

    pub fn validate_command_cwd(
        &self,
        project_root: impl AsRef<Path>,
        cwd: impl AsRef<Path>,
    ) -> Result<PathBuf, WorkspaceError> {
        let resolved = self.resolve_repo_path(project_root, cwd)?;
        let canonical = fs::canonicalize(resolved)?;
        if !canonical.is_dir() {
            return Err(WorkspaceError::BoundaryViolation);
        }
        Ok(canonical)
    }
}

pub fn project_id_from_name(name: &str) -> String {
    let slug = name
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_lowercase()
            } else {
                '_'
            }
        })
        .collect::<String>();
    format!("prj_{slug}")
}

fn reject_absolute_or_parent(path: &Path) -> Result<(), WorkspaceError> {
    for component in path.components() {
        match component {
            Component::Prefix(_) | Component::RootDir | Component::ParentDir => {
                return Err(WorkspaceError::BoundaryViolation);
            }
            Component::CurDir | Component::Normal(_) => {}
        }
    }
    Ok(())
}

fn canonicalize_existing_or_parent(path: &Path) -> Result<PathBuf, WorkspaceError> {
    if path.exists() {
        return Ok(fs::canonicalize(path)?);
    }
    let parent = path.parent().ok_or(WorkspaceError::BoundaryViolation)?;
    Ok(fs::canonicalize(parent)?)
}

fn read_git_branch(project_root: &Path) -> Result<String, WorkspaceError> {
    let head = fs::read_to_string(project_root.join(".git/HEAD"))?;
    Ok(head
        .strip_prefix("ref: refs/heads/")
        .map(str::trim)
        .unwrap_or("detached")
        .to_string())
}
