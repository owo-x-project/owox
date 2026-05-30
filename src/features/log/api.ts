import { apiRequest } from "../../api/http";

/**
 * One contiguous decoded slice of a log file. `data` is the already-decoded
 * (and server-side redacted) text for the byte range starting at `offset`.
 */
export interface LogChunk {
  offset: number;
  data: string;
}

/**
 * Response shape of `GET /api/logs/:log_id?offset&limit`.
 *
 * - `total` is the full byte length of the log on the server.
 * - `truncated` is true when more bytes remain after the returned range.
 * - `data` is decoded text; the viewer renders it verbatim and never attempts
 *   to reconstruct un-redacted content (see ops-log-retention-redaction).
 */
export interface LogRangeResponse {
  log_id: string;
  offset: number;
  limit: number;
  total: number;
  chunks: LogChunk[];
  truncated: boolean;
}

/** Default range read window, matching the server default. */
export const DEFAULT_LOG_LIMIT = 65536;

/**
 * Typed log API surface built on the shared {@link apiRequest} helper. Each
 * feature owns its own client module rather than colliding on one class.
 */
export class LogApi {
  constructor(private readonly baseUrl = "") {}

  /** Read a byte range of a log. Throws `ApiClientError` on non-2xx. */
  getLogRange(
    logId: string,
    offset = 0,
    limit = DEFAULT_LOG_LIMIT,
  ): Promise<LogRangeResponse> {
    const query = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    return apiRequest<LogRangeResponse>(
      `/api/logs/${encodeURIComponent(logId)}?${query.toString()}`,
      undefined,
      this.baseUrl,
    );
  }

  /** Manually delete a log (destructive). Resolves on 204. */
  deleteLog(logId: string): Promise<void> {
    return apiRequest<void>(
      `/api/logs/${encodeURIComponent(logId)}`,
      { method: "DELETE" },
      this.baseUrl,
    );
  }
}
