//! External AI CLI smoke (Phase 06 task-003).
//!
//! @spec integrations/external-ai-cli (AI CLI = arbitrary command, no adapter)
//! @spec SPEC-runtime-terminal-session
//!
//! Proves an "AI CLI"-shaped command is handled exactly like any other terminal
//! command: started, monitored, logged. owox owns command/cwd/env/PTY/exit/log
//! only — it never references provider keys, model selection, or rate limits.
//! Missing CLI and non-zero exit surface as terminal failure states.

use owox_core::log_store::LogStore;
use owox_core::terminal::{CreateSession, SessionState, TerminalRegistry};
use owox_core::workspace::WorkspaceBoundary;
use std::collections::BTreeMap;
use std::time::{Duration, Instant};

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
        label: Some("ai-cli".to_string()),
    }
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64
}

fn wait_terminal(reg: &TerminalRegistry, id: &str) -> SessionState {
    let start = Instant::now();
    loop {
        if let Some(info) = reg.snapshot(id) {
            if matches!(
                info.state,
                SessionState::Exited | SessionState::Failed | SessionState::Terminated
            ) {
                return info.state;
            }
        }
        assert!(start.elapsed() < Duration::from_secs(5), "session never settled");
        std::thread::sleep(Duration::from_millis(25));
    }
}

/// A fake AI CLI: a normal command emitting a banner + many lines of "agent"
/// output. owox runs it as a plain terminal session and captures the log.
#[test]
fn fake_ai_cli_runs_as_terminal_session_with_long_output() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();
    let reg = registry(temp.path());

    // Simulate `some-ai-cli --print` producing a banner + 200 lines of output.
    let script = "echo 'fake-ai-cli v0 (no provider key needed)'; \
                  i=0; while [ $i -lt 200 ]; do echo \"agent line $i\"; i=$((i+1)); done";
    let info = reg
        .create_session(&boundary, &repo, request("sh", &["-c", script]), now_ms())
        .expect("session should start");

    let state = wait_terminal(&reg, &info.id);
    assert_eq!(state, SessionState::Exited);
    assert_eq!(reg.snapshot(&info.id).unwrap().exit_code, Some(0));

    // The full long output is persisted to the append log (reconnect replay).
    let log_id = TerminalRegistry::log_id_for(&info.id);
    let range = reg.log_store().read_range(&log_id, 0, 1 << 20).unwrap();
    let text = &range.chunks[0].data;
    assert!(text.contains("fake-ai-cli v0"));
    assert!(text.contains("agent line 0"));
    assert!(text.contains("agent line 199"));
}

/// A missing AI CLI binary surfaces as a `failed` session (not a crash), so the
/// UI shows it via the terminal/error display.
#[test]
fn missing_ai_cli_is_a_failed_session() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();
    let reg = registry(temp.path());

    let info = reg
        .create_session(
            &boundary,
            &repo,
            request("definitely-not-a-real-ai-cli-xyz", &["--chat"]),
            now_ms(),
        )
        .expect("create returns a handle even when spawn fails");

    assert_eq!(info.state, SessionState::Failed);
    assert!(info.reason.is_some());
}

/// A CLI that exits non-zero (e.g. auth/rate-limit failure inside the external
/// tool) is recorded as `exited` with the non-zero code — owox does not manage
/// provider auth; it just reports the tool's exit.
#[test]
fn ai_cli_nonzero_exit_is_reported() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();
    let reg = registry(temp.path());

    let info = reg
        .create_session(
            &boundary,
            &repo,
            request("sh", &["-c", "echo 'auth failed' >&2; exit 1"]),
            now_ms(),
        )
        .unwrap();

    assert_eq!(wait_terminal(&reg, &info.id), SessionState::Exited);
    assert_eq!(reg.snapshot(&info.id).unwrap().exit_code, Some(1));
}
