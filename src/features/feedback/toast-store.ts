import { createSignal } from "solid-js";

export type ToastKind = "error" | "warning" | "info" | "success";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  detail?: string;
  duration: number;
  timestamp: number;
}

const [toasts, setToasts] = createSignal<Toast[]>([]);
const [history, setHistory] = createSignal<Toast[]>([]);
const [unreadCount, setUnreadCount] = createSignal(0);

let idCounter = 0;

const DURATIONS: Record<ToastKind, number> = {
  success: 2000,
  info: 3000,
  warning: 4000,
  error: 5000,
};

export function addToast(
  kind: ToastKind,
  message: string,
  detail?: string,
): string {
  const id = `toast-${++idCounter}`;
  const isFatal = kind === "error";
  const duration = isFatal ? 0 : DURATIONS[kind];
  const toast: Toast = {
    id,
    kind,
    message,
    detail,
    duration,
    timestamp: Date.now(),
  };

  setToasts((prev) => [toast, ...prev].slice(0, 5));
  setHistory((prev) => [toast, ...prev].slice(0, 100));
  setUnreadCount((n) => n + 1);

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
  return id;
}

export function removeToast(id: string) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

export function getToasts() {
  return toasts;
}
export function getHistory() {
  return history;
}
export function getUnreadCount() {
  return unreadCount;
}
export function markAllRead() {
  setUnreadCount(0);
}
export function clearHistory() {
  setHistory([]);
  setUnreadCount(0);
}
export function removeFromHistory(id: string) {
  setHistory((prev) => prev.filter((t) => t.id !== id));
}
