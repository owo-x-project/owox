use owox_core::ws::{EventType, WsEnvelope};
use serde_json::json;

#[test]
fn msgpack_roundtrip_preserves_tuple_fields() {
    let mut event = WsEnvelope::new(EventType::SubscriptionAck, json!({"status": "ok"}));
    event.project_id = Some("prj_1".to_string());
    event.stream_sequence = Some(7);

    let bytes = event.to_msgpack().unwrap();
    let decoded = WsEnvelope::from_msgpack(bytes).unwrap();

    assert_eq!(decoded.schema_version, 1);
    assert_eq!(decoded.event_type, EventType::SubscriptionAck);
    assert_eq!(decoded.project_id, Some("prj_1".to_string()));
    assert_eq!(decoded.stream_sequence, Some(7));
    assert_eq!(decoded.payload["status"], "ok");
}
