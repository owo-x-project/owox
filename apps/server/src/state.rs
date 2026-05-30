use owox_core::db::MetadataStore;
use owox_core::log_store::LogStore;
use owox_core::terminal::TerminalRegistry;
use owox_core::workspace::WorkspaceBoundary;
use std::path::PathBuf;
use std::sync::Arc;

/// Process configuration resolved from the environment at startup.
#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub workspace_root: PathBuf,
    pub database_url: String,
    /// Managed runtime data directory (logs, etc.). Per ADR-0004 this stays
    /// outside any project repo so runtime state never pollutes source repos.
    pub data_dir: PathBuf,
}

impl ServerConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let workspace_root = std::env::var("OWOX_WORKSPACE_ROOT")
            .map(PathBuf::from)
            .unwrap_or(std::env::current_dir()?);
        let database_url = std::env::var("OWOX_DATABASE_URL")
            .unwrap_or_else(|_| "sqlite://owox.sqlite3?mode=rwc".to_string());
        let data_dir = std::env::var("OWOX_DATA_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(".owox-data"));
        Ok(Self {
            workspace_root,
            database_url,
            data_dir,
        })
    }
}

/// Shared, cloneable application state injected into every route handler.
///
/// New cross-cutting services (terminal session registry, log store, …) are
/// added here as later phases land so route modules can reach them without
/// global singletons.
#[derive(Clone)]
pub struct AppState {
    pub boundary: Arc<WorkspaceBoundary>,
    pub store: MetadataStore,
    /// Managed runtime data directory (logs, etc.). Outside project repos.
    pub data_dir: Arc<PathBuf>,
    /// Live terminal session registry (PTY processes + broadcast channels).
    pub terminal: TerminalRegistry,
}

impl AppState {
    pub async fn initialize(config: ServerConfig) -> anyhow::Result<Self> {
        let boundary = Arc::new(WorkspaceBoundary::new(config.workspace_root)?);
        let store = MetadataStore::connect(&config.database_url).await?;
        std::fs::create_dir_all(&config.data_dir).ok();
        let log_store = LogStore::new(config.data_dir.join("logs"));
        let terminal = TerminalRegistry::new(log_store);
        Ok(Self {
            boundary,
            store,
            data_dir: Arc::new(config.data_dir),
            terminal,
        })
    }
}
