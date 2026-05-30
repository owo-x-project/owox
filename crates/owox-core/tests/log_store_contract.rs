use owox_core::log_store::{LogStore, LogStoreError};

fn store() -> (tempfile::TempDir, LogStore) {
    let temp = tempfile::tempdir().unwrap();
    let store = LogStore::new(temp.path().join("logs"));
    (temp, store)
}

#[test]
fn append_then_range_read_reports_total_and_truncation() {
    let (_temp, store) = store();
    store.append("log_abc", b"hello ").unwrap();
    store.append("log_abc", b"world").unwrap();

    let full = store.read_range("log_abc", 0, 65536).unwrap();
    assert_eq!(full.log_id, "log_abc");
    assert_eq!(full.total, 11);
    assert_eq!(full.offset, 0);
    assert_eq!(full.limit, 65536);
    assert!(!full.truncated);
    assert_eq!(full.chunks.len(), 1);
    assert_eq!(full.chunks[0].offset, 0);
    assert_eq!(full.chunks[0].data, "hello world");

    let partial = store.read_range("log_abc", 0, 5).unwrap();
    assert_eq!(partial.total, 11);
    assert!(partial.truncated);
    assert_eq!(partial.chunks[0].data, "hello");

    let mid = store.read_range("log_abc", 6, 5).unwrap();
    assert_eq!(mid.chunks[0].offset, 6);
    assert_eq!(mid.chunks[0].data, "world");
    assert!(!mid.truncated);
}

#[test]
fn read_beyond_end_returns_empty_chunks() {
    let (_temp, store) = store();
    store.append("log_x", b"abc").unwrap();
    let range = store.read_range("log_x", 10, 5).unwrap();
    assert_eq!(range.total, 3);
    assert!(range.chunks.is_empty());
    assert!(!range.truncated);
}

#[test]
fn invalid_log_id_is_rejected() {
    let (_temp, store) = store();
    for bad in ["../etc/passwd", "a/b", "log id", "", "log.txt"] {
        let read = store.read_range(bad, 0, 10);
        assert!(matches!(read, Err(LogStoreError::InvalidId)), "id {bad:?}");
        let append = store.append(bad, b"x");
        assert!(matches!(append, Err(LogStoreError::InvalidId)), "id {bad:?}");
    }
}

#[test]
fn missing_log_read_is_not_found() {
    let (_temp, store) = store();
    let read = store.read_range("log_missing", 0, 10);
    assert!(matches!(read, Err(LogStoreError::NotFound)));
}

#[test]
fn delete_removes_log_and_is_idempotent() {
    let (_temp, store) = store();
    store.append("log_del", b"data").unwrap();
    assert!(store.read_range("log_del", 0, 10).is_ok());

    store.delete("log_del").unwrap();
    assert!(matches!(
        store.read_range("log_del", 0, 10),
        Err(LogStoreError::NotFound)
    ));

    // Deleting again is a no-op.
    store.delete("log_del").unwrap();
}

#[test]
fn range_response_shape_matches_spec() {
    let (_temp, store) = store();
    store.append("log_s", b"payload").unwrap();
    let range = store.read_range("log_s", 0, 65536).unwrap();
    let json = serde_json::to_value(&range).unwrap();
    for field in ["log_id", "offset", "limit", "total", "chunks", "truncated"] {
        assert!(json.get(field).is_some(), "missing {field}");
    }
    assert!(json["chunks"][0].get("offset").is_some());
    assert!(json["chunks"][0].get("data").is_some());
}
