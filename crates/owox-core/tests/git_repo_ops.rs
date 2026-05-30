//! Integration tests for the git service against real temp repositories.
//!
//! Each test `git init`s a temp dir, configures an identity, and exercises the
//! service. If `git` is unavailable the test returns early (CI has git).

use owox_core::git::{self, FileState, GitError, GitOp, OperationRequest};
use std::path::Path;
use std::process::Command;

/// Run a git command in `dir`, returning `false` if git is unavailable.
fn git(dir: &Path, args: &[&str]) -> bool {
    match Command::new("git").args(args).current_dir(dir).output() {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

/// Initialise a repo with a deterministic identity and disabled signing.
/// Returns `false` when git is not installed.
fn init_repo(dir: &Path) -> bool {
    if Command::new("git").arg("--version").output().is_err() {
        return false;
    }
    git(dir, &["init", "-q"])
        && git(dir, &["config", "user.email", "test@example.com"])
        && git(dir, &["config", "user.name", "Test"])
        && git(dir, &["config", "commit.gpgsign", "false"])
        && git(dir, &["checkout", "-q", "-B", "main"])
}

fn write(dir: &Path, name: &str, content: &str) {
    std::fs::write(dir.join(name), content).unwrap();
}

#[test]
fn status_reflects_staged_and_untracked() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "tracked.txt", "one\n");
    git(repo, &["add", "tracked.txt"]);
    git(repo, &["commit", "-q", "-m", "init"]);

    // Modify tracked, stage it; add a new untracked file.
    write(repo, "tracked.txt", "one\ntwo\n");
    git(repo, &["add", "tracked.txt"]);
    write(repo, "new.txt", "fresh\n");

    let status = git::status(repo).unwrap();
    assert_eq!(status.branch, "main");

    let staged = status
        .files
        .iter()
        .find(|f| f.path == "tracked.txt")
        .unwrap();
    assert!(staged.staged);
    assert_eq!(staged.state, FileState::Modified);
    assert_eq!(status.counts.staged, 1);

    let untracked = status.files.iter().find(|f| f.path == "new.txt").unwrap();
    assert_eq!(untracked.state, FileState::Untracked);
    assert_eq!(status.counts.untracked, 1);
}

#[test]
fn stage_then_status_shows_staged() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "a.txt", "x\n");

    let req = OperationRequest {
        paths: vec!["a.txt".to_string()],
        ..Default::default()
    };
    let result = git::run_operation(repo, "prj_t", GitOp::Stage, &req).unwrap();
    assert_eq!(result.exit_code, Some(0));

    let status = git::status(repo).unwrap();
    let staged = status.files.iter().find(|f| f.path == "a.txt").unwrap();
    assert!(staged.staged);
}

#[test]
fn unstage_moves_file_back() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    // Need an initial commit so HEAD exists for `restore --staged`.
    write(repo, "seed.txt", "seed\n");
    git(repo, &["add", "seed.txt"]);
    git(repo, &["commit", "-q", "-m", "init"]);

    // Modify a tracked file and stage it, then unstage it.
    write(repo, "seed.txt", "seed\nmore\n");
    git(repo, &["add", "seed.txt"]);

    let req = OperationRequest {
        paths: vec!["seed.txt".to_string()],
        ..Default::default()
    };
    git::run_operation(repo, "prj_t", GitOp::Unstage, &req).unwrap();

    let status = git::status(repo).unwrap();
    // After unstage the change is no longer staged (still modified in worktree).
    let entry = status.files.iter().find(|f| f.path == "seed.txt").unwrap();
    assert!(!entry.staged);
}

#[test]
fn commit_with_empty_message_is_validation_error() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "a.txt", "x\n");
    git(repo, &["add", "a.txt"]);

    let req = OperationRequest {
        message: Some("   ".to_string()),
        ..Default::default()
    };
    let err = git::run_operation(repo, "prj_t", GitOp::Commit, &req).unwrap_err();
    match err {
        GitError::Operation { kind, .. } => {
            assert_eq!(kind, git::GitErrorKind::Validation);
        }
        other => panic!("expected validation error, got {other:?}"),
    }
}

#[test]
fn commit_without_staged_changes_is_validation_error() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "a.txt", "x\n");
    git(repo, &["add", "a.txt"]);
    git(repo, &["commit", "-q", "-m", "init"]);
    // Nothing staged now.
    let req = OperationRequest {
        message: Some("real message".to_string()),
        ..Default::default()
    };
    let err = git::run_operation(repo, "prj_t", GitOp::Commit, &req).unwrap_err();
    matches!(err, GitError::Operation { kind: git::GitErrorKind::Validation, .. });
}

