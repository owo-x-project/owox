import { For } from "solid-js";
import { getToasts, removeToast, type Toast } from "./toast-store";

const KIND_ICONS: Record<string, string> = {
  error: "✕",
  warning: "⚠",
  info: "ℹ",
  success: "✓",
};

export function ToastContainer() {
  return (
    <div class="toast-container">
      <For each={getToasts()()}>
        {(toast: Toast) => (
          <div class={`toast toast--${toast.kind}`}>
            <span class={`toast__icon toast__icon--${toast.kind}`}>
              {KIND_ICONS[toast.kind]}
            </span>
            <div class="toast__content">
              <span class="toast__message">{toast.message}</span>
              {toast.detail && <span class="toast__detail">{toast.detail}</span>}
            </div>
            <button
              type="button"
              class="toast__dismiss"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
            {toast.duration > 0 && (
              <div
                class="toast__progress"
                style={{ "animation-duration": `${toast.duration}ms` }}
              />
            )}
          </div>
        )}
      </For>
    </div>
  );
}
