//! PTY-backed terminal session runtime.
//!
//! @spec SPEC-runtime-terminal-session (5-state machine creating/running/exited/failed/terminated)
//! @spec SPEC-runtime-terminal-log-reconnect (append log + redaction + reconnect replay)
//! @spec SPEC-shared-command-execution (cwd/env/exit status boundary)
//! @spec SPEC-shared-workspace-boundary (cwd must stay inside the project repo)
//! @adr ADR-0004 (session output persists in the managed log store, not the repo)
//!
//! A [`TerminalRegistry`] owns the set of live [`SessionHandle`]s. Each session
//! spawns a PTY child; a dedicated std reader thread pumps PTY output, redacts
//! it, appends it to a per-session [`LogStore`] log, and broadcasts chunks on a
//! [`tokio::sync::broadcast`] channel. Blocking PTY reads never touch the tokio
//! runtime — the bridge to async is the broadcast channel whose `send` is
//! callable from a plain thread.

use crate::log_store::LogStore;
use crate::workspace::{WorkspaceBoundary, WorkspaceError};
use portable_pty::{CommandBuilder, MasterPty, PtySize, native_pty_system};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use thiserror::Error;
use tokio::sync::broadcast;

/// Broadcast channel capacity per session. Lagged receivers are dropped frames
/// gracefully; the HTTP log range (reconnect replay) backfills any gap.
const BROADCAST_CAPACITY: usize = 1024;

/// Size of each PTY read buffer. Output chunks stay small per the WebSocket
/// inline-bytes contract for `term.output`.
const READ_CHUNK: usize = 8 * 1024;

/// 5-state machine for a terminal session.
///
/// @spec SPEC-runtime-terminal-session
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SessionState {
    /// Process is being prepared (PTY opened, command being spawned).
    Creating,
    /// Process is alive and accepts input/output.
    Running,
    /// Process exited (zero or non-zero); `exit_code` is retained.
    Exited,
    /// Process failed to start.
    Failed,
    /// Process was killed by a user or server operation.
    Terminated,
}

impl SessionState {
    pub fn as_str(self) -> &'static str {
        match self {
            SessionState::Creating => "creating",
            SessionState::Running => "running",
            SessionState::Exited => "exited",
            SessionState::Failed => "failed",
            SessionState::Terminated => "terminated",
        }
    }
}

/// A single redacted output chunk broadcast to subscribers.
#[derive(Debug, Clone)]
pub enum TermChunk {
    /// Redacted output bytes with a monotonic per-session sequence.
    Output { seq: u64, data: String },
    /// A state transition (emitted on every change).
    State(SessionInfo),
}

/// Immutable snapshot of a session's metadata and current state.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SessionInfo {
    pub id: String,
    pub project_id: String,
    pub state: SessionState,
    pub exit_code: Option<i32>,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub pid: Option<u32>,
    pub label: Option<String>,
    pub cwd: String,
    pub command: String,
    pub log_id: String,
    pub reason: Option<String>,
}

/// Parameters for creating a new session.
#[derive(Debug, Clone)]
pub struct CreateSession {
    pub project_id: String,
    /// Repo-relative cwd; validated against the project boundary before spawn.
    pub cwd: String,
    /// Program to run; empty selects the default shell.
    pub command: String,
    pub args: Vec<String>,
    pub env: BTreeMap<String, String>,
    pub cols: u16,
    pub rows: u16,
    pub label: Option<String>,
}

#[derive(Debug, Error)]
pub enum TerminalError {
    #[error("cwd is outside the selected project")]
    Boundary,
    #[error("session not found")]
    NotFound,
    #[error("failed to spawn process: {0}")]
    SpawnFailed(String),
    #[error("io error: {0}")]
    Io(String),
}

impl From<WorkspaceError> for TerminalError {
    fn from(_: WorkspaceError) -> Self {
        TerminalError::Boundary
    }
}

/// Mutable, shared per-session state guarded by a single mutex.
#[derive(Debug)]
struct SessionShared {
    info: SessionInfo,
}

