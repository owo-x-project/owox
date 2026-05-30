import {
  type ErrorView,
  isRecoverable as isRecoverableView,
  toErrorView,
} from "../feedback/error-view";

/**
 * Thin re-export over the canonical {@link ErrorView} mapper in
 * `features/feedback/error-view`. The mapper logic lives once there; this module
 * exists only to keep the project-list call sites and tests stable.
 */
export type ProjectListError = ErrorView;

/** Map a thrown value into the shared error-display contract. */
export function toProjectListError(error: unknown): ProjectListError {
  return toErrorView(error, "Failed to load project list");
}

/** A recoverable error offers a next action the user can take. */
export const isRecoverable = isRecoverableView;
