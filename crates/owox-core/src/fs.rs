//! Filesystem service for the file tree and editor surfaces.
//!
//! @spec SPEC-ui-file-tree
//! @spec SPEC-ui-editor
//! @spec SPEC-shared-http-api (File / Editor)
//! @spec SPEC-shared-workspace-boundary
//!
//! Every path is resolved through [`WorkspaceBoundary::resolve_repo_path`] so
//! `..` traversal and symlink escapes are rejected before any IO happens.
//! Boundary rejections surface as [`FsError::Boundary`].

use crate::workspace::{WorkspaceBoundary, WorkspaceError};
use serde::Serialize;
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum FsError {
    #[error("path is outside the selected project")]
    Boundary,
    #[error("resource not found")]
    NotFound,
    #[error("resource already exists")]
    AlreadyExists,
    #[error("expected_version did not match the current version")]
    Conflict,
    #[error("target is not a directory")]
    NotADirectory,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

impl From<WorkspaceError> for FsError {
    fn from(error: WorkspaceError) -> Self {
        match error {
            WorkspaceError::BoundaryViolation => Self::Boundary,
            WorkspaceError::Io(io) => Self::Io(io),
            // A missing / non-direct project root is treated as a boundary
            // rejection: the caller never gets to point IO outside the repo.
            WorkspaceError::InvalidRoot | WorkspaceError::ProjectUnavailable => Self::Boundary,
        }
    }
}

/// A single directory entry in a tree listing.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct TreeEntry {
    pub path: String,
    pub kind: String,
    pub version: String,
}

/// One non-recursive directory level.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct TreeListing {
    pub path: String,
    pub entries: Vec<TreeEntry>,
    pub version: String,
}

/// Editor content payload. `kind` is `"text"` for valid UTF-8 or `"binary"`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct FileContent {
    pub path: String,
    pub kind: String,
    pub version: String,
    pub content: String,
    pub truncated: bool,
}

/// Result of a content write (PUT).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct WriteResult {
    pub path: String,
    pub version: String,
    pub result: String,
}

/// Result of an entry creation (POST).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct CreateResult {
    pub path: String,
    pub kind: String,
    pub version: String,
}

/// Result of a rename (PATCH).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct RenameResult {
    pub path: String,
    pub version: String,
    pub result: String,
}

/// Normalize a repo-relative path string for use as a response `path` field:
/// drop a leading `./`, collapse `\` -> `/`, and trim a trailing slash.
fn normalize_rel(rel: &str) -> String {
    let rel = rel.replace('\\', "/");
    let rel = rel.strip_prefix("./").unwrap_or(&rel);
    rel.trim_end_matches('/').to_string()
}

fn join_rel(parent: &str, name: &str) -> String {
    if parent.is_empty() {
        name.to_string()
    } else {
        format!("{parent}/{name}")
    }
}

/// Opaque version derived from byte length + mtime. Format `v_<hex>`.
///
/// A hand-rolled FNV-1a hash over `"{len}:{mtime_nanos}"` keeps this cheap and
/// dependency-free while changing on every edit (size or mtime change).
pub fn version_for(path: impl AsRef<Path>) -> String {
    let path = path.as_ref();
    let metadata = match fs::metadata(path) {
        Ok(metadata) => metadata,
        Err(_) => return "v_0".to_string(),
    };
    let len = metadata.len();
    let mtime_nanos = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let seed = format!("{len}:{mtime_nanos}");
    format!("v_{:016x}", fnv1a(seed.as_bytes()))
}