/// One live session: shared state, PTY writer/master, broadcast sender, child killer.
struct SessionHandle {
    shared: Arc<Mutex<SessionShared>>,
    sender: broadcast::Sender<TermChunk>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    master: Arc<Mutex<Box<dyn MasterPty + Send>>>,
    killer: Arc<Mutex<Box<dyn portable_pty::ChildKiller + Send + Sync>>>,
}

impl SessionHandle {
    fn snapshot(&self) -> SessionInfo {
        self.shared.lock().unwrap().info.clone()
    }
}

/// Cloneable registry of live terminal sessions.
#[derive(Clone)]
pub struct TerminalRegistry {
    inner: Arc<RegistryInner>,
}

struct RegistryInner {
    sessions: Mutex<HashMap<String, SessionHandle>>,
    log_store: LogStore,
}

impl TerminalRegistry {
    pub fn new(log_store: LogStore) -> Self {
        Self {
            inner: Arc::new(RegistryInner {
                sessions: Mutex::new(HashMap::new()),
                log_store,
            }),
        }
    }

    pub fn log_store(&self) -> &LogStore {
        &self.inner.log_store
    }

    /// Derive a session id (`ses_<hex>`).
    pub fn new_session_id() -> String {
        format!("ses_{}", uuid::Uuid::new_v4().simple())
    }

    /// Derive the per-session log id from the session id (`log_<hex>`).
    pub fn log_id_for(session_id: &str) -> String {
        let hex = session_id.strip_prefix("ses_").unwrap_or(session_id);
        format!("log_{hex}")
    }

    /// Create + spawn a session.
    ///
    /// The cwd is validated against the project boundary *before* the process is
    /// spawned, so a boundary escape never reaches `native_pty_system`.
    ///
    /// @spec SPEC-runtime-terminal-session (cwd boundary; command-not-found -> failed)
    pub fn create_session(
        &self,
        boundary: &WorkspaceBoundary,
        project_root: impl AsRef<Path>,
        request: CreateSession,
        now_ms: i64,
    ) -> Result<SessionInfo, TerminalError> {
        // Boundary check first — reject before any spawn.
        let cwd = boundary.validate_command_cwd(&project_root, &request.cwd)?;

        let session_id = Self::new_session_id();
        let log_id = Self::log_id_for(&session_id);
        let command_display = if request.command.is_empty() {
            default_shell()
        } else {
            request.command.clone()
        };

        let info = SessionInfo {
            id: session_id.clone(),
            project_id: request.project_id.clone(),
            state: SessionState::Creating,
            exit_code: None,
            started_at: now_ms,
            ended_at: None,
            pid: None,
            label: request.label.clone(),
            cwd: request.cwd.clone(),
            command: command_display,
            log_id: log_id.clone(),
            reason: None,
        };

        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows: request.rows.max(1),
                cols: request.cols.max(1),
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| TerminalError::Io(e.to_string()))?;

        // Build the command (default shell when empty).
        let mut builder = if request.command.is_empty() {
            CommandBuilder::new(default_shell())
        } else {
            let mut b = CommandBuilder::new(&request.command);
            b.args(&request.args);
            b
        };
        builder.cwd(&cwd);
        for (key, value) in &request.env {
            builder.env(key, value);
        }

        let shared = Arc::new(Mutex::new(SessionShared { info: info.clone() }));
        let (sender, _rx) = broadcast::channel(BROADCAST_CAPACITY);
        let seq = Arc::new(AtomicU64::new(0));

