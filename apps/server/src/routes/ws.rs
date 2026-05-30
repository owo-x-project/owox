//! WebSocket terminal bridge for the unified event stream.
//!
//! @spec SPEC-shared-websocket-events (binary MessagePack envelope tuple)
//! @spec SPEC-runtime-terminal-session (term.state on every transition)
//! @spec SPEC-runtime-terminal-log-reconnect (disconnect never kills the session)
//!
//! ## Protocol
//! - Endpoint: `GET /api/events?project_id=prj_...&session_id=ses_...`
//! - Every frame is a binary MessagePack [`WsEnvelope`] (tuple `[v,t,id,p,s,ts,q,pl]`).
//! - On connect the session is validated against the registry; the server sends
//!   a `sub.ack` (status `connected`) or, for an unknown session, a `sub.ack`
//!   (status `rejected`) + an `err.show`, then closes.
//! - Server → client: `term.output { seq, data, redacted }` and
//!   `term.state { state, exit_code, started_at, ended_at, reason }`.
//! - Client → server: `term.input { data, mode, encoding }` writes PTY bytes;
//!   `term.resize { cols, rows }` resizes the PTY.
//! - A WebSocket disconnect drops only the socket; the PTY session keeps running.

use crate::state::AppState;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Query, State};
use axum::response::IntoResponse;
use futures::{SinkExt, StreamExt};
use owox_core::terminal::{SessionInfo, TermChunk, TerminalRegistry};
use owox_core::ws::{EventType, WsEnvelope};
use serde::Deserialize;
use serde_json::json;
use tokio::sync::broadcast::error::RecvError;

#[derive(Debug, Deserialize)]
pub struct SubscribeParams {
    project_id: Option<String>,
    session_id: Option<String>,
}

/// WebSocket upgrade entrypoint for the unified event stream.
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<SubscribeParams>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state, params))
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn envelope(
    event_type: EventType,
    project_id: Option<String>,
    session_id: Option<String>,
    seq: Option<u64>,
    payload: serde_json::Value,
) -> WsEnvelope {
    let mut env = WsEnvelope::new(event_type, payload);
    env.project_id = project_id;
    env.session_id = session_id;
    env.server_epoch_ms = now_ms();
    env.stream_sequence = seq;
    env
}

async fn send_envelope(socket: &mut WebSocket, env: &WsEnvelope) -> bool {
    match env.to_msgpack() {
        Ok(bytes) => socket.send(Message::Binary(bytes.into())).await.is_ok(),
        Err(_) => false,
    }
}

fn state_payload(info: &SessionInfo) -> serde_json::Value {
    json!({
        "state": info.state,
        "exit_code": info.exit_code,
        "started_at": info.started_at,
        "ended_at": info.ended_at,
        "reason": info.reason,
    })
}

