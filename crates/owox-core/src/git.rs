//! Git backend service: status, branches, diff, and write operations.
//!
//! @spec SPEC-git-workflow
//! @spec SPEC-shared-http-api (Git)
//! @spec SPEC-shared-command-execution
//! @spec SPEC-shared-destructive-confirmation
//! @spec SPEC-shared-error-display
//! @spec SPEC-ui-diff-view
//!
//! Every git invocation runs with `current_dir` set to the boundary-validated
//! project repo root (the caller resolves it via [`crate::workspace`]). Pure
//! parsers ([`parse_status`], [`parse_numstat`], [`parse_branches`],
//! [`classify_git_error`]) are split out from process execution so they can be
//! unit-tested without a real repository. All stdout / stderr surfaced or
//! logged is passed through [`crate::command::redact_secrets`] first.

use crate::command::redact_secrets;
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;
use thiserror::Error;

/// Default diff patch byte window (matches the file content read default).
pub const DEFAULT_DIFF_LIMIT: u64 = 65536;

/// Classified git failure kinds, mirroring the shared `error_kind` taxonomy.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GitErrorKind {
    /// Not a git repository, or a path / ref did not match anything.
    NotFound,
    /// Authentication failure against a remote.
    Auth,
    /// Network failure reaching a remote.
    Network,
    /// Merge / checkout conflict or "would be overwritten" working-tree clash.
    Conflict,
    /// Request was malformed (empty commit message, nothing staged, …).
    Validation,
    /// A destructive op arrived without a matching confirmation token.
    ConfirmationRequired,
    /// Anything else (non-zero exit we could not classify).
    Unknown,
}

/// Errors raised by the git service. `Operation` carries the classified kind,
/// a redacted human message, and (when present) the git exit code.
#[derive(Debug, Error)]
pub enum GitError {
    #[error("git command failed to start: {0}")]
    Spawn(#[from] std::io::Error),
    #[error("not a git repository")]
    NotARepo,
    #[error("git operation failed: {message}")]
    Operation {
        kind: GitErrorKind,
        message: String,
        exit_code: Option<i32>,
    },
    #[error("destructive operation requires confirmation")]
    ConfirmationRequired(ConfirmationRequirement),
}

/// The information the UI needs to render a destructive-confirmation prompt.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ConfirmationRequirement {
    /// Operation kind (`discard`, `branch_checkout`, …).
    pub op: String,
    /// Server-derived token the client must echo back to proceed.
    pub confirm_token: String,
    /// Affected paths / branch the destructive op would touch.
    pub targets: Vec<String>,
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/// The change state of a single file in the working tree / index.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FileState {
    Modified,
    Added,
    Deleted,
    Renamed,
    Untracked,
    Conflicted,
}

/// One changed file in a status listing.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct StatusFile {
    pub path: String,
    pub state: FileState,
    pub staged: bool,
}

/// Aggregate counts for the status badge.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Default)]
pub struct StatusCounts {
    pub modified: u32,
    pub staged: u32,
    pub untracked: u32,
}

/// `GET /git/status` response body.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct GitStatus {
    pub branch: String,
    pub ahead: u32,
    pub behind: u32,
    pub files: Vec<StatusFile>,
    pub counts: StatusCounts,
}