        // Spawn the child on the slave side.
        let child = match pair.slave.spawn_command(builder) {
            Ok(child) => child,
            Err(error) => {
                // Spawn failed -> Failed state. No reader thread.
                let mut guard = shared.lock().unwrap();
                guard.info.state = SessionState::Failed;
                guard.info.ended_at = Some(now_ms);
                guard.info.reason = Some(error.to_string());
                let failed = guard.info.clone();
                drop(guard);
                // Persist a Failed handle-less entry so HTTP GET can still read it.
                let handle = SessionHandle {
                    shared: shared.clone(),
                    sender,
                    writer: Arc::new(Mutex::new(Box::new(std::io::sink()))),
                    master: Arc::new(Mutex::new(pair.master)),
                    killer: Arc::new(Mutex::new(NoopKiller::boxed())),
                };
                self.inner
                    .sessions
                    .lock()
                    .unwrap()
                    .insert(session_id, handle);
                return Ok(failed);
            }
        };

        let pid = child.process_id();
        let killer = child.clone_killer();

        // Acquire the writer + a clone of the reader before moving things around.
        let writer = pair
            .master
            .take_writer()
            .map_err(|e| TerminalError::Io(e.to_string()))?;
        let reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| TerminalError::Io(e.to_string()))?;

        // Transition to Running.
        {
            let mut guard = shared.lock().unwrap();
            guard.info.state = SessionState::Running;
            guard.info.pid = pid;
        }
        let running = shared.lock().unwrap().info.clone();
        let _ = sender.send(TermChunk::State(running.clone()));

        let handle = SessionHandle {
            shared: shared.clone(),
            sender: sender.clone(),
            writer: Arc::new(Mutex::new(writer)),
            master: Arc::new(Mutex::new(pair.master)),
            killer: Arc::new(Mutex::new(killer)),
        };
        self.inner
            .sessions
            .lock()
            .unwrap()
            .insert(session_id.clone(), handle);

        // Reader thread: pump PTY output -> redact -> append log -> broadcast.
        spawn_reader_thread(ReaderContext {
            shared,
            sender,
            seq,
            log_store: self.inner.log_store.clone(),
            log_id,
            reader,
            child,
        });

        Ok(running)
    }

    /// Write raw bytes to a session's PTY.
    pub fn write_input(&self, session_id: &str, bytes: &[u8]) -> Result<(), TerminalError> {
        let sessions = self.inner.sessions.lock().unwrap();
        let handle = sessions.get(session_id).ok_or(TerminalError::NotFound)?;
        let writer = handle.writer.clone();
        drop(sessions);
        let mut writer = writer.lock().unwrap();
        writer
            .write_all(bytes)
            .map_err(|e| TerminalError::Io(e.to_string()))?;
        writer.flush().map_err(|e| TerminalError::Io(e.to_string()))?;
        Ok(())
    }

    /// Resize a session's PTY.
    pub fn resize(&self, session_id: &str, cols: u16, rows: u16) -> Result<(), TerminalError> {
        let sessions = self.inner.sessions.lock().unwrap();
        let handle = sessions.get(session_id).ok_or(TerminalError::NotFound)?;
        let master = handle.master.clone();
        drop(sessions);
        master
            .lock()
            .unwrap()
            .resize(PtySize {
                rows: rows.max(1),
                cols: cols.max(1),
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| TerminalError::Io(e.to_string()))
    }

    /// Terminate a session: kill the child and set state `Terminated`.
    ///
    /// @spec SPEC-runtime-terminal-session (terminated = user/server stop)
    pub fn stop_session(&self, session_id: &str, now_ms: i64) -> Result<(), TerminalError> {
        let sessions = self.inner.sessions.lock().unwrap();
        let handle = sessions.get(session_id).ok_or(TerminalError::NotFound)?;
        let killer = handle.killer.clone();
        let shared = handle.shared.clone();
        let sender = handle.sender.clone();
        drop(sessions);

        let _ = killer.lock().unwrap().kill();

        let mut guard = shared.lock().unwrap();
        // Only override state if still active; a process that already exited
        // keeps its terminal state.
        if matches!(
            guard.info.state,
            SessionState::Creating | SessionState::Running
        ) {
            guard.info.state = SessionState::Terminated;
            guard.info.ended_at = Some(now_ms);
            guard.info.reason = Some("terminated".to_string());
            let snapshot = guard.info.clone();
            drop(guard);
            let _ = sender.send(TermChunk::State(snapshot));
        }
        Ok(())
    }

    /// Subscribe to a session's chunk broadcast.
    pub fn subscribe(
        &self,
        session_id: &str,
    ) -> Result<broadcast::Receiver<TermChunk>, TerminalError> {
        let sessions = self.inner.sessions.lock().unwrap();
        let handle = sessions.get(session_id).ok_or(TerminalError::NotFound)?;
        Ok(handle.sender.subscribe())
    }

    /// Snapshot a single session.
    pub fn snapshot(&self, session_id: &str) -> Option<SessionInfo> {
        self.inner
            .sessions
            .lock()
            .unwrap()
            .get(session_id)
            .map(SessionHandle::snapshot)
    }

    /// List all live sessions.
    pub fn list(&self) -> Vec<SessionInfo> {
        self.inner
            .sessions
            .lock()
            .unwrap()
            .values()
            .map(SessionHandle::snapshot)
            .collect()
    }

    /// List live sessions for a given project.
    pub fn list_by_project(&self, project_id: &str) -> Vec<SessionInfo> {
        self.inner
            .sessions
            .lock()
            .unwrap()
            .values()
            .map(SessionHandle::snapshot)
            .filter(|info| info.project_id == project_id)
            .collect()
    }

    /// Whether a session is currently active (Creating/Running).
    pub fn is_active(&self, session_id: &str) -> bool {
        self.snapshot(session_id)
            .map(|info| matches!(info.state, SessionState::Creating | SessionState::Running))
            .unwrap_or(false)
    }
}