#[test]
fn commit_succeeds_with_staged_changes() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "a.txt", "x\n");
    git(repo, &["add", "a.txt"]);

    let req = OperationRequest {
        message: Some("first commit".to_string()),
        ..Default::default()
    };
    let result = git::run_operation(repo, "prj_t", GitOp::Commit, &req).unwrap();
    assert_eq!(result.exit_code, Some(0));

    // Working tree is now clean.
    let status = git::status(repo).unwrap();
    assert!(status.files.is_empty());
}

#[test]
fn discard_without_token_is_refused_with_token_succeeds() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "a.txt", "one\n");
    git(repo, &["add", "a.txt"]);
    git(repo, &["commit", "-q", "-m", "init"]);
    write(repo, "a.txt", "one\nmodified\n");

    let paths = vec!["a.txt".to_string()];

    // Without confirm_token -> ConfirmationRequired, file unchanged.
    let req = OperationRequest {
        paths: paths.clone(),
        ..Default::default()
    };
    let err = git::run_operation(repo, "prj_t", GitOp::Discard, &req).unwrap_err();
    let expected_token = match err {
        GitError::ConfirmationRequired(req) => {
            assert_eq!(req.op, "discard");
            assert_eq!(req.targets, paths);
            req.confirm_token
        }
        other => panic!("expected confirmation required, got {other:?}"),
    };
    assert_eq!(
        std::fs::read_to_string(repo.join("a.txt")).unwrap(),
        "one\nmodified\n",
        "discard must not run without confirmation"
    );

    // The expected token matches the deterministic derivation.
    assert_eq!(
        expected_token,
        git::confirm_token("prj_t", GitOp::Discard, &paths)
    );

    // With the token -> discard runs and reverts the file.
    let req = OperationRequest {
        paths,
        confirm_token: Some(expected_token),
        ..Default::default()
    };
    let result = git::run_operation(repo, "prj_t", GitOp::Discard, &req).unwrap();
    assert_eq!(result.exit_code, Some(0));
    assert_eq!(
        std::fs::read_to_string(repo.join("a.txt")).unwrap(),
        "one\n",
        "discard with confirmation reverts the file"
    );
}

#[test]
fn diff_unstaged_contains_changed_line_and_summary() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "a.txt", "one\n");
    git(repo, &["add", "a.txt"]);
    git(repo, &["commit", "-q", "-m", "init"]);
    write(repo, "a.txt", "one\nADDED_LINE\n");

    let diff = git::diff(repo, "unstaged", None, 0, 65536).unwrap();
    assert_eq!(diff.mode, "unstaged");
    assert!(!diff.binary);
    assert!(diff.patch.contains("ADDED_LINE"));
    assert_eq!(diff.summary.files, 1);
    assert_eq!(diff.summary.additions, 1);
    assert!(!diff.truncated);
}

#[test]
fn diff_staged_mode() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "a.txt", "one\n");
    git(repo, &["add", "a.txt"]);
    git(repo, &["commit", "-q", "-m", "init"]);
    write(repo, "a.txt", "one\nSTAGED_LINE\n");
    git(repo, &["add", "a.txt"]);

    let diff = git::diff(repo, "staged", None, 0, 65536).unwrap();
    assert!(diff.patch.contains("STAGED_LINE"));
    assert_eq!(diff.summary.additions, 1);
}

#[test]
fn branches_lists_current() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "a.txt", "x\n");
    git(repo, &["add", "a.txt"]);
    git(repo, &["commit", "-q", "-m", "init"]);

    let branches = git::branches(repo).unwrap();
    assert_eq!(branches.current, "main");
    assert!(branches.branches.iter().any(|b| b.name == "main" && b.current));
}

#[test]
fn branch_create_then_checkout() {
    let temp = tempfile::tempdir().unwrap();
    let repo = temp.path();
    if !init_repo(repo) {
        return;
    }
    write(repo, "a.txt", "x\n");
    git(repo, &["add", "a.txt"]);
    git(repo, &["commit", "-q", "-m", "init"]);

    let req = OperationRequest {
        branch: Some("feature".to_string()),
        ..Default::default()
    };
    let result = git::run_operation(repo, "prj_t", GitOp::BranchCreate, &req).unwrap();
    assert_eq!(result.exit_code, Some(0));
    assert_eq!(git::branches(repo).unwrap().current, "feature");

    // Checkout back to main: clean tree -> not destructive, no token needed.
    let req = OperationRequest {
        branch: Some("main".to_string()),
        ..Default::default()
    };
    let result = git::run_operation(repo, "prj_t", GitOp::BranchCheckout, &req).unwrap();
    assert_eq!(result.exit_code, Some(0));
    assert_eq!(git::branches(repo).unwrap().current, "main");
}