/// Parse `git status --porcelain=v1 -b` output into a [`GitStatus`].
///
/// A file modified in both the index and the working tree is reported twice:
/// once staged and once unstaged, matching VS Code's Source Control panel. The
/// branch line (`## name...remote [ahead N, behind M]`) yields branch + ahead /
/// behind; a detached HEAD (`## HEAD (no branch)`) becomes `"HEAD (detached)"`.
pub fn parse_status(output: &str) -> GitStatus {
    let mut branch = "HEAD (detached)".to_string();
    let mut ahead = 0u32;
    let mut behind = 0u32;
    let mut files: Vec<StatusFile> = Vec::new();

    for line in output.split('\n') {
        if line.is_empty() {
            continue;
        }
        if let Some(rest) = line.strip_prefix("## ") {
            let (b, a, be) = parse_branch_header(rest);
            branch = b;
            ahead = a;
            behind = be;
            continue;
        }
        if line.len() < 3 {
            continue;
        }
        let index = line.as_bytes()[0] as char;
        let worktree = line.as_bytes()[1] as char;
        let path_part = &line[3..];

        // Renames are reported as `R  old -> new`; surface the new path.
        let path = match path_part.split_once(" -> ") {
            Some((_old, new)) => new.to_string(),
            None => path_part.to_string(),
        };

        // Untracked.
        if index == '?' && worktree == '?' {
            files.push(StatusFile {
                path,
                state: FileState::Untracked,
                staged: false,
            });
            continue;
        }

        // Unmerged / conflicted: any of UU, AA, DD, or U on either side.
        if index == 'U' || worktree == 'U' || (index == 'A' && worktree == 'A')
            || (index == 'D' && worktree == 'D')
        {
            files.push(StatusFile {
                path,
                state: FileState::Conflicted,
                staged: false,
            });
            continue;
        }

        // Staged half (index column).
        if let Some(state) = state_from_code(index) {
            files.push(StatusFile {
                path: path.clone(),
                state,
                staged: true,
            });
        }
        // Unstaged half (worktree column).
        if let Some(state) = state_from_code(worktree) {
            files.push(StatusFile {
                path,
                state,
                staged: false,
            });
        }
    }

    let mut counts = StatusCounts::default();
    for file in &files {
        match (file.staged, file.state) {
            (true, _) => counts.staged += 1,
            (false, FileState::Untracked) => counts.untracked += 1,
            (false, _) => counts.modified += 1,
        }
    }

    GitStatus {
        branch,
        ahead,
        behind,
        files,
        counts,
    }
}

fn state_from_code(code: char) -> Option<FileState> {
    match code {
        'M' => Some(FileState::Modified),
        'A' => Some(FileState::Added),
        'D' => Some(FileState::Deleted),
        'R' => Some(FileState::Renamed),
        'C' => Some(FileState::Added), // copied -> treat like added
        'T' => Some(FileState::Modified), // type change
        _ => None,
    }
}

/// Parse the porcelain branch header body (everything after `## `).
fn parse_branch_header(rest: &str) -> (String, u32, u32) {
    if rest.starts_with("HEAD (no branch)") || rest.starts_with("No commits yet") {
        return ("HEAD (detached)".to_string(), 0, 0);
    }
    // Split off the optional ` [ahead N, behind M]` suffix.
    let (names, tracking) = match rest.split_once(" [") {
        Some((names, tracking)) => (names, Some(tracking.trim_end_matches(']'))),
        None => (rest, None),
    };
    let branch = names.split("...").next().unwrap_or(names).trim().to_string();

    let mut ahead = 0u32;
    let mut behind = 0u32;
    if let Some(tracking) = tracking {
        for part in tracking.split(',') {
            let part = part.trim();
            if let Some(n) = part.strip_prefix("ahead ") {
                ahead = n.trim().parse().unwrap_or(0);
            } else if let Some(n) = part.strip_prefix("behind ") {
                behind = n.trim().parse().unwrap_or(0);
            }
        }
    }
    (branch, ahead, behind)
}

// ---------------------------------------------------------------------------
// Diff summary (numstat)
// ---------------------------------------------------------------------------

/// Diff summary aggregated from `git diff --numstat`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Default)]
pub struct DiffSummary {
    pub files: u32,
    pub additions: u64,
    pub deletions: u64,
}

/// `GET /git/diff` response body. The `patch` is a byte window of the unified
/// diff (`offset`..`offset+limit`) so large diffs can be loaded incrementally
/// (manual load). `binary` is `true` when git reports a binary diff (`patch`
/// is then empty).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct GitDiff {
    pub mode: String,
    pub path: Option<String>,
    pub summary: DiffSummary,
    pub binary: bool,
    pub patch: String,
    /// Total byte length of the full unified diff.
    pub total: u64,
    /// `true` when the returned `patch` window does not reach `total`.
    pub truncated: bool,
}

