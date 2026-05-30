//! Unit tests for the pure git output parsers and error classifier.
//!
//! These exercise [`owox_core::git`] parsers against captured `git` output
//! without needing a real repository.

use owox_core::git::{
    FileState, GitErrorKind, classify_git_error, parse_branches, parse_numstat, parse_status,
};

#[test]
fn status_parses_staged_modified_untracked_renamed_conflicted() {
    // `git status --porcelain=v1 -b` style output.
    let output = "\
## main...origin/main [ahead 2, behind 1]
M  staged_modified.rs
 M unstaged_modified.rs
MM both.rs
A  added.rs
 D deleted.rs
R  old.rs -> new.rs
?? untracked.txt
UU conflicted.rs
";
    let status = parse_status(output);
    assert_eq!(status.branch, "main");
    assert_eq!(status.ahead, 2);
    assert_eq!(status.behind, 1);

    // staged_modified: index M -> one staged modified entry.
    let staged_mod = status
        .files
        .iter()
        .find(|f| f.path == "staged_modified.rs")
        .unwrap();
    assert_eq!(staged_mod.state, FileState::Modified);
    assert!(staged_mod.staged);

    // unstaged_modified: worktree M -> one unstaged modified entry.
    let unstaged = status
        .files
        .iter()
        .find(|f| f.path == "unstaged_modified.rs")
        .unwrap();
    assert!(!unstaged.staged);

    // both.rs (MM): appears twice, once staged once unstaged.
    let both: Vec<_> = status.files.iter().filter(|f| f.path == "both.rs").collect();
    assert_eq!(both.len(), 2);
    assert!(both.iter().any(|f| f.staged));
    assert!(both.iter().any(|f| !f.staged));

    // added (A , staged).
    let added = status.files.iter().find(|f| f.path == "added.rs").unwrap();
    assert_eq!(added.state, FileState::Added);
    assert!(added.staged);

    // deleted ( D, unstaged).
    let deleted = status.files.iter().find(|f| f.path == "deleted.rs").unwrap();
    assert_eq!(deleted.state, FileState::Deleted);
    assert!(!deleted.staged);

    // renamed -> surfaces the new path.
    let renamed = status.files.iter().find(|f| f.path == "new.rs").unwrap();
    assert_eq!(renamed.state, FileState::Renamed);
    assert!(renamed.staged);

    // untracked.
    let untracked = status
        .files
        .iter()
        .find(|f| f.path == "untracked.txt")
        .unwrap();
    assert_eq!(untracked.state, FileState::Untracked);

    // conflicted (UU).
    let conflicted = status
        .files
        .iter()
        .find(|f| f.path == "conflicted.rs")
        .unwrap();
    assert_eq!(conflicted.state, FileState::Conflicted);

    // Counts: staged = staged_modified + both(staged) + added + new(renamed) = 4.
    assert_eq!(status.counts.staged, 4);
    // untracked = 1.
    assert_eq!(status.counts.untracked, 1);
    // modified (unstaged non-untracked) = unstaged_modified + both(unstaged)
    // + deleted + conflicted = 4.
    assert_eq!(status.counts.modified, 4);
}

#[test]
fn status_detached_head() {
    let output = "## HEAD (no branch)\n M file.rs\n";
    let status = parse_status(output);
    assert_eq!(status.branch, "HEAD (detached)");
    assert_eq!(status.ahead, 0);
    assert_eq!(status.behind, 0);
}

#[test]
fn status_branch_without_tracking() {
    let output = "## feature/x\n";
    let status = parse_status(output);
    assert_eq!(status.branch, "feature/x");
    assert_eq!(status.ahead, 0);
    assert_eq!(status.behind, 0);
    assert!(status.files.is_empty());
}

#[test]
fn numstat_text_and_binary() {
    let output = "\
3\t1\tsrc/main.rs
10\t0\tsrc/lib.rs
-\t-\tassets/logo.png
";
    let (summary, binary) = parse_numstat(output);
    assert_eq!(summary.files, 3);
    assert_eq!(summary.additions, 13);
    assert_eq!(summary.deletions, 1);
    assert!(binary, "binary file (-\\t-) should flag binary");
}

#[test]
fn numstat_no_binary() {
    let (summary, binary) = parse_numstat("2\t2\tonly.rs\n");
    assert_eq!(summary.files, 1);
    assert_eq!(summary.additions, 2);
    assert_eq!(summary.deletions, 2);
    assert!(!binary);
}

#[test]
fn branches_lists_current_and_remotes() {
    let output = "\
* main
  feature/login
  remotes/origin/HEAD -> origin/main
  remotes/origin/main
";
    let branches = parse_branches(output);
    assert_eq!(branches.current, "main");

    let main = branches
        .branches
        .iter()
        .find(|b| b.name == "main" && !b.remote)
        .unwrap();
    assert!(main.current);

    let feature = branches
        .branches
        .iter()
        .find(|b| b.name == "feature/login")
        .unwrap();
    assert!(!feature.current);
    assert!(!feature.remote);

    let remote = branches
        .branches
        .iter()
        .find(|b| b.name == "origin/main" && b.remote)
        .unwrap();
    assert!(remote.remote);
    assert!(!remote.current);

    // The symbolic `origin/HEAD -> origin/main` pointer is skipped.
    assert!(!branches.branches.iter().any(|b| b.name.contains("HEAD")));
}

#[test]
fn branches_detached_head() {
    let output = "* (HEAD detached at abc1234)\n  main\n";
    let branches = parse_branches(output);
    assert_eq!(branches.current, "HEAD (detached)");
    // main is still listed but not current.
    let main = branches.branches.iter().find(|b| b.name == "main").unwrap();
    assert!(!main.current);
}

#[test]
fn classify_auth_errors() {
    assert_eq!(
        classify_git_error("fatal: Authentication failed for 'https://...'", Some(128)),
        GitErrorKind::Auth
    );
    assert_eq!(
        classify_git_error("could not read Username for 'https://github.com'", Some(128)),
        GitErrorKind::Auth
    );
    assert_eq!(
        classify_git_error("git@github.com: Permission denied (publickey).", Some(128)),
        GitErrorKind::Auth
    );
}

#[test]
fn classify_network_errors() {
    assert_eq!(
        classify_git_error("fatal: unable to access 'https://...': Could not resolve host: github.com", Some(128)),
        GitErrorKind::Network
    );
    assert_eq!(
        classify_git_error("ssh: connect to host github.com port 22: Connection timed out", Some(255)),
        GitErrorKind::Network
    );
}

#[test]
fn classify_conflict_errors() {
    assert_eq!(
        classify_git_error(
            "error: Your local changes to the following files would be overwritten by checkout:",
            Some(1)
        ),
        GitErrorKind::Conflict
    );
    assert_eq!(
        classify_git_error("CONFLICT (content): Merge conflict in file.rs", Some(1)),
        GitErrorKind::Conflict
    );
}

#[test]
fn classify_not_found_errors() {
    assert_eq!(
        classify_git_error("fatal: not a git repository (or any of the parent directories): .git", Some(128)),
        GitErrorKind::NotFound
    );
    assert_eq!(
        classify_git_error("error: pathspec 'nope.rs' did not match any file(s) known to git", Some(1)),
        GitErrorKind::NotFound
    );
}

#[test]
fn classify_unknown_fallback() {
    assert_eq!(
        classify_git_error("some unexpected git failure", Some(1)),
        GitErrorKind::Unknown
    );
}
