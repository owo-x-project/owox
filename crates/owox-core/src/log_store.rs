//! Append-only log store rooted under the managed data directory.
//!
//! @spec SPEC-ui-log-view
//! @spec SPEC-shared-http-api (Log)
//! @adr ADR-0004 (logs live in the managed data dir, never inside project repos)
//!
//! Each log is a single append-only byte file named by its `log_id`. Reads are
//! byte-range requests. `log_id` is constrained to `^[A-Za-z0-9_-]+$` so it can
//! never escape the store root via path traversal.

use serde::Serialize;
use std::fs::{self, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum LogStoreError {
    #[error("invalid log id")]
    InvalidId,
    #[error("log not found")]
    NotFound,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

/// One contiguous chunk of decoded log bytes.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LogChunk {
    pub offset: u64,
    pub data: String,
}

/// Range-read response for a single log.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LogRange {
    pub log_id: String,
    pub offset: u64,
    pub limit: u64,
    pub total: u64,
    pub chunks: Vec<LogChunk>,
    pub truncated: bool,
}

/// Append-only log store. `root` is typically `data_dir/logs`.
#[derive(Debug, Clone)]
pub struct LogStore {
    root: PathBuf,
}

impl LogStore {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn root(&self) -> &PathBuf {
        &self.root
    }

    fn path_for(&self, log_id: &str) -> Result<PathBuf, LogStoreError> {
        if !is_safe_log_id(log_id) {
            return Err(LogStoreError::InvalidId);
        }
        Ok(self.root.join(log_id))
    }

    /// Append `bytes` to the log, creating it (and the store root) if needed.
    pub fn append(&self, log_id: &str, bytes: &[u8]) -> Result<(), LogStoreError> {
        let path = self.path_for(log_id)?;
        fs::create_dir_all(&self.root)?;
        let mut file = OpenOptions::new().create(true).append(true).open(path)?;
        file.write_all(bytes)?;
        Ok(())
    }

    /// Read a byte range from the log. `data` is the UTF-8 (lossy) decoding of
    /// the requested range; `total` is the full byte length of the log.
    pub fn read_range(
        &self,
        log_id: &str,
        offset: u64,
        limit: u64,
    ) -> Result<LogRange, LogStoreError> {
        let path = self.path_for(log_id)?;
        let mut file = match fs::File::open(&path) {
            Ok(file) => file,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Err(LogStoreError::NotFound);
            }
            Err(error) => return Err(LogStoreError::Io(error)),
        };
        let total = file.metadata()?.len();

        let start = offset.min(total);
        let read_len = limit.min(total.saturating_sub(start));
        let mut buffer = vec![0u8; read_len as usize];
        if read_len > 0 {
            file.seek(SeekFrom::Start(start))?;
            file.read_exact(&mut buffer)?;
        }
        let truncated = start.saturating_add(read_len) < total;

        let chunks = if read_len == 0 {
            Vec::new()
        } else {
            vec![LogChunk {
                offset: start,
                data: String::from_utf8_lossy(&buffer).into_owned(),
            }]
        };

        Ok(LogRange {
            log_id: log_id.to_string(),
            offset,
            limit,
            total,
            chunks,
            truncated,
        })
    }

    /// Delete a log. Missing logs are treated as already deleted (idempotent).
    pub fn delete(&self, log_id: &str) -> Result<(), LogStoreError> {
        let path = self.path_for(log_id)?;
        match fs::remove_file(path) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(LogStoreError::Io(error)),
        }
    }
}

fn is_safe_log_id(log_id: &str) -> bool {
    !log_id.is_empty()
        && log_id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'-')
}