/// Parse `git diff --numstat` output into a [`DiffSummary`].
///
/// Each line is `additions<TAB>deletions<TAB>path`. Binary files report
/// `-<TAB>-<TAB>path`: they count toward `files` but contribute no line counts
/// and flag `binary = true` in the second return value.
pub fn parse_numstat(output: &str) -> (DiffSummary, bool) {
    let mut summary = DiffSummary::default();
    let mut binary = false;
    for line in output.split('\n') {
        if line.is_empty() {
            continue;
        }
        let mut parts = line.splitn(3, '\t');
        let add = parts.next().unwrap_or("");
        let del = parts.next().unwrap_or("");
        if parts.next().is_none() {
            continue;
        }
        summary.files += 1;
        if add == "-" || del == "-" {
            binary = true;
            continue;
        }
        summary.additions += add.parse::<u64>().unwrap_or(0);
        summary.deletions += del.parse::<u64>().unwrap_or(0);
    }
    (summary, binary)
}

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

/// One branch entry in a branch listing.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct BranchInfo {
    pub name: String,
    pub current: bool,
    pub remote: bool,
}

/// `GET /git/branches` response body.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct GitBranches {
    pub current: String,
    pub branches: Vec<BranchInfo>,
}

/// Parse `git branch -a` output into a [`GitBranches`].
///
/// The current branch is the line prefixed `* `. Remote-tracking branches are
/// prefixed `remotes/`; the symbolic `remotes/origin/HEAD -> origin/main`
/// pointer line is skipped. A detached HEAD line (`* (HEAD detached at …)`) is
/// reported as current `"HEAD (detached)"` without a branch entry.
pub fn parse_branches(output: &str) -> GitBranches {
    let mut branches = Vec::new();
    let mut current = "HEAD (detached)".to_string();

    for line in output.split('\n') {
        let line = line.trim_end();
        if line.is_empty() {
            continue;
        }
        let is_current = line.starts_with("* ") || line.starts_with("+ ");
        let body = line[2..].trim();

        // Detached HEAD marker.
        if body.starts_with("(HEAD detached") || body.starts_with("(no branch") {
            if is_current {
                current = "HEAD (detached)".to_string();
            }
            continue;
        }

        // Skip the symbolic remote HEAD pointer.
        if body.contains(" -> ") {
            continue;
        }

        let remote = body.starts_with("remotes/");
        let name = body.strip_prefix("remotes/").unwrap_or(body).to_string();

        if is_current && !remote {
            current = name.clone();
        }
        branches.push(BranchInfo {
            name,
            current: is_current && !remote,
            remote,
        });
    }

    GitBranches { current, branches }
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/// Classify a non-zero git invocation from its stderr + exit code.
///
/// @spec SPEC-shared-error-display (error kinds the UI must distinguish)
pub fn classify_git_error(stderr: &str, _exit_code: Option<i32>) -> GitErrorKind {
    let lower = stderr.to_ascii_lowercase();

    if lower.contains("not a git repository") {
        return GitErrorKind::NotFound;
    }
    if lower.contains("authentication failed")
        || lower.contains("could not read username")
        || lower.contains("could not read password")
        || lower.contains("permission denied (publickey)")
        || lower.contains("invalid username or password")
    {
        return GitErrorKind::Auth;
    }
    if lower.contains("could not resolve host")
        || lower.contains("unable to access")
        || lower.contains("connection timed out")
        || lower.contains("failed to connect")
        || lower.contains("network is unreachable")
    {
        return GitErrorKind::Network;
    }
    if lower.contains("would be overwritten")
        || lower.contains("conflict")
        || lower.contains("needs merge")
        || lower.contains("overwritten by checkout")
        || lower.contains("local changes")
        || lower.contains("not possible because you have unmerged")
    {
        return GitErrorKind::Conflict;
    }
    if lower.contains("did not match any file")
        || lower.contains("pathspec")
        || lower.contains("did not match any")
        || lower.contains("unknown revision")
    {
        return GitErrorKind::NotFound;
    }
    GitErrorKind::Unknown
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

/// A write operation the UI can request.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GitOp {
    Stage,
    Unstage,
    Discard,
    Commit,
    BranchCheckout,
    BranchCreate,
    Fetch,
    Pull,
    Push,
    Sync,
}

impl GitOp {
    /// Parse a snake_case op name from the request body.
    pub fn parse(value: &str) -> Option<Self> {
        Some(match value {
            "stage" => GitOp::Stage,
            "unstage" => GitOp::Unstage,
            "discard" => GitOp::Discard,
            "commit" => GitOp::Commit,
            "branch_checkout" => GitOp::BranchCheckout,
            "branch_create" => GitOp::BranchCreate,
            "fetch" => GitOp::Fetch,
            "pull" => GitOp::Pull,
            "push" => GitOp::Push,
            "sync" => GitOp::Sync,
            _ => return None,
        })
    }

    pub fn as_str(self) -> &'static str {
        match self {
            GitOp::Stage => "stage",
            GitOp::Unstage => "unstage",
            GitOp::Discard => "discard",
            GitOp::Commit => "commit",
            GitOp::BranchCheckout => "branch_checkout",
            GitOp::BranchCreate => "branch_create",
            GitOp::Fetch => "fetch",
            GitOp::Pull => "pull",
            GitOp::Push => "push",
            GitOp::Sync => "sync",
        }
    }
}

