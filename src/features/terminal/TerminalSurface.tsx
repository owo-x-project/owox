import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import {
  createRenderer,
  DEFAULT_RENDERER,
  type TerminalRenderer,
} from "./renderer";
import "./renderer/renderer.css";
import {
  ConfirmDialog,
  ErrorBanner,
  type ErrorView,
  toErrorView,
} from "../feedback";
import type { SurfaceProps } from "../shell/placeholders";
import { type SessionState, TerminalApi } from "./api";
import {
  applyOutputSeq,
  applyTermState,
  isFinished,
  type SessionMap,
  sessionsFromList,
} from "./session-model";
import { TerminalSocket, type TermStateInfo } from "./transport";
import "./terminal.css";

/** Map an unknown thrown value into the shared error-display contract. */
function toTerminalError(error: unknown): ErrorView {
  return toErrorView(error, "Terminal error");
}

/** Connection lifecycle of the live socket, distinct from session state. */
type LinkStatus = "idle" | "connecting" | "live" | "reconnecting" | "closed";

/** Pending stop-session confirmation target (session id + display label). */
interface SessionLabel {
  id: string;
  label: string;
}

const STATE_LABELS: Record<SessionState, string> = {
  creating: "Creating",
  running: "Running",
  exited: "Exited",
  failed: "Failed",
  terminated: "Terminated",
};

/**
 * Terminal active surface (`SPEC-runtime-terminal-session`,
 * `SPEC-runtime-terminal-log-reconnect`). On mount it lists the project's
 * sessions (reconnect), shows a session tab strip, and for the active session
 * replays the persisted log tail into the renderer before attaching the live
 * {@link TerminalSocket}. The renderer is constructed through the swappable
 * {@link createRenderer} factory; no xterm API is hardcoded here.
 *
 * A disconnect never crashes the surface: the link status drops to
 * `reconnecting`/`closed` and a Reconnect control re-attaches. Renderer and
 * socket are disposed on cleanup and whenever the active session changes.
 */