struct ReaderContext {
    shared: Arc<Mutex<SessionShared>>,
    sender: broadcast::Sender<TermChunk>,
    seq: Arc<AtomicU64>,
    log_store: LogStore,
    log_id: String,
    reader: Box<dyn Read + Send>,
    child: Box<dyn portable_pty::Child + Send + Sync>,
}

/// Spawn the blocking reader thread that bridges PTY output to async via the
/// broadcast channel. Runs on a std thread so it never blocks the tokio runtime.
fn spawn_reader_thread(mut ctx: ReaderContext) {
    std::thread::spawn(move || {
        let mut buffer = [0u8; READ_CHUNK];
        loop {
            match ctx.reader.read(&mut buffer) {
                Ok(0) => break, // EOF: child closed the PTY.
                Ok(n) => {
                    // PTY output is forwarded as-is; redaction via
                    // split_whitespace destroys control chars (newlines, ANSI
                    // escapes) and must not be applied to raw terminal streams.
                    let text = String::from_utf8_lossy(&buffer[..n]).into_owned();
                    if text.is_empty() {
                        continue;
                    }
                    let _ = ctx.log_store.append(&ctx.log_id, text.as_bytes());
                    let seq = ctx.seq.fetch_add(1, Ordering::SeqCst);
                    let _ = ctx.sender.send(TermChunk::Output {
                        seq,
                        data: text,
                    });
                }
                Err(error) if error.kind() == std::io::ErrorKind::Interrupted => continue,
                Err(_) => break,
            }
        }

        // Reader hit EOF — reap the child for its exit status.
        let exit = ctx.child.wait().ok();
        let now_ms = now_epoch_ms();
        let mut guard = ctx.shared.lock().unwrap();
        // A user-initiated stop already moved us to Terminated; keep it.
        if matches!(
            guard.info.state,
            SessionState::Creating | SessionState::Running
        ) {
            match exit {
                Some(status) => {
                    let code = status.exit_code() as i32;
                    guard.info.state = SessionState::Exited;
                    guard.info.exit_code = Some(code);
                }
                None => {
                    guard.info.state = SessionState::Exited;
                    guard.info.exit_code = None;
                }
            }
            guard.info.ended_at = Some(now_ms);
        } else if guard.info.ended_at.is_none() {
            guard.info.ended_at = Some(now_ms);
        }
        let snapshot = guard.info.clone();
        drop(guard);
        let _ = ctx.sender.send(TermChunk::State(snapshot));
    });
}

