import {
  type ErrorView,
  isErrorKind,
  isRecoverable as isRecoverableView,
  toErrorView,
} from "../feedback/error-view";

/**
 * Thin re-export over the canonical {@link ErrorView} mapper in
 * `features/feedback/error-view`. The mapper logic lives once there; this module
 * keeps the log-viewer call sites stable and adds the log-specific not-found
 * helper.
 */
export type LogViewError = ErrorView;

/** Map a thrown value into the shared error-display contract. */
export function toLogViewError(error: unknown): LogViewError {
  return toErrorView(error, "Failed to load log");
}

/** True when the underlying error is a not-found (deleted / missing log). */
export function isNotFound(error: unknown): boolean {
  return isErrorKind(error, "not_found");
}

/** A recoverable error offers a next action the user can take. */
export const isRecoverable = isRecoverableView;
