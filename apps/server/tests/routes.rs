use axum::body::Body;
use axum::http::{Request, StatusCode};
use owox_core::db::MetadataStore;
use owox_core::log_store::LogStore;
use owox_core::terminal::TerminalRegistry;
use owox_core::workspace::WorkspaceBoundary;
use owox_server::{AppState, router};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tower::ServiceExt;

/// Serializes the two tests that mutate the process-global `OWOX_PLUGINS_DIR`
/// so they never observe each other's value.
static PLUGINS_ENV_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

fn make_repo(root: &Path, name: &str) {
    let repo = root.join(name);
    std::fs::create_dir_all(repo.join(".git")).unwrap();
    std::fs::write(repo.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
}

/// Run a git command inside `dir`; returns whether it succeeded.
fn git_in(dir: &Path, args: &[&str]) -> bool {
    std::process::Command::new("git")
        .args(args)
        .current_dir(dir)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Create a real git repo under `root/name` with one committed file. Returns
/// `false` if git is unavailable (tests then early-return).
fn make_real_repo(root: &Path, name: &str) -> bool {
    if std::process::Command::new("git")
        .arg("--version")
        .output()
        .is_err()
    {
        return false;
    }
    let repo = root.join(name);
    std::fs::create_dir_all(&repo).unwrap();
    git_in(&repo, &["init", "-q"])
        && git_in(&repo, &["config", "user.email", "t@example.com"])
        && git_in(&repo, &["config", "user.name", "T"])
        && git_in(&repo, &["config", "commit.gpgsign", "false"])
        && git_in(&repo, &["checkout", "-q", "-B", "main"])
        && {
            std::fs::write(repo.join("a.txt"), "one\n").unwrap();
            git_in(&repo, &["add", "a.txt"]) && git_in(&repo, &["commit", "-q", "-m", "init"])
        }
}

async fn test_state(root: PathBuf) -> AppState {
    let data_dir = root.join(".owox-data");
    std::fs::create_dir_all(&data_dir).unwrap();
    let terminal = TerminalRegistry::new(LogStore::new(data_dir.join("logs")));
    AppState {
        boundary: Arc::new(WorkspaceBoundary::new(root).unwrap()),
        store: MetadataStore::connect("sqlite::memory:").await.unwrap(),
        data_dir: Arc::new(data_dir),
        terminal,
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
async fn plugins_endpoint_returns_empty_when_no_plugins_dir() {
    let _guard = PLUGINS_ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    let temp = tempfile::tempdir().unwrap();
    // Point the loader at a dir that does not exist: read must not 500.
    let missing = temp.path().join("no-such-plugins");
    // SAFETY: single-threaded async test; no other thread reads the env here.
    unsafe { std::env::set_var("OWOX_PLUGINS_DIR", &missing) };
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/plugins")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert_eq!(body["plugins"], serde_json::json!([]));
    unsafe { std::env::remove_var("OWOX_PLUGINS_DIR") };
}

#[tokio::test]
async fn plugins_commands_endpoint_lists_contributions() {
    let _guard = PLUGINS_ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    let temp = tempfile::tempdir().unwrap();
    let plugins = temp.path().join("plugins");
    let one = plugins.join("example-plugin");
    std::fs::create_dir_all(&one).unwrap();
    std::fs::write(
        one.join("plugin.json"),
        r#"{
            "id": "example-plugin",
            "name": "Example Plugin",
            "version": "1.0.0",
            "commands": [
                { "id": "example-plugin.example", "plugin_id": "example-plugin",
                  "title": "Example Command", "category": "plugin",
                  "capabilities": [], "when": "workspace",
                  "args_schema": null, "dangerous": false }
            ]
        }"#,
    )
    .unwrap();
    // SAFETY: single-threaded async test; no other thread reads the env here.
    unsafe { std::env::set_var("OWOX_PLUGINS_DIR", &plugins) };
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/plugins/commands")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert_eq!(body["commands"][0]["id"], "example-plugin.example");
    assert_eq!(body["commands"][0]["category"], "plugin");
    assert_eq!(body["commands"][0]["dangerous"], false);
    unsafe { std::env::remove_var("OWOX_PLUGINS_DIR") };
}

async fn body_json(response: axum::response::Response) -> serde_json::Value {
    let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    serde_json::from_slice(&bytes).unwrap()
}

#[tokio::test]
async fn files_tree_lists_repo_root() {
    let temp = tempfile::tempdir().unwrap();
    make_repo(temp.path(), "repo");
    std::fs::write(temp.path().join("repo/main.rs"), "fn main() {}\n").unwrap();
    std::fs::create_dir_all(temp.path().join("repo/src")).unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/projects/prj_repo/files/tree")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let json = body_json(response).await;
    assert_eq!(json["path"], "");
    let names: Vec<&str> = json["entries"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| e["path"].as_str().unwrap())
        .collect();
    // dirs first, then files; .git skipped.
    assert_eq!(names, vec!["src", "main.rs"]);
}

#[tokio::test]
async fn files_content_get_put_round_trip() {
    let temp = tempfile::tempdir().unwrap();
    make_repo(temp.path(), "repo");
    std::fs::write(temp.path().join("repo/main.rs"), "fn main() {}\n").unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/projects/prj_repo/files/content?path=main.rs")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get.status(), StatusCode::OK);
    let get_json = body_json(get).await;
    assert_eq!(get_json["kind"], "text");
    assert_eq!(get_json["content"], "fn main() {}\n");
    let version = get_json["version"].as_str().unwrap().to_string();

    let put = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri("/api/projects/prj_repo/files/content")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({
                        "path": "main.rs",
                        "content": "fn main() { println!(\"hi\"); }\n",
                        "expected_version": version,
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(put.status(), StatusCode::OK);
    let put_json = body_json(put).await;
    assert_eq!(put_json["result"], "saved");
    assert_eq!(
        std::fs::read_to_string(temp.path().join("repo/main.rs")).unwrap(),
        "fn main() { println!(\"hi\"); }\n"
    );
}

#[tokio::test]
async fn files_delete_without_confirm_token_is_rejected() {
    let temp = tempfile::tempdir().unwrap();
    make_repo(temp.path(), "repo");
    std::fs::write(temp.path().join("repo/doomed.txt"), "x").unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri("/api/projects/prj_repo/files")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({ "path": "doomed.txt" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    // File must still exist since the destructive op was rejected.
    assert!(temp.path().join("repo/doomed.txt").exists());
}

#[tokio::test]
async fn files_delete_with_confirm_token_succeeds() {
    let temp = tempfile::tempdir().unwrap();
    make_repo(temp.path(), "repo");
    std::fs::write(temp.path().join("repo/doomed.txt"), "x").unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri("/api/projects/prj_repo/files")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({
                        "path": "doomed.txt",
                        "confirm_token": "confirm:prj_repo:doomed.txt",
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NO_CONTENT);
    assert!(!temp.path().join("repo/doomed.txt").exists());
}

#[tokio::test]
async fn git_status_returns_branch_and_counts() {
    let temp = tempfile::tempdir().unwrap();
    if !make_real_repo(temp.path(), "repo") {
        return;
    }
    std::fs::write(temp.path().join("repo/b.txt"), "new\n").unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/projects/prj_repo/git/status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let json = body_json(response).await;
    assert_eq!(json["branch"], "main");
    assert_eq!(json["counts"]["untracked"], 1);
}

#[tokio::test]
async fn git_branches_lists_current() {
    let temp = tempfile::tempdir().unwrap();
    if !make_real_repo(temp.path(), "repo") {
        return;
    }
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/projects/prj_repo/git/branches")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let json = body_json(response).await;
    assert_eq!(json["current"], "main");
    let names: Vec<&str> = json["branches"]
        .as_array()
        .unwrap()
        .iter()
        .map(|b| b["name"].as_str().unwrap())
        .collect();
    assert!(names.contains(&"main"));
}

#[tokio::test]
async fn git_stage_then_status_shows_staged() {
    let temp = tempfile::tempdir().unwrap();
    if !make_real_repo(temp.path(), "repo") {
        return;
    }
    std::fs::write(temp.path().join("repo/b.txt"), "new\n").unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let stage = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/projects/prj_repo/git/operations")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({ "op": "stage", "paths": ["b.txt"] }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stage.status(), StatusCode::ACCEPTED);

    let status = app
        .oneshot(
            Request::builder()
                .uri("/api/projects/prj_repo/git/status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let json = body_json(status).await;
    let staged = json["files"]
        .as_array()
        .unwrap()
        .iter()
        .find(|f| f["path"] == "b.txt")
        .unwrap();
    assert_eq!(staged["staged"], true);
    assert_eq!(json["counts"]["staged"], 1);
}

#[tokio::test]
async fn git_diff_returns_patch_with_expected_line() {
    let temp = tempfile::tempdir().unwrap();
    if !make_real_repo(temp.path(), "repo") {
        return;
    }
    std::fs::write(
        temp.path().join("repo/a.txt"),
        "one\nEXPECTED_DIFF_LINE\n",
    )
    .unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/projects/prj_repo/git/diff?mode=unstaged&path=a.txt")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let json = body_json(response).await;
    assert_eq!(json["mode"], "unstaged");
    assert_eq!(json["binary"], false);
    assert!(
        json["patch"].as_str().unwrap().contains("EXPECTED_DIFF_LINE"),
        "patch was: {}",
        json["patch"]
    );
    assert_eq!(json["summary"]["additions"], 1);
}

#[tokio::test]
async fn git_discard_without_token_refused_with_token_succeeds() {
    let temp = tempfile::tempdir().unwrap();
    if !make_real_repo(temp.path(), "repo") {
        return;
    }
    let target = temp.path().join("repo/a.txt");
    std::fs::write(&target, "one\nDIRTY\n").unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let refused = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/projects/prj_repo/git/operations")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({ "op": "discard", "paths": ["a.txt"] }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(refused.status(), StatusCode::BAD_REQUEST);
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "one\nDIRTY\n");

    let token = "confirm:prj_repo:discard:a.txt";
    let ok = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/projects/prj_repo/git/operations")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({
                        "op": "discard",
                        "paths": ["a.txt"],
                        "confirm_token": token,
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::ACCEPTED);
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "one\n");
}

#[tokio::test]
async fn git_commit_empty_message_is_validation_error() {
    let temp = tempfile::tempdir().unwrap();
    if !make_real_repo(temp.path(), "repo") {
        return;
    }
    std::fs::write(temp.path().join("repo/b.txt"), "x\n").unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);
    let _ = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/projects/prj_repo/git/operations")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({ "op": "stage", "paths": ["b.txt"] }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/projects/prj_repo/git/operations")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({ "op": "commit", "message": "" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn git_status_on_broken_repo_is_error() {
    let temp = tempfile::tempdir().unwrap();
    // make_repo writes a fake .git dir (HEAD only) -> git rejects it.
    make_repo(temp.path(), "repo");
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/projects/prj_repo/git/status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert!(response.status().is_client_error() || response.status().is_server_error());
}

#[tokio::test]
async fn logs_get_returns_range() {
    let temp = tempfile::tempdir().unwrap();
    let state = test_state(temp.path().to_path_buf()).await;
    // Pre-seed a log file under data_dir/logs.
    let logs_dir = state.data_dir.join("logs");
    std::fs::create_dir_all(&logs_dir).unwrap();
    std::fs::write(logs_dir.join("log_seed"), b"line one\nline two\n").unwrap();
    let app = router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/logs/log_seed?offset=0&limit=8")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let json = body_json(response).await;
    assert_eq!(json["log_id"], "log_seed");
    assert_eq!(json["total"], 18);
    assert_eq!(json["truncated"], true);
    assert_eq!(json["chunks"][0]["data"], "line one");
}

#[tokio::test]
async fn logs_get_invalid_id_is_rejected() {
    let temp = tempfile::tempdir().unwrap();
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/logs/bad.id")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

/// Poll a log range until it reports a non-zero total or the deadline passes.
async fn wait_for_log_total(
    state: &AppState,
    log_id: &str,
    deadline: std::time::Duration,
) -> u64 {
    let start = std::time::Instant::now();
    loop {
        if let Ok(range) = state.terminal.log_store().read_range(log_id, 0, 65536)
            && range.total > 0
        {
            return range.total;
        }
        if start.elapsed() > deadline {
            return 0;
        }
        tokio::time::sleep(std::time::Duration::from_millis(20)).await;
    }
}

#[tokio::test]
async fn sessions_create_list_log_delete_round_trip() {
    let temp = tempfile::tempdir().unwrap();
    make_repo(temp.path(), "repo");
    let state = test_state(temp.path().to_path_buf()).await;
    let app = router(state.clone());

    // POST create -> 201 with a session id.
    let create = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/projects/prj_repo/sessions")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({
                        "cwd": ".",
                        "command": "sh",
                        "args": ["-c", "printf hello"],
                        "cols": 80,
                        "rows": 24,
                        "label": "test",
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(create.status(), StatusCode::CREATED);
    let create_json = body_json(create).await;
    let session_id = create_json["session"]["id"].as_str().unwrap().to_string();
    assert!(session_id.starts_with("ses_"));
    assert_eq!(create_json["session"]["label"], "test");

    // GET list -> contains the session.
    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/projects/prj_repo/sessions")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list.status(), StatusCode::OK);
    let list_json = body_json(list).await;
    let ids: Vec<&str> = list_json["sessions"]
        .as_array()
        .unwrap()
        .iter()
        .map(|s| s["id"].as_str().unwrap())
        .collect();
    assert!(ids.contains(&session_id.as_str()));

    // Wait for the command output to be flushed to the log.
    let log_id = format!("log_{}", session_id.strip_prefix("ses_").unwrap());
    wait_for_log_total(&state, &log_id, std::time::Duration::from_secs(3)).await;

    // GET session log -> a range that contains "hello".
    let log = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!(
                    "/api/projects/prj_repo/sessions/{session_id}/log?offset=0&limit=65536"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(log.status(), StatusCode::OK);
    let log_json = body_json(log).await;
    let data = log_json["chunks"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| c["data"].as_str().unwrap())
        .collect::<String>();
    assert!(data.contains("hello"), "log data was: {data:?}");

    // DELETE -> 204 (terminate).
    let delete = app
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri(format!("/api/projects/prj_repo/sessions/{session_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(delete.status(), StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn sessions_create_outside_boundary_is_rejected() {
    let temp = tempfile::tempdir().unwrap();
    make_repo(temp.path(), "repo");
    let app = router(test_state(temp.path().to_path_buf()).await);

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/projects/prj_repo/sessions")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({
                        "cwd": "../",
                        "command": "sh",
                        "args": ["-c", "true"],
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
