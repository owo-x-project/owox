use crate::workspace::{WorkspaceBoundary, WorkspaceError};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::Command;
use thiserror::Error;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommandStatus {
    Queued,
    Running,
    Succeeded,
    ExitedNonzero,
    FailedToStart,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommandErrorKind {
    Boundary,
    NotFound,
    Permission,
    Timeout,
    Auth,
    Conflict,
    Network,
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CommandResult {
    pub command_id: String,
    pub status: CommandStatus,
    pub exit_code: Option<i32>,
    pub stdout_ref: Option<String>,
    pub stderr_ref: Option<String>,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub error_kind: Option<CommandErrorKind>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CommandRequest {
    pub project_id: String,
    pub cwd: String,
    pub program: String,
    pub args: Vec<String>,
    #[serde(default)]
    pub env: BTreeMap<String, String>,
    pub operation_kind: OperationKind,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OperationKind {
    Terminal,
    Git,
    File,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Confirmation {
    pub token: String,
    pub phrase: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ConfirmationRequirement {
    pub operation: String,
    pub phrase: Option<String>,
    pub targets: Vec<String>,
}

#[derive(Debug, Error)]
pub enum CommandExecutionError {
    #[error("workspace boundary rejected cwd")]
    Boundary,
    #[error("destructive operation requires confirmation")]
    ConfirmationRequired(ConfirmationRequirement),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CapturedCommandResult {
    pub result: CommandResult,
    pub stdout: String,
    pub stderr: String,
}

impl From<WorkspaceError> for CommandExecutionError {
    fn from(_: WorkspaceError) -> Self {
        Self::Boundary
    }
}

pub fn new_command_id() -> String {
    format!("cmd_{}", uuid::Uuid::new_v4().simple())
}

pub fn evaluate_destructive_operation(request: &CommandRequest) -> Option<ConfirmationRequirement> {
    let program = request.program.as_str();
    let args = request.args.iter().map(String::as_str).collect::<Vec<_>>();

    if program == "rm" && args.iter().any(|arg| arg.contains('r')) {
        return Some(requirement("file_delete", None, &request.args));
    }

    if program == "git" {
        match args.as_slice() {
            ["reset", "--hard", ..] => {
                return Some(requirement("git_reset_hard", None, &request.args));
            }
            ["clean", flags, ..] if flags.contains('f') => {
                return Some(requirement("git_clean", None, &request.args));
            }
            ["checkout", ..] if args.contains(&"--") => {
                return Some(requirement("git_checkout_paths", None, &request.args));
            }
            _ => {}
        }
    }

    None
}

pub fn validate_confirmation(
    request: &CommandRequest,
    confirmation: Option<&Confirmation>,
) -> Result<(), CommandExecutionError> {
    let Some(requirement) = evaluate_destructive_operation(request) else {
        return Ok(());
    };

    let Some(confirmation) = confirmation else {
        return Err(CommandExecutionError::ConfirmationRequired(requirement));
    };

    let expected = confirmation_token_for(request);
    if confirmation.token != expected {
        return Err(CommandExecutionError::ConfirmationRequired(requirement));
    }

    if let Some(phrase) = &requirement.phrase
        && confirmation.phrase.as_deref() != Some(phrase.as_str())
    {
        return Err(CommandExecutionError::ConfirmationRequired(requirement));
    }

    Ok(())
}

pub fn confirmation_token_for(request: &CommandRequest) -> String {
    format!(
        "confirm:{}:{}:{}",
        request.project_id,
        request.cwd,
        request.args.join(" ")
    )
}

pub fn execute_command(
    boundary: &WorkspaceBoundary,
    project_root: impl AsRef<Path>,
    request: &CommandRequest,
    confirmation: Option<&Confirmation>,
    now_ms: i64,
) -> Result<CapturedCommandResult, CommandExecutionError> {
    validate_confirmation(request, confirmation)?;
    let cwd = boundary.validate_command_cwd(project_root, &request.cwd)?;
    Ok(run_with_cwd(request, cwd, now_ms))
}

fn run_with_cwd(request: &CommandRequest, cwd: PathBuf, now_ms: i64) -> CapturedCommandResult {
    let command_id = new_command_id();
    let output = Command::new(&request.program)
        .args(&request.args)
        .envs(&request.env)
        .current_dir(cwd)
        .output();

    match output {
        Ok(output) => {
            let stdout = redact_secrets(&String::from_utf8_lossy(&output.stdout));
            let stderr = redact_secrets(&String::from_utf8_lossy(&output.stderr));
            let status = if output.status.success() {
                CommandStatus::Succeeded
            } else {
                CommandStatus::ExitedNonzero
            };
            let exit_code = output.status.code();
            CapturedCommandResult {
                result: CommandResult {
                    command_id: command_id.clone(),
                    status,
                    exit_code,
                    stdout_ref: (!stdout.is_empty()).then(|| format!("log://{command_id}/stdout")),
                    stderr_ref: (!stderr.is_empty()).then(|| format!("log://{command_id}/stderr")),
                    started_at: now_ms,
                    ended_at: Some(now_ms),
                    error_kind: None,
                },
                stdout,
                stderr,
            }
        }
        Err(error) => CapturedCommandResult {
            result: CommandResult {
                command_id,
                status: CommandStatus::FailedToStart,
                exit_code: None,
                stdout_ref: None,
                stderr_ref: None,
                started_at: now_ms,
                ended_at: Some(now_ms),
                error_kind: Some(classify_start_error(&error)),
            },
            stdout: String::new(),
            stderr: redact_secrets(&error.to_string()),
        },
    }
}

pub fn redact_secrets(input: &str) -> String {
    input
        .split_whitespace()
        .map(redact_token)
        .collect::<Vec<_>>()
        .join(" ")
}

fn redact_token(token: &str) -> String {
    let lower = token.to_ascii_lowercase();
    let sensitive_prefixes = [
        "authorization:",
        "bearer",
        "api_key=",
        "apikey=",
        "token=",
        "password=",
        "secret=",
    ];
    if sensitive_prefixes
        .iter()
        .any(|prefix| lower.starts_with(prefix))
    {
        return "[REDACTED]".to_string();
    }
    token.to_string()
}

fn classify_start_error(error: &std::io::Error) -> CommandErrorKind {
    match error.kind() {
        std::io::ErrorKind::NotFound => CommandErrorKind::NotFound,
        std::io::ErrorKind::PermissionDenied => CommandErrorKind::Permission,
        _ => CommandErrorKind::Unknown,
    }
}

fn requirement(
    operation: &str,
    phrase: Option<&str>,
    targets: &[String],
) -> ConfirmationRequirement {
    ConfirmationRequirement {
        operation: operation.to_string(),
        phrase: phrase.map(str::to_string),
        targets: targets.to_vec(),
    }
}
