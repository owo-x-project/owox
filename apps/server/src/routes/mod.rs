use crate::error::AppError;
use crate::state::AppState;
use axum::Router;
use axum::routing::get;
use tower_http::services::{ServeDir, ServeFile};

pub mod files;
pub mod git;
pub mod logs;
pub mod plugins;
pub mod projects;
pub mod terminal;
pub mod ws;

/// Assemble the full HTTP + WebSocket route table.
///
/// Each domain owns its own module and contributes a `routes()` sub-router so
/// later phases extend a single file without colliding on this assembly point.
pub fn router(state: AppState) -> Router {
    let api = Router::new()
        .route("/health", get(health))
        .merge(projects::routes())
        .merge(files::routes())
        .merge(terminal::routes())
        .merge(git::routes())
        .merge(logs::routes())
        .merge(plugins::routes())
        .route("/api/events", get(ws::ws_handler))
        .with_state(state);

    // Serve the built frontend (single-container self-host). API routes are
    // matched first; anything unmatched falls back to the SPA. Only mounted
    // when the static dir exists so non-Docker dev/test keep the plain 404.
    let static_dir = std::env::var("OWOX_STATIC_DIR").unwrap_or_else(|_| "dist".to_string());
    if std::path::Path::new(&static_dir).is_dir() {
        let index = format!("{static_dir}/index.html");
        let spa = ServeDir::new(&static_dir).not_found_service(ServeFile::new(index));
        api.fallback_service(spa)
    } else {
        api
    }
}

#[derive(Debug, serde::Serialize)]
struct HealthResponse {
    status: &'static str,
}

async fn health() -> axum::Json<HealthResponse> {
    axum::Json(HealthResponse { status: "ok" })
}

/// Placeholder handler for endpoints reserved by a later v0 phase. Returns the
/// contract `not_implemented` error envelope with `501 Not Implemented`.
pub async fn not_implemented() -> AppError {
    AppError::not_implemented("route")
}

/// Convenience for building a state-typed sub-router inside a domain module.
pub type AppRouter = Router<AppState>;
