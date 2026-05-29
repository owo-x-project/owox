use owox_core::command::{
    CommandExecutionError, CommandRequest, CommandStatus, OperationKind, execute_command,
    redact_secrets, validate_confirmation,
};
use owox_core::workspace::WorkspaceBoundary;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

fn make_repo(root: &Path, name: &str) -> PathBuf {
    let repo = root.join(name);
    fs::create_dir_all(repo.join(".git")).unwrap();
    fs::write(repo.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
    repo
}

#[test]
fn destructive_operation_requires_confirmation() {
    let request = CommandRequest {
        project_id: "prj_repo".to_string(),
        cwd: ".".to_string(),
        program: "git".to_string(),
        args: vec!["reset".to_string(), "--hard".to_string()],
        env: BTreeMap::new(),
        operation_kind: OperationKind::Git,
    };

    let err = validate_confirmation(&request, None).unwrap_err();

    assert!(matches!(
        err,
        CommandExecutionError::ConfirmationRequired(_)
    ));
}

#[test]
fn command_result_distinguishes_nonzero_from_start_failure() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();
    let request = CommandRequest {
        project_id: "prj_repo".to_string(),
        cwd: ".".to_string(),
        program: "sh".to_string(),
        args: vec!["-c".to_string(), "exit 7".to_string()],
        env: BTreeMap::new(),
        operation_kind: OperationKind::Terminal,
    };

    let captured = execute_command(&boundary, repo, &request, None, 10).unwrap();

    assert_eq!(captured.result.status, CommandStatus::ExitedNonzero);
    assert_eq!(captured.result.exit_code, Some(7));
    assert_eq!(captured.result.error_kind, None);
}

#[test]
fn command_cwd_stays_inside_project_boundary() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let boundary = WorkspaceBoundary::new(temp.path()).unwrap();
    let request = CommandRequest {
        project_id: "prj_repo".to_string(),
        cwd: "..".to_string(),
        program: "echo".to_string(),
        args: vec!["nope".to_string()],
        env: BTreeMap::new(),
        operation_kind: OperationKind::Terminal,
    };

    let err = execute_command(&boundary, repo, &request, None, 10).unwrap_err();

    assert!(matches!(err, CommandExecutionError::Boundary));
}

#[test]
fn redacts_known_secret_tokens() {
    let redacted = redact_secrets("token=abc123 keep password=hunter2 Authorization: Bearer abc");

    assert_eq!(
        redacted,
        "[REDACTED] keep [REDACTED] [REDACTED] [REDACTED] abc"
    );
}
