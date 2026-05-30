import { For, Show } from "solid-js";
import {
  clearHistory,
  getHistory,
  markAllRead,
  removeFromHistory,
  type Toast,
} from "./toast-store";

const KIND_ICONS: Record<string, string> = {
  error: "✕",
  warning: "⚠",
  info: "ℹ",
  success: "✓",
};

export interface ErrorLogPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ErrorLogPanel(props: ErrorLogPanelProps) {
  const onOpen = () => {
    markAllRead();
  };

  return (
    <Show when={props.open}>
      {(() => {
        onOpen();
        return null;
      })()}
      <div class="error-log__overlay">
        <button
          type="button"
          class="error-log__backdrop"
          onClick={props.onClose}
        />
        <div class="error-log">
          <div class="error-log__header">
            <h3>Notifications</h3>
            <div class="error-log__actions">
              <button
                type="button"
                class="button button--ghost"
                onClick={clearHistory}
              >
                Clear all
              </button>
              <button
                type="button"
                class="button button--icon"
                onClick={props.onClose}
              >
                ×
              </button>
            </div>
          </div>
          <div class="error-log__body">
            <Show when={getHistory()().length === 0}>
              <p class="error-log__empty">No notifications</p>
            </Show>
            <For each={getHistory()()}>
              {(item: Toast) => (
                <div class={`error-log__item error-log__item--${item.kind}`}>
                  <span class={`toast__icon toast__icon--${item.kind}`}>
                    {KIND_ICONS[item.kind]}
                  </span>
                  <div class="error-log__item-content">
                    <span class="error-log__item-message">{item.message}</span>
                    <span class="error-log__item-time">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="toast__dismiss"
                    onClick={() => removeFromHistory(item.id)}
                  >
                    ×
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}
