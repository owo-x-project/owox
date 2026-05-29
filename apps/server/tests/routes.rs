use axum::body::Body;
use axum::http::{Request, StatusCode};
use owox_core::db::MetadataStore;
use owox_core::workspace::WorkspaceBoundary;
use owox_server::{AppState, router};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tower::ServiceExt;

fn make_repo(root: &Path, name: &str) {
    let repo = root.join(name);
    std::fs::create_dir_all(repo.join(".git")).unwrap();
    std::fs::write(repo.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
}

async fn test_state(root: PathBuf) -> AppState {
    AppState {
        boundary: Arc::new(WorkspaceBoundary::new(root).unwrap()),
        store: MetadataStore::connect("sqlite::memory:").await.unwrap(),
    }
}

#[tokio::test]
async fn health_endpoint_returns_ok() {
    let temp = tempfile::tempdir().unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn projects_endpoint_hides_absolute_paths() {
    let temp = tempfile::tempdir().unwrap();
    make_repo(temp.path(), "repo");
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/projects")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn reserved_endpoint_returns_error_envelope() {
    let temp = tempfile::tempdir().unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/projects/prj_repo/files/tree")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_IMPLEMENTED);
}