async fn handle_socket(mut socket: WebSocket, state: AppState, params: SubscribeParams) {
    let session_id = params.session_id.clone().unwrap_or_default();
    let project_id = params.project_id.clone();
    let subscription_id = format!("sub_{}_{}", session_id, now_ms());

    // Validate the session exists in the registry.
    let Some(info) = state.terminal.snapshot(&session_id) else {
        let ack = envelope(
            EventType::SubscriptionAck,
            project_id.clone(),
            params.session_id.clone(),
            None,
            json!({
                "subscription_id": subscription_id,
                "scope": "terminal",
                "session_id": session_id,
                "status": "rejected",
            }),
        );
        send_envelope(&mut socket, &ack).await;
        let err = envelope(
            EventType::ErrorShow,
            project_id,
            params.session_id.clone(),
            None,
            json!({
                "kind": "not_found",
                "message": "Terminal session is unavailable",
                "target": "session_id",
                "recoverability": "user_action",
                "next_action": "Refresh the session list",
                "log_ref": null,
            }),
        );
        send_envelope(&mut socket, &err).await;
        let _ = socket.send(Message::Close(None)).await;
        return;
    };

    // sub.ack (connected).
    let ack = envelope(
        EventType::SubscriptionAck,
        project_id.clone(),
        Some(session_id.clone()),
        None,
        json!({
            "subscription_id": subscription_id,
            "scope": "terminal",
            "session_id": session_id,
            "status": "connected",
        }),
    );
    if !send_envelope(&mut socket, &ack).await {
        return;
    }

    // Emit the current state immediately so a reconnecting client syncs up.
    let initial_state = envelope(
        EventType::TermState,
        project_id.clone(),
        Some(session_id.clone()),
        None,
        state_payload(&info),
    );
    if !send_envelope(&mut socket, &initial_state).await {
        return;
    }

    let mut receiver = match state.terminal.subscribe(&session_id) {
        Ok(rx) => rx,
        Err(_) => {
            let _ = socket.send(Message::Close(None)).await;
            return;
        }
    };

    let (mut sink, mut stream) = socket.split();

    loop {
        tokio::select! {
            // (a) Broadcast chunks -> term.output / term.state.
            chunk = receiver.recv() => {
                match chunk {
                    Ok(TermChunk::Output { seq, data }) => {
                        let env = envelope(
                            EventType::TermOutput,
                            project_id.clone(),
                            Some(session_id.clone()),
                            Some(seq),
                            json!({ "seq": seq, "data": data, "redacted": true }),
                        );
                        if !send_split(&mut sink, &env).await {
                            break;
                        }
                    }
                    Ok(TermChunk::State(info)) => {
                        let env = envelope(
                            EventType::TermState,
                            project_id.clone(),
                            Some(session_id.clone()),
                            None,
                            state_payload(&info),
                        );
                        if !send_split(&mut sink, &env).await {
                            break;
                        }
                    }
                    Err(RecvError::Lagged(skipped)) => {
                        // Slow consumer: frames were dropped. Don't crash — the
                        // client can backfill via the HTTP log range.
                        tracing::warn!(session_id = %session_id, skipped, "terminal ws receiver lagged");
                        continue;
                    }
                    Err(RecvError::Closed) => break,
                }
            }
            // (b) Client frames -> term.input / term.resize.
            incoming = stream.next() => {
                match incoming {
                    Some(Ok(Message::Binary(bytes))) => {
                        if let Some(true) = handle_client_frame(&state, &session_id, &bytes) {
                            break;
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    Some(Ok(_)) => {} // ignore text/ping/pong
                    Some(Err(_)) => break,
                }
            }
        }
    }
    // Socket dropped here — the PTY session keeps running server-side.
}

async fn send_split(
    sink: &mut futures::stream::SplitSink<WebSocket, Message>,
    env: &WsEnvelope,
) -> bool {
    match env.to_msgpack() {
        Ok(bytes) => sink.send(Message::Binary(bytes.into())).await.is_ok(),
        Err(_) => false,
    }
}

#[derive(Debug, Deserialize)]
struct TermInputPayload {
    data: String,
    #[serde(default)]
    #[allow(dead_code)]
    mode: Option<String>,
    #[serde(default)]
    #[allow(dead_code)]
    encoding: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TermResizePayload {
    cols: u16,
    rows: u16,
}

/// Decode and apply a single client frame. Returns `Some(true)` to request the
/// loop stop, `Some(false)`/`None` to continue.
fn handle_client_frame(
    state: &AppState,
    session_id: &str,
    bytes: &[u8],
) -> Option<bool> {
    let env = WsEnvelope::from_msgpack(bytes).ok()?;
    let registry: &TerminalRegistry = &state.terminal;
    match env.event_type {
        EventType::TermInput => {
            let payload: TermInputPayload = env.payload_as().ok()?;
            let _ = registry.write_input(session_id, payload.data.as_bytes());
        }
        EventType::TermResize => {
            let payload: TermResizePayload = env.payload_as().ok()?;
            let _ = registry.resize(session_id, payload.cols, payload.rows);
        }
        EventType::TermClose => return Some(true),
        _ => {}
    }
    Some(false)
}