/// Request payload for [`run_operation`].
#[derive(Debug, Clone, Default)]
pub struct OperationRequest {
    pub paths: Vec<String>,
    pub message: Option<String>,
    pub branch: Option<String>,
    pub remote: Option<String>,
    pub confirm_token: Option<String>,
}

/// Result of a successfully-spawned git operation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct OperationResult {
    pub op: String,
    pub exit_code: Option<i32>,
    /// Redacted, possibly-truncated combined stdout / stderr for inline display.
    pub message: String,
    /// Redacted full stdout.
    pub stdout: String,
    /// Redacted full stderr.
    pub stderr: String,
}

/// Derive the deterministic confirmation token for a destructive op.
///
/// Mirrors the file-delete token shape in `routes/files.rs`:
/// `confirm:<pid>:<op>:<target,...>`. The target list is the affected paths,
/// or the branch name for `branch_checkout`.
///
/// @spec SPEC-shared-destructive-confirmation
pub fn confirm_token(project_id: &str, op: GitOp, targets: &[String]) -> String {
    format!("confirm:{project_id}:{}:{}", op.as_str(), targets.join(","))
}

/// Whether an op is destructive in the given working-tree state.
///
/// `discard` is always destructive. `branch_checkout` is destructive only when
/// the working tree is dirty (the checkout could overwrite local changes).
pub fn is_destructive(op: GitOp, tree_dirty: bool) -> bool {
    matches!(op, GitOp::Discard) || (matches!(op, GitOp::BranchCheckout) && tree_dirty)
}

/// Targets a destructive op affects, used both for the confirm token and the
/// confirmation prompt.
fn destructive_targets(op: GitOp, request: &OperationRequest) -> Vec<String> {
    match op {
        GitOp::BranchCheckout => request.branch.iter().cloned().collect(),
        _ => request.paths.clone(),
    }
}

