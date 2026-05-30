import type { LogRangeResponse } from "./api";

/**
 * Pure, DOM-free accumulator for incremental log range reads.
 *
 * The server serves a log as a sequence of byte ranges. Each
 * `GET /api/logs/:id?offset&limit` returns the decoded text for the range
 * starting at `offset`, the full byte `total`, and `truncated` (true when more
 * bytes remain after the returned range). This model folds successive
 * responses into a single text buffer and tracks how many bytes have been
 * loaded so the caller can compute the next offset and render progress.
 *
 * Byte accounting: `data` is decoded text whose character length may differ
 * from its byte length, so loaded bytes are derived from the reported range
 * (`offset` + covered byte span), never from `data.length`. The covered span
 * is the number of bytes the server actually served for the request, which is
 * `min(limit, total - offset)` when not truncated, and `limit` when truncated.
 */
export interface LogModel {
  /** Concatenated decoded text of every range folded in so far. */
  readonly text: string;
  /** Highest end-of-range byte offset folded in so far (the next read offset). */
  readonly loadedBytes: number;
  /** Full byte length of the log per the latest response. */
  readonly totalBytes: number;
  /** True when the latest response reported more bytes after the loaded range. */
  readonly truncated: boolean;
}

/** An empty buffer with nothing loaded yet. */
export function emptyLogModel(): LogModel {
  return { text: "", loadedBytes: 0, totalBytes: 0, truncated: false };
}

/**
 * Fold a range response into an existing model.
 *
 * Idempotent re-append: if the response's `offset` is at or before the bytes
 * already loaded (e.g. the same range fetched twice, or an overlapping retry),
 * its text is ignored to avoid duplicating already-buffered content. Only a
 * response that begins exactly at the current `loadedBytes` extends the buffer.
 */
export function appendRange(
  model: LogModel,
  response: LogRangeResponse,
): LogModel {
  const span = rangeCoveredBytes(response);
  const end = response.offset + span;

  // Already-loaded or overlapping range: keep totals/truncated fresh but do
  // not duplicate text. A range that does not start exactly at the current
  // load frontier is treated as a no-op for the text buffer.
  if (response.offset !== model.loadedBytes) {
    return {
      text: model.text,
      loadedBytes: Math.max(model.loadedBytes, end),
      totalBytes: response.total,
      truncated: end < response.total ? response.truncated : false,
    };
  }

  const text = model.text + joinChunks(response);
  return {
    text,
    loadedBytes: end,
    totalBytes: response.total,
    truncated: response.truncated,
  };
}

/** Concatenate every chunk's decoded text in offset order. */
function joinChunks(response: LogRangeResponse): string {
  return [...response.chunks]
    .sort((a, b) => a.offset - b.offset)
    .map((chunk) => chunk.data)
    .join("");
}

/**
 * Bytes covered by a range response, clamped to the log total. When the
 * response is truncated the server served a full `limit` window; otherwise it
 * served the remainder of the log from `offset`.
 */
function rangeCoveredBytes(response: LogRangeResponse): number {
  if (response.truncated) {
    return response.limit;
  }
  return Math.max(0, response.total - response.offset);
}

/** The byte offset the next range read should start at. */
export function nextOffset(model: LogModel): number {
  return model.loadedBytes;
}

/** Bytes still unread after the current load frontier. */
export function remainingBytes(model: LogModel): number {
  return Math.max(0, model.totalBytes - model.loadedBytes);
}

/** True when the whole log has been loaded (nothing more to fetch). */
export function isComplete(model: LogModel): boolean {
  return !model.truncated && model.loadedBytes >= model.totalBytes;
}