export const TerminalSurface: Component<SurfaceProps> = (props) => {
  const api = createMemo(() => new TerminalApi(props.projectId));

  const [sessions, setSessions] = createStore<SessionMap>({});
  const [activeId, setActiveId] = createSignal<string | null>(null);
  const [listError, setListError] = createSignal<ErrorView | null>(null);
  const [stopTarget, setStopTarget] = createSignal<SessionLabel | null>(null);
  const [linkStatus, setLinkStatus] = createSignal<LinkStatus>("idle");
  const [loading, setLoading] = createSignal(false);

  let containerRef: HTMLDivElement | undefined;
  let renderer: TerminalRenderer | null = null;
  let socket: TerminalSocket | null = null;

  const sessionList = createMemo(() => Object.values(sessions));
  const activeSession = createMemo(() => {
    const id = activeId();
    return id ? sessions[id] : undefined;
  });

  /** Refresh the session list from the server (reconnect entry point). */
  async function loadSessions() {
    setListError(null);
    setLoading(true);
    try {
      const response = await api().list();
      setSessions(sessionsFromList(response.sessions));
      const ids = response.sessions.map((s) => s.id);
      const current = activeId();
      if (current === null || !ids.includes(current)) {
        setActiveId(ids[0] ?? null);
      }
    } catch (err) {
      setListError(toTerminalError(err));
    } finally {
      setLoading(false);
    }
  }

  /** Tear down the live renderer + socket (session switch / cleanup). */
  function teardown() {
    socket?.dispose();
    socket = null;
    renderer?.dispose();
    renderer = null;
    setLinkStatus("idle");
  }

  /** Replay the persisted log tail, then attach the live socket. */
  async function attach(sessionId: string) {
    teardown();
    if (!containerRef) {
      return;
    }
    const entry = sessions[sessionId];
    const r = createRenderer(DEFAULT_RENDERER);
    renderer = r;
    r.mount(containerRef);
    r.focus();

    // Replay the persisted log tail into the renderer (reconnect step).
    try {
      const log = await api().logRange(sessionId);
      for (const chunk of [...log.chunks].sort((a, b) => a.offset - b.offset)) {
        r.write(chunk.data);
      }
    } catch {
      // A missing / unavailable log must not block attaching to a live stream.
    }

    // A finished session has no live stream to attach.
    if (entry && isFinished(entry.state)) {
      setLinkStatus("closed");
      return;
    }

    setLinkStatus("connecting");
    const sock = new TerminalSocket(props.projectId, sessionId, {
      onOpen: () => setLinkStatus("live"),
      onOutput: (seq, data) => {
        renderer?.write(data);
        setSessions((prev) => applyOutputSeq(prev, sessionId, seq));
      },
      onState: (info: TermStateInfo) => {
        setSessions((prev) => applyTermState(prev, sessionId, info));
        if (isFinished(info.state)) {
          setLinkStatus("closed");
        }
      },
      onAck: (ack) => {
        if (ack.status === "rejected") {
          setListError(toTerminalError(new Error("Subscription rejected")));
          setLinkStatus("closed");
        }
      },
      onError: (apiError) =>
        setListError(toTerminalError({ response: { error: apiError } })),
      onClose: ({ error }) => {
        const finished = activeSession();
        if (finished && isFinished(finished.state)) {
          setLinkStatus("closed");
        } else {
          setLinkStatus(error ? "reconnecting" : "closed");
        }
      },
    });
    socket = sock;
    r.onInput((data) => sock.sendInput(data));
    r.onResize((size) => sock.sendResize(size.cols, size.rows));
    const size = r.fit();
    sock.sendResize(size.cols, size.rows);
  }

  /** Re-attach the live stream to the active session after a drop. */
  function reconnect() {
    const id = activeId();
    if (id) {
      void attach(id);
    }
  }

  // Reload the session list whenever the project changes (browser reload too).
  createEffect(
    on(
      () => props.projectId,
      () => {
        teardown();
        setSessions(sessionsFromList([]));
        setActiveId(null);
        void loadSessions();
      },
    ),
  );

  // Attach the renderer + socket whenever the active session changes.
  createEffect(
    on(activeId, (id) => {
      if (id) {
        void attach(id);
      } else {
        teardown();
      }
    }),
  );

  onCleanup(teardown);

  async function terminate(sessionId: string) {
    try {
      await api().remove(sessionId);
    } catch (err) {
      setListError(toTerminalError(err));
      return;
    }
    if (activeId() === sessionId) {
      teardown();
    }
    await loadSessions();
  }

  return (
    <section class="terminal-surface">
      <header class="terminal-surface__bar">
        <div class="terminal-surface__tabs" role="tablist">
          <Show
            when={sessionList().length > 0}
            fallback={
              <span class="terminal-surface__empty muted">
                No sessions yet. Use the command launcher (⌘K) to start one.
              </span>
            }
          >
            <For each={sessionList()}>
              {(session) => (
                <button
                  type="button"
                  role="tab"
                  class="terminal-surface__tab"
                  classList={{
                    "terminal-surface__tab--active": session.id === activeId(),
                  }}
                  aria-selected={session.id === activeId()}
                  onClick={() => setActiveId(session.id)}
                >
                  <span class="terminal-surface__tab-label">
                    {session.label || session.id}
                  </span>
                  <span
                    class="terminal-surface__state"
                    data-state={session.state}
                  >
                    {STATE_LABELS[session.state]}
                  </span>
                </button>
              )}
            </For>
          </Show>
        </div>
        <div class="terminal-surface__actions">
          <button
            type="button"
            class="button button--ghost"
            disabled={loading()}
            onClick={() => void loadSessions()}
          >
            {loading() ? "Refreshing…" : "Refresh"}
          </button>
          <Show when={activeSession()}>
            {(session) => (
              <button
                type="button"
                class="button button--ghost"
                disabled={isFinished(session().state)}
                onClick={() =>
                  setStopTarget({
                    id: session().id,
                    label: session().label || session().id,
                  })
                }
              >
                Terminate
              </button>
            )}
          </Show>
        </div>
      </header>

      <Show when={activeSession()}>
        {(session) => (
          <div class="terminal-surface__status muted" aria-live="polite">
            <span class="terminal-surface__state" data-state={session().state}>
              {STATE_LABELS[session().state]}
            </span>
            <Show when={session().exitCode !== null}>
              <span>exit code {session().exitCode}</span>
            </Show>
            <span class="terminal-surface__link" data-link={linkStatus()}>
              {linkLabel(linkStatus())}
            </span>
            <Show
              when={
                linkStatus() === "reconnecting" || linkStatus() === "closed"
              }
            >
              <Show when={!isFinished(session().state)}>
                <button
                  type="button"
                  class="button button--ghost"
                  onClick={() => reconnect()}
                >
                  Reconnect
                </button>
              </Show>
            </Show>
          </div>
        )}
      </Show>

      <Show when={listError()}>
        {(error) => <ErrorBanner error={error()} />}
      </Show>

      <div class="terminal-surface__screen" ref={containerRef} />

      <Show when={stopTarget()}>
        {(target) => (
          <ConfirmDialog
            open
            operation="Stop session"
            targets={[target().label]}
            onCancel={() => setStopTarget(null)}
            onConfirm={() => {
              const id = target().id;
              setStopTarget(null);
              void terminate(id);
            }}
            confirmLabel="Stop"
          />
        )}
      </Show>
    </section>
  );
};

function linkLabel(status: LinkStatus): string {
  switch (status) {
    case "connecting":
      return "connecting…";
    case "live":
      return "live";
    case "reconnecting":
      return "disconnected";
    case "closed":
      return "stream closed";
    default:
      return "";
  }
}
