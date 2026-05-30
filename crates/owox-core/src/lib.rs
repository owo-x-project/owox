pub mod command;
pub mod db;
pub mod fs;
pub mod git;
pub mod http;
pub mod log_store;
pub mod plugin;
pub mod terminal;
pub mod workspace;
pub mod ws;

pub use command::{CommandErrorKind, CommandResult, CommandStatus};
pub use fs::{
    CreateResult, FileContent, FsError, RenameResult, TreeEntry, TreeListing, WriteResult,
};
pub use git::{
    BranchInfo, ConfirmationRequirement as GitConfirmationRequirement, DiffSummary, FileState,
    GitBranches, GitDiff, GitError, GitErrorKind, GitOp, GitStatus, OperationRequest,
    OperationResult, StatusCounts, StatusFile,
};
pub use http::{ApiError, ApiErrorResponse, ErrorKind, Recoverability};
pub use log_store::{LogChunk, LogRange, LogStore, LogStoreError};
pub use plugin::{
    BackendHook, CommandContribution, LoadError, PluginError, PluginLoad, PluginManifest,
    load_plugins, parse_manifest,
};
pub use terminal::{
    CreateSession, LogCandidate, SessionInfo, SessionState, TermChunk, TerminalError,
    TerminalRegistry, select_eviction_candidates,
};
pub use workspace::{ProjectIdentity, WorkspaceBoundary};
pub use ws::{EventType, WsEnvelope};
