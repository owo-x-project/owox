use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use owox_core::http::{ApiError, ApiErrorResponse, FieldError};
use owox_core::workspace::WorkspaceError;

/// HTTP-layer error wrapper. Carries a contract [`ApiErrorResponse`] plus the
/// status code to emit. Domain route modules build these through the helper
/// constructors so the error envelope shape stays consistent across the API.
#[derive(Debug)]
pub struct AppError(pub ApiErrorResponse, pub StatusCode);

impl AppError {
    pub fn new(response: ApiErrorResponse, status: StatusCode) -> Self {
        Self(response, status)
    }

    pub fn not_implemented(target: impl Into<String>) -> Self {
        Self(
            ApiErrorResponse::new(ApiError::not_implemented(target)),
            StatusCode::NOT_IMPLEMENTED,
        )
    }

    pub fn validation(message: impl Into<String>, target: impl Into<String>) -> Self {
        Self(
            ApiErrorResponse::new(ApiError::validation(message, target)),
            StatusCode::BAD_REQUEST,
        )
    }

    pub fn boundary(message: impl Into<String>, target: impl Into<String>) -> Self {
        Self(
            ApiErrorResponse::new(ApiError::boundary(message, target)),
            StatusCode::BAD_REQUEST,
        )
    }

    pub fn not_found(message: impl Into<String>, target: impl Into<String>) -> Self {
        let mut error = ApiError::validation(message, target);
        error.kind = owox_core::http::ErrorKind::NotFound;
        error.next_action = Some("Refresh and retry".to_string());
        Self(ApiErrorResponse::new(error), StatusCode::NOT_FOUND)
    }

    pub fn internal(message: impl Into<String>, target: impl Into<String>) -> Self {
        Self(
            ApiErrorResponse::new(ApiError::validation(message, target)),
            StatusCode::INTERNAL_SERVER_ERROR,
        )
    }

    /// Attach field-level validation errors to the response body.
    pub fn with_field_errors(mut self, field_errors: Vec<FieldError>) -> Self {
        self.0.field_errors = field_errors;
        self
    }
}

impl From<WorkspaceError> for AppError {
    fn from(error: WorkspaceError) -> Self {
        match error {
            WorkspaceError::BoundaryViolation => {
                Self::boundary("Path is outside the selected project", "path")
            }
            WorkspaceError::ProjectUnavailable => {
                Self::not_found("Project is unavailable", "project_id")
            }
            WorkspaceError::InvalidRoot => {
                Self::internal("Workspace root is unavailable", "workspace")
            }
            WorkspaceError::Io(_) => Self::internal("Workspace is unavailable", "workspace"),
        }
    }
}

impl From<sqlx::Error> for AppError {
    fn from(_: sqlx::Error) -> Self {
        Self::internal("Metadata store operation failed", "database")
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.1, Json(self.0)).into_response()
    }
}
