use owox_core::http::{ApiError, ApiErrorResponse};

#[test]
fn error_envelope_matches_contract_shape() {
    let response = ApiErrorResponse::new(ApiError::validation("Invalid request", "request"));
    let value = serde_json::to_value(response).unwrap();

    assert_eq!(value["error"]["kind"], "validation");
    assert_eq!(value["error"]["recoverability"], "user_action");
    assert!(
        value["error"]["request_id"]
            .as_str()
            .unwrap()
            .starts_with("req_")
    );
}
