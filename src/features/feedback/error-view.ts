import type { ApiError } from "../../api/contracts";
import { ApiClientError } from "../../api/http";

/**
 * Canonical, feature-agnostic view model for error display, aligned with
 * `SPEC-shared-error-display` ("error は kind、message、target、recoverability、
 * next_action、log_ref を持つ"). This is the single source of truth that
 * replaces the previous per-feature mappers (projects / files / git / log /
 * terminal / launcher).
 *
 * Raw stderr / stack traces are never surfaced here; only the redacted
 * {@link ErrorView.logRef} is exposed so detail can be reached from a log
 * reference without leaking un-redacted output.
 */
export interface ErrorView {
  kind: ApiError["kind"];
  message: string;
  target: string | null;
  recoverability: ApiError["recoverability"];
  /** Present only when the error is recoverable via a user action. */
  nextAction: string | null;
  logRef: string | null;
  /** Field-level validation errors carried by a typed envelope, when present. */
  fieldErrors?: { field: string; message: string }[];
}

/**
 * Map an unknown thrown value into the {@link ErrorView} contract. Reads an
 * {@link ApiClientError}'s typed envelope (including `field_errors`), and falls
 * back to an `unknown` kind for anything that is not a typed envelope so a raw
 * thrown value (and never a stack trace) is surfaced.
 *
 * The `instanceof ApiClientError` check can miss across module boundaries (the
 * envelope is also reachable via `../../api/client`'s re-export); to stay
 * robust we also accept any throwable carrying a well-formed `response.error`.
 */
export function toErrorView(
  error: unknown,
  fallbackMessage = "Unexpected error",
): ErrorView {
  const envelope = readEnvelope(error);
  if (envelope) {
    const api = envelope.error;
    const fieldErrors = (envelope.field_errors ?? []).map((f) => ({
      field: f.field,
      message: f.message,
    }));
    return {
      kind: api.kind,
      message: api.message,
      target: api.target,
      recoverability: api.recoverability,
      nextAction: api.next_action,
      logRef: api.log_ref,
      ...(fieldErrors.length > 0 ? { fieldErrors } : {}),
    };
  }

  return {
    kind: "unknown",
    message: error instanceof Error ? error.message : fallbackMessage,
    target: null,
    recoverability: "none",
    nextAction: null,
    logRef: null,
  };
}

/** A recoverable error offers a next action the user can take. */
export function isRecoverable(error: ErrorView): boolean {
  return error.recoverability !== "none";
}

/** True when the thrown value is a typed envelope of the given error kind. */
export function isErrorKind(error: unknown, kind: ApiError["kind"]): boolean {
  return readEnvelope(error)?.error.kind === kind;
}

interface ApiEnvelope {
  error: ApiError;
  field_errors?: { field: string; message: string }[];
}

/**
 * Extract the typed error envelope from a thrown value, accepting both real
 * {@link ApiClientError} instances and any structurally-compatible throwable
 * (so the mapper never depends on a single import path for `instanceof`).
 */
function readEnvelope(error: unknown): ApiEnvelope | null {
  if (error instanceof ApiClientError) {
    return error.response as ApiEnvelope;
  }
  const maybe = error as { response?: { error?: Partial<ApiError> } };
  const api = maybe?.response?.error;
  if (api && typeof api.kind === "string") {
    return maybe.response as ApiEnvelope;
  }
  return null;
}
