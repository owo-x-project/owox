use owox_server::{AppState, ServerConfig, router};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let config = ServerConfig::from_env()?;
    let state = AppState::initialize(config).await?;
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;

    tracing::info!("owox server listening on http://0.0.0.0:3000");
    axum::serve(listener, router(state)).await?;
    Ok(())
}