/// Resolve the default shell: `$SHELL` or `/bin/bash`.
fn default_shell() -> String {
    std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
}

fn now_epoch_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// No-op killer for the spawn-failed branch where there is no live child.
#[derive(Debug)]
struct NoopKiller;

impl NoopKiller {
    fn boxed() -> Box<dyn portable_pty::ChildKiller + Send + Sync> {
        Box::new(NoopKiller)
    }
}

impl portable_pty::ChildKiller for NoopKiller {
    fn kill(&mut self) -> std::io::Result<()> {
        Ok(())
    }
    fn clone_killer(&self) -> Box<dyn portable_pty::ChildKiller + Send + Sync> {
        Box::new(NoopKiller)
    }
}

// --- Log retention -------------------------------------------------------

/// A candidate session log for eviction.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogCandidate {
    pub log_id: String,
    pub size_bytes: u64,
    pub created_at: i64,
    pub active: bool,
}

/// Select session logs to evict when total log size exceeds `cap_bytes`.
///
/// @spec SPEC-runtime-terminal-log-reconnect (capacity cap; evict oldest
/// non-active logs first; never block new operations — return empty + warn).
///
/// Pure function: given current logs and a cap, return the ordered list of
/// log ids to delete. Only non-active logs are candidates, oldest first, until
/// the projected total falls under the cap. If no non-active candidate exists,
/// returns empty (caller logs a warning and proceeds).
pub fn select_eviction_candidates(candidates: &[LogCandidate], cap_bytes: u64) -> Vec<String> {
    let total: u64 = candidates.iter().map(|c| c.size_bytes).sum();
    if total <= cap_bytes {
        return Vec::new();
    }

    let mut evictable: Vec<&LogCandidate> = candidates.iter().filter(|c| !c.active).collect();
    // Oldest first.
    evictable.sort_by_key(|c| c.created_at);

    let mut remaining = total;
    let mut victims = Vec::new();
    for candidate in evictable {
        if remaining <= cap_bytes {
            break;
        }
        remaining = remaining.saturating_sub(candidate.size_bytes);
        victims.push(candidate.log_id.clone());
    }
    victims
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eviction_under_cap_evicts_nothing() {
        let candidates = vec![
            LogCandidate {
                log_id: "log_a".into(),
                size_bytes: 100,
                created_at: 1,
                active: false,
            },
            LogCandidate {
                log_id: "log_b".into(),
                size_bytes: 100,
                created_at: 2,
                active: true,
            },
        ];
        assert!(select_eviction_candidates(&candidates, 1000).is_empty());
    }

    #[test]
    fn eviction_picks_oldest_nonactive_first() {
        let candidates = vec![
            LogCandidate {
                log_id: "log_new".into(),
                size_bytes: 300,
                created_at: 30,
                active: false,
            },
            LogCandidate {
                log_id: "log_old".into(),
                size_bytes: 600,
                created_at: 10,
                active: false,
            },
            LogCandidate {
                log_id: "log_active".into(),
                size_bytes: 600,
                created_at: 5,
                active: true,
            },
        ];
        // total = 1500, cap = 1000 -> evicting the oldest non-active (600) drops
        // the total to 900, under cap, so only one log is removed.
        let victims = select_eviction_candidates(&candidates, 1000);
        assert_eq!(victims, vec!["log_old".to_string()]);
    }

    #[test]
    fn eviction_skips_active_even_when_over_cap() {
        let candidates = vec![LogCandidate {
            log_id: "log_active".into(),
            size_bytes: 5000,
            created_at: 1,
            active: true,
        }];
        // Over cap but only active logs exist -> evict nothing (warn + proceed).
        assert!(select_eviction_candidates(&candidates, 1000).is_empty());
    }

    #[test]
    fn log_id_derivation_is_stable() {
        assert_eq!(TerminalRegistry::log_id_for("ses_abc123"), "log_abc123");
        assert_eq!(TerminalRegistry::log_id_for("nopfx"), "log_nopfx");
    }
}
