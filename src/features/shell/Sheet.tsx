import type { JSX } from "solid-js";
import { Show } from "solid-js";

export type SheetDirection = "bottom" | "left" | "right" | "top";

export interface SheetProps {
  /** Whether the sheet is open. */
  open: boolean;
  /**
   * Fixed slide-in direction (role-bound per `ui-shell-drawer-panel`):
   * bottom=terminal, left=files, right=Git/review, top=command palette.
   */
  direction: SheetDirection;
  /** Close handler invoked by the backdrop and the Escape key. */
  onClose: () => void;
  /** Accessible label for the sheet dialog. */
  label: string;
  /** When true the sheet fills the viewport (mobile full-screen editor host). */
  fullscreen?: boolean;
  children: JSX.Element;
}

/**
 * Reusable directional sheet (`ui-shell-drawer-panel`). Renders a backdrop plus
 * a direction-fixed sliding panel. Closes on backdrop click and Escape so the
 * user is never trapped in an unoperable state. Sizing is mobile-safe: the
 * panel is capped to the viewport and its body scrolls, so the mounted surface
 * (terminal / files / diff) always fits its region.
 */
export function Sheet(props: SheetProps) {
  return (
    <Show when={props.open}>
      <div
        class="sheet__overlay"
        classList={{ [`sheet__overlay--${props.direction}`]: true }}
      >
        <button
          type="button"
          class="sheet__backdrop"
          aria-label={`Close ${props.label}`}
          onClick={() => props.onClose()}
        />
        <div
          class="sheet"
          classList={{
            [`sheet--${props.direction}`]: true,
            "sheet--fullscreen": props.fullscreen ?? false,
          }}
          role="dialog"
          aria-modal="true"
          aria-label={props.label}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              props.onClose();
            }
          }}
        >
          {props.children}
        </div>
      </div>
    </Show>
  );
}
