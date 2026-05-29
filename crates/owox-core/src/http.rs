use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorKind {
    Validation,
    Protocol,
    Boundary,
    NotFound,
    Permission,
    Timeout,
    Auth,
    Conflict,
    Network,
    NotImplemented,
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Recoverability {
    UserAction,
    Retry,
    Reconnect,
    ContactMaintainer,
    None,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ApiError {
    pub kind: ErrorKind,
    pub message: String,
    pub target: Option<String>,
    pub recoverability: Recoverability,
    pub next_action: Option<String>,
    pub log_ref: Option<String>,
    pub request_id: String,
}

impl ApiError {
    pub fn validation(message: impl Into<String>, target: impl Into<String>) -> Self {
        Self {
            kind: ErrorKind::Validation,
            message: message.into(),
            target: Some(target.into()),
            recoverability: Recoverability::UserAction,
            next_action: Some("Fix the highlighted fields and retry".to_string()),
            log_ref: None,
            request_id: new_request_id(),
        }
    }

    pub fn boundary(message: impl Into<String>, target: impl Into<String>) -> Self {
        Self {
            kind: ErrorKind::Boundary,
            message: message.into(),
            target: Some(target.into()),
            recoverability: Recoverability::UserAction,
            next_action: Some("Choose a path inside the selected project".to_string()),
            log_ref: None,
            request_id: new_request_id(),
        }
    }

    pub fn not_implemented(target: impl Into<String>) -> Self {
        Self {
            kind: ErrorKind::NotImplemented,
            message: "Endpoint is reserved for a later v0 phase".to_string(),
            target: Some(target.into()),
            recoverability: Recoverability::None,
            next_action: None,
            log_ref: None,
            request_id: new_request_id(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FieldError {
    pub field: String,
    pub code: String,
    pub message: String,
    pub expected: Option<String>,
    pub actual: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ApiErrorResponse {
    pub error: ApiError,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub field_errors: Vec<FieldError>,
}

impl ApiErrorResponse {
    pub fn new(error: ApiError) -> Self {
        Self {
            error,
            field_errors: Vec::new(),
        }
    }
}

fn new_request_id() -> String {
    format!("req_{}", uuid::Uuid::new_v4().simple())
}