fn fnv1a(bytes: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for &byte in bytes {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    hash
}

/// Ensure every ancestor directory of `rel` exists, creating them one level at
/// a time. Each level is resolved through [`WorkspaceBoundary::resolve_repo_path`]
/// (whose existing parent canonicalizes) so traversal escapes are still rejected.
fn ensure_parent_dirs(
    boundary: &WorkspaceBoundary,
    project_root: impl AsRef<Path>,
    rel: &str,
) -> Result<(), FsError> {
    let segments: Vec<&str> = rel.split('/').filter(|s| !s.is_empty()).collect();
    if segments.len() <= 1 {
        // Leaf lives directly under the (validated) repo root: nothing to make.
        boundary.resolve_repo_path(&project_root, "")?;
        return Ok(());
    }
    let mut current = String::new();
    for segment in &segments[..segments.len() - 1] {
        if !current.is_empty() {
            current.push('/');
        }
        current.push_str(segment);
        let abs = boundary.resolve_repo_path(&project_root, &current)?;
        if !abs.exists() {
            fs::create_dir(&abs).map_err(map_io)?;
        } else if !abs.is_dir() {
            return Err(FsError::NotADirectory);
        }
    }
    Ok(())
}

fn map_io(error: std::io::Error) -> FsError {
    match error.kind() {
        std::io::ErrorKind::NotFound => FsError::NotFound,
        std::io::ErrorKind::AlreadyExists => FsError::AlreadyExists,
        _ => FsError::Io(error),
    }
}

/// List one (non-recursive) directory level inside the project repo. Hidden
/// `.git` is skipped. Entries are sorted dirs-first, then by name ascending.
pub fn read_tree(
    boundary: &WorkspaceBoundary,
    project_root: impl AsRef<Path>,
    rel_path: &str,
) -> Result<TreeListing, FsError> {
    let rel = normalize_rel(rel_path);
    let abs = boundary.resolve_repo_path(&project_root, &rel)?;
    if !abs.is_dir() {
        return Err(FsError::NotADirectory);
    }

    let mut entries = Vec::new();
    for entry in fs::read_dir(&abs).map_err(map_io)? {
        let entry = entry.map_err(map_io)?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name == ".git" {
            continue;
        }
        let file_type = entry.file_type().map_err(map_io)?;
        let kind = if file_type.is_dir() { "dir" } else { "file" };
        let child_path = join_rel(&rel, &name);
        entries.push(TreeEntry {
            path: child_path,
            kind: kind.to_string(),
            version: version_for(entry.path()),
        });
    }

    entries.sort_by(|a, b| {
        let dir_a = a.kind == "dir";
        let dir_b = b.kind == "dir";
        dir_b.cmp(&dir_a).then_with(|| a.path.cmp(&b.path))
    });

    Ok(TreeListing {
        path: rel,
        version: version_for(&abs),
        entries,
    })
}

/// Read file content over a byte range. Valid UTF-8 yields `kind = "text"`;
/// otherwise `kind = "binary"` with empty content (no error).
pub fn read_content(
    boundary: &WorkspaceBoundary,
    project_root: impl AsRef<Path>,
    rel_path: &str,
    offset: u64,
    limit: u64,
) -> Result<FileContent, FsError> {
    let rel = normalize_rel(rel_path);
    let abs = boundary.resolve_repo_path(&project_root, &rel)?;
    if abs.is_dir() {
        return Err(FsError::NotADirectory);
    }
    let version = version_for(&abs);
    let bytes = fs::read(&abs).map_err(map_io)?;
    let total = bytes.len() as u64;

    let start = offset.min(total) as usize;
    let end = offset.saturating_add(limit).min(total) as usize;
    let slice = &bytes[start..end];
    let truncated = (end as u64) < total;

    match std::str::from_utf8(slice) {
        Ok(text) => Ok(FileContent {
            path: rel,
            kind: "text".to_string(),
            version,
            content: text.to_string(),
            truncated,
        }),
        Err(_) => Ok(FileContent {
            path: rel,
            kind: "binary".to_string(),
            version,
            content: String::new(),
            truncated,
        }),
    }
}

/// Overwrite file content with optimistic concurrency. When `expected_version`
/// is `Some` and does not match the current on-disk version, the write is
/// rejected with [`FsError::Conflict`] and the file is left untouched.
pub fn write_content(
    boundary: &WorkspaceBoundary,
    project_root: impl AsRef<Path>,
    rel_path: &str,
    content: &str,
    expected_version: Option<&str>,
) -> Result<WriteResult, FsError> {
    let rel = normalize_rel(rel_path);
    let abs = boundary.resolve_repo_path(&project_root, &rel)?;
    if abs.is_dir() {
        return Err(FsError::NotADirectory);
    }
    if !abs.exists() {
        return Err(FsError::NotFound);
    }
    if let Some(expected) = expected_version {
        let current = version_for(&abs);
        if current != expected {
            return Err(FsError::Conflict);
        }
    }
    fs::write(&abs, content.as_bytes()).map_err(map_io)?;
    Ok(WriteResult {
        path: rel,
        version: version_for(&abs),
        result: "saved".to_string(),
    })
}

/// Create a file or directory. Errors if the target already exists. `kind` is
/// `"file"` or `"dir"`; `content` is written for files (empty when `None`).
pub fn create_entry(
    boundary: &WorkspaceBoundary,
    project_root: impl AsRef<Path>,
    rel_path: &str,
    kind: &str,
    content: Option<&str>,
) -> Result<CreateResult, FsError> {
    let rel = normalize_rel(rel_path);
    ensure_parent_dirs(boundary, &project_root, &rel)?;
    let abs = boundary.resolve_repo_path(&project_root, &rel)?;
    if abs.exists() {
        return Err(FsError::AlreadyExists);
    }
    match kind {
        "dir" => fs::create_dir(&abs).map_err(map_io)?,
        _ => fs::write(&abs, content.unwrap_or("").as_bytes()).map_err(map_io)?,
    }
    let normalized_kind = if kind == "dir" { "dir" } else { "file" };
    Ok(CreateResult {
        path: rel,
        kind: normalized_kind.to_string(),
        version: version_for(&abs),
    })
}

/// Rename / move an entry. Optimistic concurrency on the source entry: when
/// `expected_version` is provided it must match the source's current version.
pub fn rename_entry(
    boundary: &WorkspaceBoundary,
    project_root: impl AsRef<Path>,
    rel_path: &str,
    target_path: &str,
    expected_version: Option<&str>,
) -> Result<RenameResult, FsError> {
    let rel = normalize_rel(rel_path);
    let target_rel = normalize_rel(target_path);
    let abs = boundary.resolve_repo_path(&project_root, &rel)?;
    let target_abs = boundary.resolve_repo_path(&project_root, &target_rel)?;
    if !abs.exists() {
        return Err(FsError::NotFound);
    }
    if target_abs.exists() {
        return Err(FsError::AlreadyExists);
    }
    if let Some(expected) = expected_version {
        let current = version_for(&abs);
        if current != expected {
            return Err(FsError::Conflict);
        }
    }
    ensure_parent_dirs(boundary, &project_root, &target_rel)?;
    fs::rename(&abs, &target_abs).map_err(map_io)?;
    Ok(RenameResult {
        path: target_rel,
        version: version_for(&target_abs),
        result: "renamed".to_string(),
    })
}

/// Delete a file or directory (recursive for directories). The caller is
/// responsible for enforcing destructive confirmation before calling this.
pub fn delete_entry(
    boundary: &WorkspaceBoundary,
    project_root: impl AsRef<Path>,
    rel_path: &str,
) -> Result<(), FsError> {
    let rel = normalize_rel(rel_path);
    let abs = boundary.resolve_repo_path(&project_root, &rel)?;
    if !abs.exists() {
        return Err(FsError::NotFound);
    }
    if abs.is_dir() {
        fs::remove_dir_all(&abs).map_err(map_io)?;
    } else {
        fs::remove_file(&abs).map_err(map_io)?;
    }
    Ok(())
}
