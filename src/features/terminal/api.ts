import { apiRequest } from "../../api/http";

/** The 5-state terminal session lifecycle (`SPEC-runtime-terminal-session`). */
export type SessionState =
  | "creating"
  | "running"
  | "exited"
  | "failed"
  | "terminated";

/** A session as returned by the list endpoint. */
export interface SessionSummary {
  id: string;
  label: string;
  state: SessionState;
  cwd: string;
  created_at: number;
}

/** Response of `GET /sessions`. */
export interface SessionListResponse {
  sessions: SessionSummary[];
}

/** The session object returned by `POST /sessions`. */
export interface CreatedSession {
  id: string;
  state: SessionState;
  label: string;
}

/** Response of `POST /sessions`. */
export interface CreateSessionResponse {
  session: CreatedSession;
}

/** Request body for `POST /sessions`. `command:""` runs the default shell. */
export interface CreateSessionRequest {
  cwd: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  cols: number;
  rows: number;
  label: string;
}

/** The session detail object returned by `GET /sessions/:id`. */
export interface SessionDetail {
  id: string;
  state: SessionState;
  exit_code: number | null;
  started_at: number | null;
  ended_at: number | null;
}

/** Response of `GET /sessions/:id`. */
export interface SessionDetailResponse {
  session: SessionDetail;
}

/** One contiguous decoded slice of the session log. */
export interface SessionLogChunk {
  offset: number;
  data: string;
}

/** Response of `GET /sessions/:id/log?offset&limit`. */
export interface SessionLogResponse {
  log_id: string;
  offset: number;
  limit: number;
  total: number;
  chunks: SessionLogChunk[];
  truncated: boolean;
}

/** Default log range window, matching the server default. */
export const DEFAULT_SESSION_LOG_LIMIT = 65536;

/**
 * Typed client for the terminal session endpoints, built on the shared
 * {@link apiRequest} helper. All paths are repo-relative; the server enforces
 * the workspace boundary and returns typed error envelopes for violations
 * (a boundary-invalid `cwd` yields an error envelope and no session). A
 * command-not-found is NOT an error here — the session is created with
 * `state:"failed"`. Terminal input / resize never go through HTTP; they ride
 * the WebSocket transport (`TerminalSocket`).
 */
export class TerminalApi {
  constructor(
    private readonly projectId: string,
    private readonly baseUrl = "",
  ) {}

  private base(): string {
    return `/api/projects/${encodeURIComponent(this.projectId)}/sessions`;
  }

  /** List the project's sessions (used on reconnect). */
  list(): Promise<SessionListResponse> {
    return apiRequest<SessionListResponse>(
      this.base(),
      undefined,
      this.baseUrl,
    );
  }

  /** Create a session. Throws `ApiClientError` on boundary / validation. */
  create(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    return apiRequest<CreateSessionResponse>(
      this.base(),
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      this.baseUrl,
    );
  }

  /** Read session detail (state, exit code, timestamps). */
  get(sessionId: string): Promise<SessionDetailResponse> {
    return apiRequest<SessionDetailResponse>(
      `${this.base()}/${encodeURIComponent(sessionId)}`,
      undefined,
      this.baseUrl,
    );
  }

  /** Terminate a session. Resolves on 204. */
  remove(sessionId: string): Promise<void> {
    return apiRequest<void>(
      `${this.base()}/${encodeURIComponent(sessionId)}`,
      { method: "DELETE" },
      this.baseUrl,
    );
  }

  /** Read a byte range of the session log (reconnect tail replay). */
  logRange(
    sessionId: string,
    offset = 0,
    limit = DEFAULT_SESSION_LOG_LIMIT,
  ): Promise<SessionLogResponse> {
    const query = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    return apiRequest<SessionLogResponse>(
      `${this.base()}/${encodeURIComponent(sessionId)}/log?${query.toString()}`,
      undefined,
      this.baseUrl,
    );
  }
}