/// Read the working-tree status (porcelain) of a repo.
pub fn status(repo: &Path) -> Result<GitStatus, GitError> {
    let output = run_git(repo, &["status", "--porcelain=v1", "-b"])?;
    if !output.status.success() {
        let stderr = redact_secrets(&String::from_utf8_lossy(&output.stderr));
        return Err(operation_error(&stderr, output.status.code()));
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(parse_status(&stdout))
}

/// Read the branch listing of a repo.
pub fn branches(repo: &Path) -> Result<GitBranches, GitError> {
    let output = run_git(repo, &["branch", "-a"])?;
    if !output.status.success() {
        let stderr = redact_secrets(&String::from_utf8_lossy(&output.stderr));
        return Err(operation_error(&stderr, output.status.code()));
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(parse_branches(&stdout))
}

/// Compute a diff for `mode` (`unstaged` | `staged`), optionally scoped to a
/// single `path`, returning a byte window `offset..offset+limit` of the patch
/// plus an accurate numstat summary.
pub fn diff(
    repo: &Path,
    mode: &str,
    path: Option<&str>,
    offset: u64,
    limit: u64,
) -> Result<GitDiff, GitError> {
    let staged = match mode {
        "staged" => true,
        "unstaged" => false,
        _ => {
            return Err(GitError::Operation {
                kind: GitErrorKind::Validation,
                message: "mode must be 'unstaged' or 'staged'".to_string(),
                exit_code: None,
            });
        }
    };

    // Summary via numstat.
    let mut numstat_args: Vec<&str> = vec!["diff", "--numstat"];
    if staged {
        numstat_args.push("--cached");
    }
    if let Some(path) = path {
        numstat_args.push("--");
        numstat_args.push(path);
    }
    let numstat_out = run_git(repo, &numstat_args)?;
    if !numstat_out.status.success() {
        let stderr = redact_secrets(&String::from_utf8_lossy(&numstat_out.stderr));
        return Err(operation_error(&stderr, numstat_out.status.code()));
    }
    let (summary, binary) = parse_numstat(&String::from_utf8_lossy(&numstat_out.stdout));

    // Full patch text.
    let mut patch_args: Vec<&str> = vec!["diff"];
    if staged {
        patch_args.push("--cached");
    }
    if let Some(path) = path {
        patch_args.push("--");
        patch_args.push(path);
    }
    let patch_out = run_git(repo, &patch_args)?;
    if !patch_out.status.success() {
        let stderr = redact_secrets(&String::from_utf8_lossy(&patch_out.stderr));
        return Err(operation_error(&stderr, patch_out.status.code()));
    }

    let full = redact_secrets(&String::from_utf8_lossy(&patch_out.stdout));
    let bytes = full.as_bytes();
    let total = bytes.len() as u64;

    // Binary diffs carry no useful text patch.
    let (patch, truncated) = if binary {
        (String::new(), false)
    } else {
        window_utf8(bytes, offset, limit)
    };

    Ok(GitDiff {
        mode: mode.to_string(),
        path: path.map(str::to_string),
        summary,
        binary,
        patch,
        total,
        truncated,
    })
}

/// Slice a UTF-8 byte window `offset..offset+limit`, snapping to a valid char
/// boundary so the returned `patch` is always valid UTF-8.
fn window_utf8(bytes: &[u8], offset: u64, limit: u64) -> (String, bool) {
    let total = bytes.len() as u64;
    let start = offset.min(total) as usize;
    let end = offset.saturating_add(limit).min(total) as usize;
    let truncated = (end as u64) < total;
    // The full patch is already valid UTF-8; from_utf8_lossy only repairs the
    // boundary bytes split mid-codepoint by the window.
    (String::from_utf8_lossy(&bytes[start..end]).into_owned(), truncated)
}

/// Run a git write operation, enforcing destructive confirmation and request
/// validation, and classifying any non-zero exit.
///
/// The caller passes `project_id` (for the confirm-token derivation) and the
/// boundary-validated `repo` root.
pub fn run_operation(
    repo: &Path,
    project_id: &str,
    op: GitOp,
    request: &OperationRequest,
) -> Result<OperationResult, GitError> {
    // Validation that does not require touching the repo.
    match op {
        GitOp::Stage | GitOp::Unstage | GitOp::Discard if request.paths.is_empty() => {
            return Err(validation_error("paths must not be empty"));
        }
        GitOp::Commit => {
            let message_ok = request
                .message
                .as_deref()
                .map(|m| !m.trim().is_empty())
                .unwrap_or(false);
            if !message_ok {
                return Err(validation_error("commit message must not be empty"));
            }
            // Commit requires staged changes.
            let st = status(repo)?;
            if st.counts.staged == 0 {
                return Err(GitError::Operation {
                    kind: GitErrorKind::Validation,
                    message: "no staged changes to commit".to_string(),
                    exit_code: None,
                });
            }
        }
        GitOp::BranchCheckout | GitOp::BranchCreate
            if request.branch.as_deref().map(str::trim).unwrap_or("").is_empty() =>
        {
            return Err(validation_error("branch must not be empty"));
        }
        _ => {}
    }

    // Destructive confirmation enforcement.
    let tree_dirty = if matches!(op, GitOp::BranchCheckout) {
        !status(repo)?.files.is_empty()
    } else {
        false
    };
    if is_destructive(op, tree_dirty) {
        let targets = destructive_targets(op, request);
        let expected = confirm_token(project_id, op, &targets);
        if request.confirm_token.as_deref() != Some(expected.as_str()) {
            return Err(GitError::ConfirmationRequired(ConfirmationRequirement {
                op: op.as_str().to_string(),
                confirm_token: expected,
                targets,
            }));
        }
    }

    // Unstage prefers `git restore --staged` but falls back to `git reset HEAD`
    // when restore is unavailable (e.g. no HEAD yet in a fresh repo).
    if matches!(op, GitOp::Unstage) {
        let restore = exec_git(repo, op, &git_args(op, request));
        match restore {
            Ok(result) => return Ok(result),
            Err(GitError::Operation { .. }) => {
                let mut args = vec!["reset".to_string(), "HEAD".to_string(), "--".to_string()];
                args.extend(request.paths.iter().cloned());
                return exec_git(repo, op, &args);
            }
            Err(other) => return Err(other),
        }
    }

    // For sync, run pull then push as two invocations.
    if matches!(op, GitOp::Sync) {
        let pull = exec_git(repo, op, &["pull".to_string()])?;
        if pull.exit_code != Some(0) {
            return Ok(pull);
        }
        return exec_git(repo, op, &["push".to_string()]);
    }

    let args = git_args(op, request);
    exec_git(repo, op, &args)
}

/// Map an op + request onto the git argument vector.
fn git_args(op: GitOp, request: &OperationRequest) -> Vec<String> {
    let mut args: Vec<String> = Vec::new();
    match op {
        GitOp::Stage => {
            args.push("add".into());
            args.push("--".into());
            args.extend(request.paths.iter().cloned());
        }
        GitOp::Unstage => {
            // `git restore --staged -- <paths>` (modern); reset is the fallback,
            // but restore is available in all supported git versions here.
            args.push("restore".into());
            args.push("--staged".into());
            args.push("--".into());
            args.extend(request.paths.iter().cloned());
        }
        GitOp::Discard => {
            args.push("checkout".into());
            args.push("--".into());
            args.extend(request.paths.iter().cloned());
        }
        GitOp::Commit => {
            args.push("commit".into());
            args.push("-m".into());
            args.push(request.message.clone().unwrap_or_default());
        }
        GitOp::BranchCheckout => {
            args.push("checkout".into());
            args.push(request.branch.clone().unwrap_or_default());
        }
        GitOp::BranchCreate => {
            args.push("checkout".into());
            args.push("-b".into());
            args.push(request.branch.clone().unwrap_or_default());
        }
        GitOp::Fetch => args.push("fetch".into()),
        GitOp::Pull => args.push("pull".into()),
        GitOp::Push => args.push("push".into()),
        GitOp::Sync => {} // handled separately
    }
    args
}

/// Spawn git and turn the result into either an [`OperationResult`] (success or
/// classified non-zero) or a [`GitError::Operation`] for a non-zero exit.
fn exec_git(repo: &Path, op: GitOp, args: &[String]) -> Result<OperationResult, GitError> {
    let arg_refs: Vec<&str> = args.iter().map(String::as_str).collect();
    let output = run_git(repo, &arg_refs)?;
    let stdout = redact_secrets(&String::from_utf8_lossy(&output.stdout));
    let stderr = redact_secrets(&String::from_utf8_lossy(&output.stderr));

    if !output.status.success() {
        let combined = if stderr.is_empty() { stdout.clone() } else { stderr.clone() };
        return Err(operation_error(&combined, output.status.code()));
    }

    let message = if !stderr.is_empty() {
        stderr.clone()
    } else {
        stdout.clone()
    };
    Ok(OperationResult {
        op: op.as_str().to_string(),
        exit_code: output.status.code(),
        message,
        stdout,
        stderr,
    })
}

fn run_git(repo: &Path, args: &[&str]) -> Result<std::process::Output, GitError> {
    Command::new("git")
        .args(args)
        .current_dir(repo)
        .output()
        .map_err(GitError::Spawn)
}

fn operation_error(stderr: &str, exit_code: Option<i32>) -> GitError {
    let kind = classify_git_error(stderr, exit_code);
    if matches!(kind, GitErrorKind::NotFound) && stderr.to_ascii_lowercase().contains("not a git repository") {
        return GitError::NotARepo;
    }
    GitError::Operation {
        kind,
        message: stderr.trim().to_string(),
        exit_code,
    }
}

fn validation_error(message: &str) -> GitError {
    GitError::Operation {
        kind: GitErrorKind::Validation,
        message: message.to_string(),
        exit_code: None,
    }
}

/// Convenience for callers that already hold a [`PathBuf`].
pub fn repo_path(repo: impl Into<PathBuf>) -> PathBuf {
    repo.into()
}
