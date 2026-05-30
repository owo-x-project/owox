//! WebSocket terminal bridge integration test.
//!
//! @spec SPEC-shared-websocket-events (binary MessagePack envelope)
//! @spec SPEC-runtime-terminal-session

use futures::StreamExt;
use owox_core::db::MetadataStore;
use owox_core::log_store::LogStore;
use owox_core::terminal::{CreateSession, TerminalRegistry};
use owox_core::workspace::WorkspaceBoundary;
use owox_core::ws::{EventType, WsEnvelope};
use owox_server::{AppState, router};
use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use tokio_tungstenite::tungstenite::Message;

fn make_repo(root: &Path, name: &str) -> std::path::PathBuf {
    let repo = root.join(name);
    std::fs::create_dir_all(repo.join(".git")).unwrap();
    std::fs::write(repo.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
    repo
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64
}

#[tokio::test]
async fn ws_subscribe_acks_and_streams_output() {
    let temp = tempfile::tempdir().unwrap();
    let repo = make_repo(temp.path(), "repo");
    let data_dir = temp.path().join(".owox-data");
    std::fs::create_dir_all(&data_dir).unwrap();

    let terminal = TerminalRegistry::new(LogStore::new(data_dir.join("logs")));
    let boundary = Arc::new(WorkspaceBoundary::new(temp.path()).unwrap());
    let state = AppState {
        boundary: boundary.clone(),
        store: MetadataStore::connect("sqlite::memory:").await.unwrap(),
        data_dir: Arc::new(data_dir),
        terminal: terminal.clone(),
    };

    // Create a session that prints READY then lingers briefly.
    let info = terminal
        .create_session(
            &boundary,
            &repo,
            CreateSession {
                project_id: "prj_repo".to_string(),
                cwd: ".".to_string(),
                command: "sh".to_string(),
                args: vec![
                    "-c".to_string(),
                    // Delay before printing so the WS subscriber is attached
                    // before READY is broadcast (broadcast does not replay).
                    "sleep 1; printf READY; sleep 1".to_string(),
                ],
                env: BTreeMap::new(),
                cols: 80,
                rows: 24,
                label: None,
            },
            now_ms(),
        )
        .unwrap();
    let session_id = info.id.clone();

    // Start the router on an ephemeral port.
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let app = router(state);
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    let url = format!(
        "ws://{addr}/api/events?project_id=prj_repo&session_id={session_id}"
    );
    let (mut ws, _resp) = tokio_tungstenite::connect_async(&url)
        .await
        .expect("ws connect");

    let mut saw_ack = false;
    let mut saw_ready = false;

    let deadline = tokio::time::Instant::now() + Duration::from_secs(5);
    while tokio::time::Instant::now() < deadline {
        let frame = tokio::time::timeout(Duration::from_millis(500), ws.next()).await;
        let msg = match frame {
            Ok(Some(Ok(msg))) => msg,
            Ok(Some(Err(_))) | Ok(None) => break,
            Err(_) => continue,
        };
        let bytes = match msg {
            Message::Binary(b) => b,
            _ => continue,
        };
        let env = WsEnvelope::from_msgpack(&bytes).expect("decode envelope");
        match env.event_type {
            EventType::SubscriptionAck => {
                assert_eq!(env.payload["status"], "connected");
                assert_eq!(env.payload["scope"], "terminal");
                saw_ack = true;
            }
            EventType::TermOutput => {
                let data = env.payload["data"].as_str().unwrap_or("");
                if data.contains("READY") {
                    saw_ready = true;
                }
                assert_eq!(env.payload["redacted"], true);
            }
            EventType::TermState => {}
            _ => {}
        }
        if saw_ack && saw_ready {
            break;
        }
    }

    let _ = ws.close(None).await;
    assert!(saw_ack, "expected a sub.ack envelope");
    assert!(saw_ready, "expected a term.output envelope containing READY");
}
