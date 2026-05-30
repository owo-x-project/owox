import { Show } from "solid-js";
import type { ApiError } from "../../api/contracts";
import "./feedback.css";
import { type ErrorView, isRecoverable } from "./error-view";

export type ErrorBannerVariant = "inline" | "toast" | "modal";

export interface ErrorBannerProps {
  error: ErrorView;
  onRetry?: () => void;
  variant?: ErrorBannerVariant;
}

/**
 * The single inline error component (supersedes `shell/ErrorDisplay`). Renders
 * the {@link ErrorView} contract from `SPEC-shared-error-display`: kind, target,
 * message, next action (only when recoverable), and a log-ref line ("log ref: …"
 * or "log unavailable"). A per-kind accent + short hint distinguishes auth /
 * conflict / network / not_found / permission / timeout / boundary / validation
 * / unknown failures. Raw stderr / stack traces are never rendered here.
 */
export function ErrorBanner(props: ErrorBannerProps) {
  const variant = () => props.variant ?? "inline";
  const hint = () => kindHint(props.error.kind);
  return (
    <div
      class="error-banner"
      classList={{
        [`error-banner--${variant()}`]: true,
        [`error-banner--${props.error.kind}`]: true,
      }}
      role="alert"
    >
      <div class="error-banner__head">
        <span class="error-banner__kind">{props.error.kind}</span>
        <Show when={props.error.target}>
          {(target) => <span class="error-banner__target">{target()}</span>}
        </Show>
      </div>

      <p class="error-banner__message">{props.error.message}</p>

      <Show when={hint()}>
        {(text) => <p class="error-banner__hint">{text()}</p>}
      </Show>

      <Show when={isRecoverable(props.error) && props.error.nextAction}>
        {(nextAction) => <p class="error-banner__action">{nextAction()}</p>}
      </Show>

      <Show
        when={props.error.fieldErrors && props.error.fieldErrors.length > 0}
      >
        <ul class="error-banner__fields">
          {props.error.fieldErrors?.map((fe) => (
            <li class="error-banner__field">
              <code>{fe.field}</code>: {fe.message}
            </li>
          ))}
        </ul>
      </Show>

      <Show
        when={props.error.logRef}
        fallback={
          <span class="error-banner__log error-banner__log--missing">
            log unavailable
          </span>
        }
      >
        {(logRef) => <span class="error-banner__log">log ref: {logRef()}</span>}
      </Show>

      <Show when={props.onRetry}>
        {(retry) => (
          <button
            type="button"
            class="button button--ghost error-banner__retry"
            onClick={() => retry()()}
          >
            Retry
          </button>
        )}
      </Show>
    </div>
  );
}

/**
 * Short per-kind remediation hint. Kept terse; the authoritative `next_action`
 * (when present) is shown separately above this.
 */
function kindHint(kind: ApiError["kind"]): string | null {
  switch (kind) {
    case "auth":
      return "Authentication failed — check your credentials.";
    case "conflict":
      return "Conflict — resolve the conflicting changes and retry.";
    case "network":
      return "Network failure — check connectivity and retry.";
    case "not_found":
      return "Not found — the target no longer exists.";
    case "permission":
      return "Permission denied — you may not have access to this target.";
    case "timeout":
      return "Timed out — the operation took too long; try again.";
    case "boundary":
      return "Out of bounds — the target is outside the workspace boundary.";
    case "validation":
      return "Invalid input — correct the highlighted fields and retry.";
    default:
      return null;
  }
}
