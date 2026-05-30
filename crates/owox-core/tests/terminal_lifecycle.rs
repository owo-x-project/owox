//! @spec SPEC-runtime-terminal-session
//! @spec SPEC-runtime-terminal-log-reconnect

use owox_core::log_store::LogStore;
use owox_core::terminal::{CreateSession, SessionState, TermChunk, TerminalError, TerminalRegistry};
use owox_core::workspace::WorkspaceBoundary;
use std::collections::BTreeMap;
use std::time::{Duration, Instant};
use tokio::sync::broadcast::error::RecvError;

fn make_repo(root: &std::path::Path, name: &str) -> std::path::PathBuf {
    let repo = root.join(name);
    std::fs::create_dir_all(repo.join(".git")).unwrap();
    std::fs::write(repo.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
    repo
}

fn registry(root: &std::path::Path) -> TerminalRegistry {
    let data_dir = root.join(".owox-data");
    std::fs::create_dir_all(&data_dir).unwrap();
    TerminalRegistry::new(LogStore::new(data_dir.join("logs")))
}

fn request(command: &str, args: &[&str]) -> CreateSession {
    CreateSession {
        project_id: "prj_repo".to_string(),
        cwd: ".".to_string(),
        command: command.to_string(),
        args: args.iter().map(|s| s.to_string()).collect(),
        env: BTreeMap::new(),
        cols: 80,
        rows: 24,
        label: None,
    }
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64
}

/// Poll a session snapshot until it reaches a terminal state or times out.
fn wait_for_terminal_state(
    registry: &TerminalRegistry,
    session_id: &str,
    deadline: Duration,
) -> SessionState {
    let start = Instant::now();
    loop {
        if let Some(info) = registry.snapshot(session_id)
            && matches!(
                info.state,
                SessionState::Exited | SessionState::Failed | SessionState::Terminated
            )
        {
            return info.state;
        }
        if start.elapsed() > deadline {
            return registry
                .snapshot(session_id)
                .map(|i| i.state)
                .unwrap_or(SessionState::Failed);
        }
        std::thread::sleep(Duration::from_millis(20));
    }
}

#[tokio::test]
async fn spawn_echo_emits_output_and_exits_zero() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();
    let reg = registry(temp.path());

    let info = reg
        .create_session(&boundary, &repo, request("sh", &["-c", "printf hello"]), now_ms())
        .expect("session should spawn");
    assert_eq!(info.state, SessionState::Running);

    let mut rx = reg.subscribe(&info.id).unwrap();

    // Collect broadcast output until we see "hello" or the channel closes.
    let mut seen = String::new();
    let deadline = Instant::now() + Duration::from_secs(3);
    while Instant::now() < deadline {
        match tokio::time::timeout(Duration::from_millis(200), rx.recv()).await {
            Ok(Ok(TermChunk::Output { data, .. })) => seen.push_str(&data),
            Ok(Ok(TermChunk::State(_))) => {}
            Ok(Err(RecvError::Closed)) => break,
            Ok(Err(RecvError::Lagged(_))) => {}
            Err(_) => {}
        }
        if seen.contains("hello") {
            break;
        }
    }
    assert!(seen.contains("hello"), "output was: {seen:?}");

    let final_state = wait_for_terminal_state(&reg, &info.id, Duration::from_secs(3));
    assert_eq!(final_state, SessionState::Exited);
    let snap = reg.snapshot(&info.id).unwrap();
    assert_eq!(snap.exit_code, Some(0));

    // Output was persisted to the per-session log.
    let log_id = TerminalRegistry::log_id_for(&info.id);
    let range = reg.log_store().read_range(&log_id, 0, 65536).unwrap();
    let logged: String = range.chunks.iter().map(|c| c.data.as_str()).collect();
    assert!(logged.contains("hello"), "logged: {logged:?}");
}

#[tokio::test]
async fn spawn_nonexistent_command_is_failed() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();
    let reg = registry(temp.path());

    let info = reg
        .create_session(
            &boundary,
            &repo,
            request("this-command-does-not-exist-xyz", &[]),
            now_ms(),
        )
        .expect("create returns Ok with a Failed snapshot");
    assert_eq!(info.state, SessionState::Failed);
    assert!(info.ended_at.is_some());
}

#[test]
fn boundary_invalid_cwd_does_not_spawn() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();
    let reg = registry(temp.path());

    let mut req = request("sh", &["-c", "true"]);
    req.cwd = "../".to_string();

    let result = reg.create_session(&boundary, &repo, req, now_ms());
    assert!(matches!(result, Err(TerminalError::Boundary)));
    // Nothing was registered.
    assert!(reg.list().is_empty());
}
