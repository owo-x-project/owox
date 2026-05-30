import { createEffect, createSignal, on, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { ConfirmDialog, ErrorBanner } from "../feedback";
import { LogApi } from "./api";
import { isNotFound, type LogViewError, toLogViewError } from "./errors";
import {
  appendRange,
  emptyLogModel,
  isComplete,
  type LogModel,
  nextOffset,
  remainingBytes,
} from "./log-model";

export interface LogViewProps {
  /** Log to view, or null to render the empty state. */
  logId: string | null;
  /** Optional override for the API base URL (tests / embedding). */
  baseUrl?: string;
}

type Status = "idle" | "loading" | "ready" | "not_found" | "error";

/**
 * Self-contained log viewer (Phase 02 baseline). Accepts a `logId` prop and
 * owns its own range-read data loading. Later phases supply the id from a
 * terminal session; for now an absent id renders an empty state.
 *
 * States follow `SPEC-shared-error-display`: loading, empty (no logId),
 * not-found (deleted / missing log), and generic error. Raw thrown values and
 * stack traces are never rendered — only the typed error fields and log_ref.
 * The viewer renders exactly what the API returns and never attempts to
 * reconstruct un-redacted content (ops-log-retention-redaction).
 */
export function LogView(props: LogViewProps) {
  const api = new LogApi(props.baseUrl ?? "");

  const [model, setModel] = createStore<LogModel>(emptyLogModel());
  const [status, setStatus] = createSignal<Status>("idle");
  const [error, setError] = createSignal<LogViewError | null>(null);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [confirmingDelete, setConfirmingDelete] = createSignal(false);
  const [deleted, setDeleted] = createSignal(false);

  function reset() {
    setModel(emptyLogModel());
    setError(null);
    setLoadingMore(false);
    setConfirmingDelete(false);
    setDeleted(false);
  }

  async function fetchNext(logId: string) {
    try {
      const response = await api.getLogRange(logId, nextOffset(model));
      setModel((prev) => appendRange(prev, response));
      setStatus("ready");
    } catch (err) {
      if (isNotFound(err)) {
        setStatus("not_found");
      } else {
        setError(toLogViewError(err));
        setStatus("error");
      }
    }
  }

  // Load (or reload) whenever the logId prop changes.
  createEffect(
    on(
      () => props.logId,
      (logId) => {
        reset();
        if (logId === null) {
          setStatus("idle");
          return;
        }
        setStatus("loading");
        void fetchNext(logId);
      },
    ),
  );

  async function loadMore() {
    const logId = props.logId;
    if (logId === null || loadingMore() || isComplete(model)) {
      return;
    }
    setLoadingMore(true);
    await fetchNext(logId);
    setLoadingMore(false);
  }

  async function retry() {
    const logId = props.logId;
    if (logId === null) {
      return;
    }
    setStatus("loading");
    await fetchNext(logId);
  }

  async function confirmDelete() {
    const logId = props.logId;
    if (logId === null) {
      return;
    }
    try {
      await api.deleteLog(logId);
      setConfirmingDelete(false);
      setDeleted(true);
      setStatus("not_found");
    } catch (err) {
      setConfirmingDelete(false);
      setError(toLogViewError(err));
      setStatus("error");
    }
  }

  return (
    <section class="log-view">
      <header class="log-view__header">
        <h2 class="log-view__title">Log</h2>
        <Show when={props.logId}>
          {(logId) => (
            <span class="log-view__id" title={logId()}>
              {logId()}
            </span>
          )}
        </Show>
        <Show when={status() === "ready"}>
          <span class="log-view__progress muted">
            loaded {model.loadedBytes} / {model.totalBytes} bytes
            <Show when={remainingBytes(model) > 0}>
              {" "}
              ({remainingBytes(model)} remaining)
            </Show>
          </span>
        </Show>
      </header>

      <Show
        when={props.logId !== null}
        fallback={
          <p class="log-view__state muted">
            No log selected. A log opens here when a session or command produces
            one.
          </p>
        }
      >
        <Show when={status() !== "loading"} fallback={<LoadingState />}>
          <Show
            when={status() !== "not_found"}
            fallback={<NotFoundState deleted={deleted()} />}
          >
            <Show
              when={!(status() === "error" && error())}
              fallback={
                <div class="log-view__state">
                  <ErrorBanner
                    error={error() as LogViewError}
                    onRetry={() => void retry()}
                  />
                </div>
              }
            >
              <pre class="log-view__content">{model.text}</pre>

              <footer class="log-view__footer">
                <Show
                  when={!isComplete(model)}
                  fallback={<span class="muted">End of log.</span>}
                >
                  <button
                    type="button"
                    class="button"
                    disabled={loadingMore()}
                    onClick={() => void loadMore()}
                  >
                    {loadingMore() ? "Loading…" : "Load more"}
                  </button>
                </Show>

                <button
                  type="button"
                  class="button button--ghost log-view__clear"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Clear log
                </button>
              </footer>
            </Show>
          </Show>
        </Show>
      </Show>

      <ConfirmDialog
        open={confirmingDelete()}
        operation="Clear log"
        targets={props.logId ? [props.logId] : []}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => void confirmDelete()}
        confirmLabel="Delete"
      />
    </section>
  );
}

function LoadingState() {
  return <p class="log-view__state muted">Loading log…</p>;
}

function NotFoundState(props: { deleted: boolean }) {
  return (
    <p class="log-view__state muted">
      {props.deleted
        ? "Log deleted. This action cannot be undone."
        : "Log unavailable — it may have been deleted or never existed."}
    </p>
  );
}
