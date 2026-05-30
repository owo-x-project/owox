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

export interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel(props: NotificationPanelProps) {
  const onOpen = () => {
    markAllRead();
  };

  return (
    <Show when={props.open}>
      {(() => {
        onOpen();
        return null;
      })()}
      <aside class="notification-panel" aria-label="Notifications">
        <div class="notification-panel__header">
          <h3>Notifications</h3>
          <div class="notification-panel__actions">
            <button
              type="button"
              class="button button--ghost"
              onClick={clearHistory}
            >
              Clear
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
        <div class="notification-panel__body">
          <Show when={getHistory()().length === 0}>
            <p class="notification-panel__empty">No notifications</p>
          </Show>
          <For each={getHistory()()}>
            {(item: Toast) => (
              <div
                class={`notification-panel__item notification-panel__item--${item.kind}`}
              >
                <span class={`toast__icon toast__icon--${item.kind}`}>
                  {KIND_ICONS[item.kind]}
                </span>
                <div class="notification-panel__item-content">
                  <span class="notification-panel__item-message">
                    {item.message}
                  </span>
                  <span class="notification-panel__item-time">
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
      </aside>
    </Show>
  );
}
