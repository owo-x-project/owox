//! End-to-end workflow smoke (Phase 05 task-004).
//!
//! Drives the assembled router across the v0 cross-feature boundary in one
//! pass: project discovery -> terminal session (command + log) -> file edit ->
//! git diff -> stage -> commit -> reconnect (session list + log replay).
//!
//! This is the fragile cross-feature seam that unit tests don't cover; per the
//! plan, E2E stays minimal and lives here rather than in a browser harness.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use owox_core::db::MetadataStore;
use owox_core::log_store::LogStore;
use owox_core::terminal::TerminalRegistry;
use owox_core::workspace::WorkspaceBoundary;
use owox_server::{AppState, router};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tower::ServiceExt;

fn git(repo: &Path, args: &[&str]) {
    let status = Command::new("git")
        .args(args)
        .current_dir(repo)
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_SYSTEM", "/dev/null")
        .status()
        .unwrap();
    assert!(status.success(), "git {args:?} failed");
}

fn make_real_repo(root: &Path, name: &str) -> PathBuf {
    let repo = root.join(name);
    std::fs::create_dir_all(&repo).unwrap();
    git(&repo, &["init", "-q", "-b", "main"]);
    git(&repo, &["config", "user.email", "smoke@owox.test"]);
    git(&repo, &["config", "user.name", "owox smoke"]);
    std::fs::write(repo.join("note.txt"), "hello\n").unwrap();
    git(&repo, &["add", "note.txt"]);
    git(&repo, &["commit", "-qm", "init"]);
    repo
}

async fn test_state(root: PathBuf) -> AppState {
    let data_dir = root.join(".owox-data");
    std::fs::create_dir_all(&data_dir).unwrap();
    let log_store = LogStore::new(data_dir.join("logs"));
    AppState {
        boundary: Arc::new(WorkspaceBoundary::new(root).unwrap()),
        store: MetadataStore::connect("sqlite::memory:").await.unwrap(),
        data_dir: Arc::new(data_dir),
        terminal: TerminalRegistry::new(log_store),
    }
}

async fn json(app: &axum::Router, method: &str, uri: &str, body: serde_json::Value) -> (StatusCode, serde_json::Value) {
    let request = if body.is_null() {
        Request::builder().method(method).uri(uri).body(Body::empty()).unwrap()
    } else {
        Request::builder()
            .method(method)
            .uri(uri)
            .header("content-type", "application/json")
            .body(Body::from(body.to_string()))
            .unwrap()
    };
    let response = app.clone().oneshot(request).await.unwrap();
    let status = response.status();
    let bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let value = if bytes.is_empty() {
        serde_json::Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap_or(serde_json::Value::Null)
    };
    (status, value)
}

#[tokio::test]
async fn full_v0_workflow_smoke() {
    let temp = tempfile::tempdir().unwrap();
    make_real_repo(temp.path(), "demo");
    let app = router(test_state(temp.path().to_path_buf()).await);
    let base = "/api/projects/prj_demo";

    // 1. Project discovery.
    let (status, projects) = json(&app, "GET", "/api/projects", serde_json::Value::Null).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(projects["projects"][0]["id"], "prj_demo");

    // 2. Terminal session: run a command, then confirm it exits + the log persists.
    let (status, created) = json(
        &app,
        "POST",
        &format!("{base}/sessions"),
        serde_json::json!({
            "cwd": ".",
            "command": "sh",
            "args": ["-c", "printf BUILD-OK"],
            "cols": 80, "rows": 24, "label": "smoke"
        }),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let session_id = created["session"]["id"].as_str().unwrap().to_string();

    // Poll until the session is no longer running (reader thread reaps the child).
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        let (_, detail) = json(&app, "GET", &format!("{base}/sessions/{session_id}"), serde_json::Value::Null).await;
        if detail["session"]["state"] != "running" && detail["session"]["state"] != "creating" {
            assert_eq!(detail["session"]["state"], "exited");
            break;
        }
        assert!(Instant::now() < deadline, "session did not exit in time");
        tokio::time::sleep(Duration::from_millis(50)).await;
    }

    // Log persisted the (redacted) command output -> reconnect replay path.
    let (status, log) = json(&app, "GET", &format!("{base}/sessions/{session_id}/log"), serde_json::Value::Null).await;
    assert_eq!(status, StatusCode::OK);
    assert!(
        log["chunks"][0]["data"].as_str().unwrap().contains("BUILD-OK"),
        "log should contain command output, got {log:?}"
    );

    // 3. File edit through the editor API.
    let (_, content) = json(&app, "GET", &format!("{base}/files/content?path=note.txt"), serde_json::Value::Null).await;
    let version = content["version"].as_str().unwrap();
    let (status, saved) = json(
        &app,
        "PUT",
        &format!("{base}/files/content"),
        serde_json::json!({ "path": "note.txt", "content": "hello\nworld\n", "expected_version": version }),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(saved["result"], "saved");

    // 4. Git diff reflects the edit.
    let (status, diff) = json(&app, "GET", &format!("{base}/git/diff?mode=unstaged"), serde_json::Value::Null).await;
    assert_eq!(status, StatusCode::OK);
    assert!(diff["patch"].as_str().unwrap().contains("+world"));

    // 5. Stage.
    let (status, _) = json(
        &app, "POST", &format!("{base}/git/operations"),
        serde_json::json!({ "op": "stage", "paths": ["note.txt"] }),
    ).await;
    assert_eq!(status, StatusCode::ACCEPTED);
    let (_, st) = json(&app, "GET", &format!("{base}/git/status"), serde_json::Value::Null).await;
    assert_eq!(st["counts"]["staged"], 1);

    // 6. Commit.
    let (status, _) = json(
        &app, "POST", &format!("{base}/git/operations"),
        serde_json::json!({ "op": "commit", "message": "smoke: edit note" }),
    ).await;
    assert_eq!(status, StatusCode::ACCEPTED);
    let (_, st) = json(&app, "GET", &format!("{base}/git/status"), serde_json::Value::Null).await;
    assert_eq!(st["counts"]["staged"], 0, "working tree clean after commit");

    // 7. Reconnect: the session is still listed and its log is still replayable.
    let (_, sessions) = json(&app, "GET", &format!("{base}/sessions"), serde_json::Value::Null).await;
    let listed = sessions["sessions"].as_array().unwrap();
    assert!(listed.iter().any(|s| s["id"] == session_id.as_str()));
}
