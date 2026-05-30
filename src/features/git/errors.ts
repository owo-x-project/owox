import {
  type ErrorView,
  isRecoverable as isRecoverableView,
  toErrorView,
} from "../feedback/error-view";

/**
 * Thin re-export over the canonical {@link ErrorView} mapper in
 * `features/feedback/error-view`. The mapper logic lives once there; this module
 * keeps the Git call sites stable. Field-level errors carried by a destructive-op
 * envelope are exposed via {@link ErrorView.fieldErrors}.
 */
export type GitError = ErrorView;

/** Map a thrown value into the shared error-display contract. */
export function toGitError(error: unknown): GitError {
  return toErrorView(error);
}

/** A recoverable error offers a next action the user can take. */
export const isRecoverable = isRecoverableView;
