export type ErrorKind =
  | "validation"
  | "protocol"
  | "boundary"
  | "not_found"
  | "permission"
  | "timeout"
  | "auth"
  | "conflict"
  | "network"
  | "not_implemented"
  | "unknown";

export type Recoverability =
  | "user_action"
  | "retry"
  | "reconnect"
  | "contact_maintainer"
  | "none";

export interface ApiError {
  kind: ErrorKind;
  message: string;
  target: string | null;
  recoverability: Recoverability;
  next_action: string | null;
  log_ref: string | null;
  request_id: string;
}

export interface ApiErrorResponse {
  error: ApiError;
  field_errors?: Array<{
    field: string;
    code: string;
    message: string;
    expected?: string | null;
    actual?: string | null;
  }>;
}

export interface ProjectResource {
  id: string;
  name: string;
  repo_kind: "git";
  git_branch: string | null;
  status: "available" | "unavailable";
  last_opened_at: number | null;
  warnings: string[];
}

export interface ProjectsResponse {
  projects: ProjectResource[];
}

export type CommandStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "exited_nonzero"
  | "failed_to_start";
export type CommandErrorKind =
  | "boundary"
  | "not_found"
  | "permission"
  | "timeout"
  | "auth"
  | "conflict"
  | "network"
  | "unknown";

export interface CommandResult {
  command_id: string;
  status: CommandStatus;
  exit_code: number | null;
  stdout_ref: string | null;
  stderr_ref: string | null;
  started_at: number;
  ended_at: number | null;
  error_kind: CommandErrorKind | null;
}

export type WsEventType =
  | "term.create"
  | "term.input"
  | "term.resize"
  | "term.output"
  | "term.state"
  | "term.close"
  | "git.status"
  | "git.diff"
  | "git.op.start"
  | "git.op.done"
  | "file.tree"
  | "file.open"
  | "file.write"
  | "file.change"
  | "log.chunk"
  | "log.state"
  | "ui.surface"
  | "ui.sheet"
  | "cmd.result"
  | "err.show"
  | "sub.ack";

export type WsEnvelope = [
  schemaVersion: number,
  eventType: WsEventType,
  eventId: string,
  projectId: string | null,
  sessionId: string | null,
  serverEpochMs: number,
  streamSequence: number | null,
  payload: unknown,
];
