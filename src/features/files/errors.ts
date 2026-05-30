import {
  type ErrorView,
  isErrorKind,
  isRecoverable as isRecoverableView,
  toErrorView,
} from "../feedback/error-view";

/**
 * Thin re-export over the canonical {@link ErrorView} mapper in
 * `features/feedback/error-view`. The mapper logic lives once there; this module
 * keeps the files / editor call sites stable and adds the file-specific
 * conflict helper.
 */
export type FileError = ErrorView;

/** Map a thrown value into the shared error-display contract. */
export function toFileError(error: unknown): FileError {
  return toErrorView(error);
}

/** A recoverable error offers a next action the user can take. */
export const isRecoverable = isRecoverableView;

/** True when the thrown value is an optimistic-concurrency conflict (HTTP 409). */
export function isConflict(error: unknown): boolean {
  return isErrorKind(error, "conflict");
}
