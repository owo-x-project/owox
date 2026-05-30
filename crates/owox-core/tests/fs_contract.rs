use owox_core::fs::{
    self, FsError, create_entry, delete_entry, read_content, read_tree, rename_entry, version_for,
    write_content,
};
use owox_core::workspace::WorkspaceBoundary;
use std::path::PathBuf;

/// Build a workspace root containing a single git-repo project and return
/// `(boundary, project_root)`. The tempdir is leaked-via-return so callers keep
/// it alive for the duration of the test.
fn fixture() -> (tempfile::TempDir, WorkspaceBoundary, PathBuf) {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().to_path_buf();
    let repo = root.join("repo");
    std::fs::create_dir_all(repo.join(".git")).unwrap();
    std::fs::write(repo.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
    let boundary = WorkspaceBoundary::new(&root).unwrap();
    (temp, boundary, repo)
}

#[test]
fn tree_lists_one_level_and_skips_git() {
    let (_temp, boundary, repo) = fixture();
    std::fs::create_dir_all(repo.join("src/nested")).unwrap();
    std::fs::write(repo.join("src/main.rs"), "fn main() {}\n").unwrap();
    std::fs::write(repo.join("src/nested/deep.rs"), "deep").unwrap();
    std::fs::write(repo.join("README.md"), "readme").unwrap();

    // Root listing: dirs first (src), then files (README.md). No `.git`.
    let root_listing = read_tree(&boundary, &repo, "").unwrap();
    let names: Vec<&str> = root_listing.entries.iter().map(|e| e.path.as_str()).collect();
    assert_eq!(names, vec!["src", "README.md"]);
    assert!(root_listing.entries.iter().all(|e| e.path != ".git"));

    // src listing is non-recursive: lists nested dir + main.rs, not deep.rs.
    let src_listing = read_tree(&boundary, &repo, "src").unwrap();
    assert_eq!(src_listing.path, "src");
    let src_names: Vec<&str> = src_listing.entries.iter().map(|e| e.path.as_str()).collect();
    assert_eq!(src_names, vec!["src/nested", "src/main.rs"]);
    assert_eq!(src_listing.entries[0].kind, "dir");
    assert_eq!(src_listing.entries[1].kind, "file");
}

#[test]
fn content_read_applies_offset_limit_and_truncation() {
    let (_temp, boundary, repo) = fixture();
    std::fs::write(repo.join("data.txt"), "abcdefghij").unwrap();

    let full = read_content(&boundary, &repo, "data.txt", 0, 65536).unwrap();
    assert_eq!(full.kind, "text");
    assert_eq!(full.content, "abcdefghij");
    assert!(!full.truncated);

    let partial = read_content(&boundary, &repo, "data.txt", 2, 3).unwrap();
    assert_eq!(partial.content, "cde");
    assert!(partial.truncated);

    let tail = read_content(&boundary, &repo, "data.txt", 8, 100).unwrap();
    assert_eq!(tail.content, "ij");
    assert!(!tail.truncated);
}

#[test]
fn binary_file_returns_kind_binary() {
    let (_temp, boundary, repo) = fixture();
    std::fs::write(repo.join("blob.bin"), [0xff, 0xfe, 0x00, 0x01]).unwrap();

    let content = read_content(&boundary, &repo, "blob.bin", 0, 65536).unwrap();
    assert_eq!(content.kind, "binary");
    assert_eq!(content.content, "");
}

#[test]
fn write_with_stale_expected_version_returns_conflict() {
    let (_temp, boundary, repo) = fixture();
    std::fs::write(repo.join("note.txt"), "v1").unwrap();
    let version = version_for(repo.join("note.txt"));

    // Stale version is rejected and the file is left untouched.
    let stale = write_content(&boundary, &repo, "note.txt", "hacked", Some("v_stale"));
    assert!(matches!(stale, Err(FsError::Conflict)));
    assert_eq!(std::fs::read_to_string(repo.join("note.txt")).unwrap(), "v1");

    // Matching version succeeds.
    let ok = write_content(&boundary, &repo, "note.txt", "v2 content", Some(&version)).unwrap();
    assert_eq!(ok.result, "saved");
    assert_eq!(std::fs::read_to_string(repo.join("note.txt")).unwrap(), "v2 content");
    assert_ne!(ok.version, version);
}

#[test]
fn traversal_path_is_rejected_as_boundary() {
    let (_temp, boundary, repo) = fixture();
    // Place a sibling secret outside the repo, inside the workspace root.
    std::fs::write(repo.parent().unwrap().join("secret.txt"), "top secret").unwrap();

    let tree = read_tree(&boundary, &repo, "../");
    assert!(matches!(tree, Err(FsError::Boundary)));

    let content = read_content(&boundary, &repo, "../secret.txt", 0, 65536);
    assert!(matches!(content, Err(FsError::Boundary)));
}

#[test]
fn create_rename_delete_happy_path() {
    let (_temp, boundary, repo) = fixture();

    let created = create_entry(&boundary, &repo, "src/new.rs", "file", Some("fn x() {}")).unwrap();
    assert_eq!(created.path, "src/new.rs");
    assert_eq!(created.kind, "file");
    assert!(repo.join("src/new.rs").is_file());

    // Creating an existing entry fails.
    let dup = create_entry(&boundary, &repo, "src/new.rs", "file", None);
    assert!(matches!(dup, Err(FsError::AlreadyExists)));

    let dir = create_entry(&boundary, &repo, "assets", "dir", None).unwrap();
    assert_eq!(dir.kind, "dir");
    assert!(repo.join("assets").is_dir());

    let renamed = rename_entry(&boundary, &repo, "src/new.rs", "src/lib.rs", None).unwrap();
    assert_eq!(renamed.path, "src/lib.rs");
    assert_eq!(renamed.result, "renamed");
    assert!(!repo.join("src/new.rs").exists());
    assert!(repo.join("src/lib.rs").is_file());

    delete_entry(&boundary, &repo, "src/lib.rs").unwrap();
    assert!(!repo.join("src/lib.rs").exists());

    let missing = delete_entry(&boundary, &repo, "src/lib.rs");
    assert!(matches!(missing, Err(FsError::NotFound)));
}

#[test]
fn rename_with_stale_version_conflicts_and_keeps_source() {
    let (_temp, boundary, repo) = fixture();
    std::fs::write(repo.join("a.txt"), "body").unwrap();

    let stale = rename_entry(&boundary, &repo, "a.txt", "b.txt", Some("v_stale"));
    assert!(matches!(stale, Err(FsError::Conflict)));
    assert!(repo.join("a.txt").exists());
    assert!(!repo.join("b.txt").exists());
}

#[test]
fn version_changes_on_edit() {
    let (_temp, boundary, repo) = fixture();
    std::fs::write(repo.join("v.txt"), "first").unwrap();
    let before = version_for(repo.join("v.txt"));
    // Different length guarantees a different version regardless of mtime.
    write_content(&boundary, &repo, "v.txt", "first-extended", None).unwrap();
    let after = version_for(repo.join("v.txt"));
    assert_ne!(before, after);
}

#[test]
fn tree_response_shape_matches_spec() {
    let (_temp, boundary, repo) = fixture();
    std::fs::write(repo.join("main.rs"), "fn main() {}\n").unwrap();
    let listing: fs::TreeListing = read_tree(&boundary, &repo, "").unwrap();
    let json = serde_json::to_value(&listing).unwrap();
    assert!(json.get("path").is_some());
    assert!(json.get("entries").is_some());
    assert!(json.get("version").is_some());
    let entry = &json["entries"][0];
    assert!(entry.get("path").is_some());
    assert!(entry.get("kind").is_some());
    assert!(entry.get("version").is_some());
}
