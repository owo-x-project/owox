use crate::error::AppError;
use crate::routes::AppRouter;
use crate::state::AppState;
use axum::Json;
use axum::extract::State;
use axum::routing::get;
use owox_core::plugin::{self, CommandContribution};
use serde::Serialize;
use std::path::PathBuf;

/// Plugin manifest / command-contribution READ endpoints.
///
/// @spec SPEC-plugin-extension-point
/// @spec SPEC-shared-http-api (Plugin)
///
/// v0 exposes only reads: `GET /api/plugins` and `GET /api/plugins/commands`.
/// There is NO POST / execute endpoint — plugin command contributions are
/// display / reserved only and never run. The plugins directory resolves from
/// `OWOX_PLUGINS_DIR`, else `<data_dir>/plugins`; an absent directory yields
/// empty lists (not an error), so a bad/missing manifest never 500s a read.
pub fn routes() -> AppRouter {
    AppRouter::new()
        .route("/api/plugins", get(list_plugins))
        .route("/api/plugins/commands", get(list_commands))
}

fn plugins_dir(state: &AppState) -> PathBuf {
    std::env::var("OWOX_PLUGINS_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| state.data_dir.join("plugins"))
}

#[derive(Debug, Serialize)]
struct PluginsResponse {
    plugins: Vec<PluginSummary>,
    warnings: Vec<String>,
}

#[derive(Debug, Serialize)]
struct PluginSummary {
    id: String,
    name: String,
    version: String,
    capabilities: Vec<String>,
}

#[derive(Debug, Serialize)]
struct CommandsResponse {
    commands: Vec<CommandContribution>,
    warnings: Vec<String>,
}

/// `GET /api/plugins` → `{ plugins: [{ id, name, version, capabilities }], warnings }`.
async fn list_plugins(State(state): State<AppState>) -> Result<Json<PluginsResponse>, AppError> {
    let load = plugin::load_plugins(&plugins_dir(&state));
    let plugins = load
        .plugins
        .into_iter()
        .map(|manifest| PluginSummary {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            capabilities: manifest.capabilities,
        })
        .collect();
    Ok(Json(PluginsResponse {
        plugins,
        warnings: load.warnings,
    }))
}

/// `GET /api/plugins/commands` → `{ commands: [...], warnings }`. Only enabled
/// (capability-satisfied) contributions are returned. Display / reserved only.
async fn list_commands(State(state): State<AppState>) -> Result<Json<CommandsResponse>, AppError> {
    let load = plugin::load_plugins(&plugins_dir(&state));
    Ok(Json(CommandsResponse {
        commands: load.command_contributions,
        warnings: load.warnings,
    }))
}
