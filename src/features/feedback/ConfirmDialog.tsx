import { createSignal, For, Show } from "solid-js";
import "./feedback.css";

export interface ConfirmDialogProps {
  open: boolean;
  /** Operation type, e.g. "Delete file" / "Discard changes". */
  operation: string;
  /** Affected project, when the operation is scoped to one. */
  project?: string | null;
  /** Affected path / branch / target list. */
  targets: string[];
  /** Show the "cannot be undone" notice. Defaults to true. */
  irreversible?: boolean;
  /** Required typed phrase: when set, the user must type it to enable Confirm. */
  phrase?: string | null;
  /** Label for the confirm button (defaults to "Confirm"). */
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The single destructive-confirmation component
 * (`SPEC-shared-destructive-confirmation`). Shows the operation type, affected
 * project, target list, and an irreversibility notice. When `phrase` is set the
 * user must type it exactly before Confirm is enabled (type-to-confirm). Works
 * on desktop + mobile: the panel is width-capped to the viewport with no fixed
 * dimensions, and Esc / backdrop-click cancel.
 *
 * This component only owns the confirmation UI shell; the caller still derives
 * and sends any backend `confirm_token` after `onConfirm`, so the wire contract
 * is unchanged.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const [typed, setTyped] = createSignal("");
  const irreversible = () => props.irreversible !== false;
  const requiresPhrase = () => Boolean(props.phrase);
  const matches = () => !requiresPhrase() || typed() === props.phrase;

  function confirm() {
    if (!matches()) {
      return;
    }
    setTyped("");
    props.onConfirm();
  }

  function cancel() {
    setTyped("");
    props.onCancel();
  }

  return (
    <Show when={props.open}>
      <div class="confirm-dialog__overlay">
        <button
          type="button"
          class="confirm-dialog__backdrop"
          aria-label="Cancel"
          onClick={cancel}
        />
        <div
          class="confirm-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={props.operation}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              cancel();
            }
          }}
        >
          <h3 class="confirm-dialog__title">{props.operation}</h3>

          <p class="confirm-dialog__warn">
            <Show when={props.project}>
              {(project) => (
                <>
                  Project <code>{project()}</code>.{" "}
                </>
              )}
            </Show>
            <Show when={irreversible()}>This cannot be undone.</Show>
          </p>

          <Show when={props.targets.length > 0}>
            <ul class="confirm-dialog__targets">
              <For each={props.targets}>
                {(target) => (
                  <li>
                    <code>{target}</code>
                  </li>
                )}
              </For>
            </ul>
          </Show>

          <Show when={requiresPhrase()}>
            <p class="muted confirm-dialog__hint">
              Type <code>{props.phrase}</code> to confirm.
            </p>
            <input
              type="text"
              class="confirm-dialog__input"
              value={typed()}
              placeholder={props.phrase ?? ""}
              aria-label="Confirmation phrase"
              autofocus
              onInput={(event) => setTyped(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirm();
                }
              }}
            />
          </Show>

          <div class="confirm-dialog__buttons">
            <button type="button" class="button button--ghost" onClick={cancel}>
              Cancel
            </button>
            <button
              type="button"
              class="button confirm-dialog__confirm"
              disabled={!matches()}
              onClick={confirm}
            >
              {props.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
