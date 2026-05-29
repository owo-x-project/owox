use owox_core::workspace::{WorkspaceBoundary, WorkspaceError};
use std::fs;
use std::path::{Path, PathBuf};

fn make_repo(root: &Path, name: &str) -> PathBuf {
    let repo = root.join(name);
    fs::create_dir_all(repo.join(".git")).unwrap();
    fs::write(repo.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
    repo
}

#[test]
fn discovers_only_direct_git_repos() {
    let temp = tempfile::tempdir().unwrap();
    make_repo(temp.path(), "repo-a");
    fs::create_dir_all(temp.path().join("plain")).unwrap();
    fs::create_dir_all(temp.path().join("parent/nested/.git")).unwrap();

    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();
    let projects = boundary.discover_projects().unwrap();

    assert_eq!(projects.len(), 1);
    assert_eq!(projects[0].id, "prj_repo_a");
    assert_eq!(projects[0].git_branch.as_deref(), Some("main"));
}

#[test]
fn rejects_traversal_outside_project() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();

    let err = boundary
        .resolve_repo_path(repo, "../secret.txt")
        .unwrap_err();

    assert!(matches!(err, WorkspaceError::BoundaryViolation));
}

#[cfg(unix)]
#[test]
fn rejects_symlink_outside_project() {
    use std::os::unix::fs::symlink;

    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    fs::write(temp.path().join("secret.txt"), "secret").unwrap();
    symlink(temp.path().join("secret.txt"), repo.join("secret-link")).unwrap();
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();

    let err = boundary.resolve_repo_path(repo, "secret-link").unwrap_err();

    assert!(matches!(err, WorkspaceError::BoundaryViolation));
}
