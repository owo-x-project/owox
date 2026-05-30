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
import { createStore, produce, reconcile } from "solid-js/store";
import { t } from "../../i18n";
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
  upsertSession,
} from "./session-model";
import { TerminalSocket, type TermStateInfo } from "./transport";
import { SplitPaneView } from "./SplitPane";
import {
  createLeaf,
  findLeaves,
  type PaneNode,
  removePane,
  splitPane,
} from "./pane-model";
import { SplitHorizontalIcon, SplitVerticalIcon } from "../shell/icons";
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

/** Auto-cleanup delay for exited sessions (30 minutes). */
const AUTO_CLEANUP_MS = 30 * 60 * 1000;

const STATE_LABEL_KEYS: Record<SessionState, string> = {
  creating: "terminal.creating",
  running: "terminal.running",
  exited: "terminal.exited",
  failed: "terminal.failed",
  terminated: "terminal.terminated",
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
  const [deleteTarget, setDeleteTarget] = createSignal<SessionLabel | null>(null);
  const [linkStatus, setLinkStatus] = createSignal<LinkStatus>("idle");
  const [loading, setLoading] = createSignal(false);
  const [paneRoot, setPaneRoot] = createSignal<PaneNode | null>(null);
  const [activePaneId, setActivePaneId] = createSignal<string | null>(null);

  /** IDs explicitly closed by the user – filtered out on next loadSessions. */
  const deletedIds = new Set<string>();

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
      // Silently remove failed sessions from server and filter them out.
      const failedIds: string[] = [];
      const alive = response.sessions.filter((s) => {
        if (deletedIds.has(s.id)) return false;
        if (s.state === "failed") {
          failedIds.push(s.id);
          return false;
        }
        return true;
      });
      // Fire-and-forget cleanup of failed sessions on server.
      for (const fid of failedIds) {
        api().remove(fid).catch(() => { });
      }
      setSessions(reconcile(sessionsFromList(alive)));
      const ids = alive.map((s) => s.id);
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
    // Task 002: focus the terminal when a session becomes active so keyboard
    // input is immediately captured by xterm.
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
        setSessions(produce((draft) => {
          const e = draft[sessionId];
          if (e && seq > e.lastOutputSeq) e.lastOutputSeq = seq;
        }));
      },
      onState: (info: TermStateInfo) => {
        setSessions(produce((draft) => {
          const e = draft[sessionId];
          if (e) {
            e.state = info.state;
            if (info.exit_code != null) e.exitCode = info.exit_code;
          }
        }));
        // Auto-remove failed sessions silently.
        if (info.state === "failed") {
          deletedIds.add(sessionId);
          setSessions(produce((draft) => { delete draft[sessionId]; }));
          if (activeId() === sessionId) {
            teardown();
            const ids = Object.keys(sessions).filter((id) => id !== sessionId);
            setActiveId(ids[0] ?? null);
          }
          api().remove(sessionId).catch(() => { });
          return;
        }
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
    // Task 002: xterm onData → WebSocket sendInput is wired here. onData
    // covers keystrokes, IME text and paste. Verified correct.
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
        setSessions(reconcile({}));
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

  /** Task 004: Delete a session (close tab). */
  async function deleteSession(sessionId: string) {
    const entry = sessions[sessionId];
    const finished = entry && isFinished(entry.state);
    const isPending = sessionId.startsWith("pending_");
    // Remember this ID so loadSessions() won't resurrect it.
    deletedIds.add(sessionId);
    if (!isPending) {
      try {
        await api().remove(sessionId);
      } catch (err) {
        // For finished sessions or if server returns error, remove locally anyway.
        if (!finished) {
          setListError(toTerminalError(err));
          // Still remove locally to unblock the UI.
        }
      }
    }
    // Remove pane if in split view.
    const root = paneRoot();
    if (root) {
      const updated = removePane(root, findPaneIdForSession(root, sessionId) ?? "");
      setPaneRoot(updated);
    }
    // Remove from local state.
    setSessions(produce((draft) => {
      delete draft[sessionId];
    }));
    // Switch to next session if deleted was active.
    if (activeId() === sessionId) {
      teardown();
      const ids = Object.keys(sessions).filter((id) => id !== sessionId);
      setActiveId(ids[0] ?? null);
    }
  }

  /** Find pane id for a session id. */
  function findPaneIdForSession(root: PaneNode, sessionId: string): string | null {
    const leaves = findLeaves(root);
    const leaf = leaves.find((l) => l.sessionId === sessionId);
    return leaf ? leaf.id : null;
  }

  /** Task 004: Request close – confirm if running, else delete immediately. */
  function requestClose(sessionId: string) {
    const entry = sessions[sessionId];
    if (!entry) return;
    if (isFinished(entry.state)) {
      void deleteSession(sessionId);
    } else {
      setDeleteTarget({ id: sessionId, label: entry.label || sessionId });
    }
  }

  // Task 004: Auto-cleanup exited sessions after 30 minutes.
  createEffect(() => {
    const list = sessionList();
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const entry of list) {
      if (isFinished(entry.state)) {
        const timer = setTimeout(() => {
          void deleteSession(entry.id);
        }, AUTO_CLEANUP_MS);
        timers.push(timer);
      }
    }
    onCleanup(() => {
      for (const timer of timers) clearTimeout(timer);
    });
  });

  /** Task 005: Split the current view horizontally or vertically. */
  async function splitView(direction: "horizontal" | "vertical") {
    const currentId = activeId();
    if (!currentId) return;
    // Create a new shell session for the split.
    let newSessionId: string;
    try {
      const size = renderer ? renderer.fit() : { cols: 80, rows: 24 };
      const response = await api().create({
        cwd: "",
        command: "/bin/bash",
        args: [],
        env: {},
        cols: size.cols,
        rows: size.rows,
        label: "",
      });
      const created = response.session;
      setSessions(produce((draft) => {
        draft[created.id] = {
          id: created.id,
          label: created.label || t("terminal.newShell"),
          state: created.state,
          cwd: "",
          exitCode: null,
          lastOutputSeq: 0,
        };
      }));
      newSessionId = created.id;
    } catch (err) {
      setListError(toTerminalError(err));
      return;
    }

    const root = paneRoot();
    if (!root) {
      // First split: wrap current session in a leaf, then split.
      const currentLeaf = createLeaf(currentId);
      const split = splitPane(currentLeaf, currentLeaf.id, newSessionId, direction);
      setPaneRoot(split);
      const leaves = findLeaves(split);
      const newLeaf = leaves.find((l) => l.sessionId === newSessionId);
      if (newLeaf) setActivePaneId(newLeaf.id);
    } else {
      // Split the active pane.
      const targetPaneId = activePaneId();
      if (!targetPaneId) return;
      const updated = splitPane(root, targetPaneId, newSessionId, direction);
      setPaneRoot(updated);
      const leaves = findLeaves(updated);
      const newLeaf = leaves.find((l) => l.sessionId === newSessionId);
      if (newLeaf) setActivePaneId(newLeaf.id);
    }
    setActiveId(newSessionId);
  }

  /** Task 001: Create a plain shell session and auto-activate it. */
  async function createShell() {
    const optimisticId = `pending_${Date.now()}`;
    // Task 003: optimistically add the tab before the server responds.
    setSessions(produce((draft) => {
      draft[optimisticId] = {
        id: optimisticId,
        label: t("terminal.newShell"),
        state: "creating",
        cwd: "",
        exitCode: null,
        lastOutputSeq: 0,
      };
    }));
    setActiveId(optimisticId);

    try {
      const size = renderer ? renderer.fit() : { cols: 80, rows: 24 };
      const response = await api().create({
        cwd: "",
        command: "/bin/bash",
        args: [],
        env: {},
        cols: size.cols,
        rows: size.rows,
        label: "",
      });
      const created = response.session;
      // Remove the optimistic placeholder, insert the real session.
      setSessions(produce((draft) => {
        delete draft[optimisticId];
        draft[created.id] = {
          id: created.id,
          label: created.label || t("terminal.newShell"),
          state: created.state,
          cwd: "",
          exitCode: null,
          lastOutputSeq: 0,
        };
      }));
      setActiveId(created.id);
    } catch (err) {
      // Remove the optimistic placeholder on failure.
      setSessions(produce((draft) => {
        delete draft[optimisticId];
      }));
      setActiveId(null);
      setListError(toTerminalError(err));
    }
  }

  return (
    <section class="terminal-surface">
      <header class="terminal-surface__bar">
        <div class="terminal-tabs" role="tablist">
          <Show
            when={sessionList().length > 0}
            fallback={
              <span class="terminal-surface__empty muted">
                {t("terminal.noSessions")}
              </span>
            }
          >
            <For each={sessionList()}>
              {(session) => (
                <button
                  type="button"
                  role="tab"
                  class="terminal-tab"
                  classList={{
                    "terminal-tab--active": session.id === activeId(),
                    "terminal-tab--exited": isFinished(session.state),
                  }}
                  aria-selected={session.id === activeId()}
                  onClick={() => setActiveId(session.id)}
                >
                  <span
                    class="terminal-tab__badge"
                    classList={{
                      "terminal-tab__badge--creating": session.state === "creating",
                      "terminal-tab__badge--running": session.state === "running",
                      "terminal-tab__badge--exited": session.state === "exited" || session.state === "terminated",
                      "terminal-tab__badge--failed": session.state === "failed",
                    }}
                  />
                  <span class="terminal-surface__tab-label">
                    {session.label || session.id}
                  </span>
                  <span
                    class="terminal-tab__close"
                    role="button"
                    aria-label={t("common.close")}
                    onClick={(e) => {
                      e.stopPropagation();
                      requestClose(session.id);
                    }}
                  >
                    ×
                  </span>
                </button>
              )}
            </For>
          </Show>
          <button
            type="button"
            class="terminal-tabs__add"
            title={t("terminal.newShell")}
            onClick={() => void createShell()}
          >
            +
          </button>
        </div>
        <div class="terminal-surface__actions">
          <div class="terminal-toolbar">
            <button
              type="button"
              class="button button--ghost"
              title={t("terminal.splitRight")}
              disabled={!activeId()}
              onClick={() => void splitView("horizontal")}
            >
              <SplitHorizontalIcon size={16} />
            </button>
            <button
              type="button"
              class="button button--ghost"
              title={t("terminal.splitDown")}
              disabled={!activeId()}
              onClick={() => void splitView("vertical")}
            >
              <SplitVerticalIcon size={16} />
            </button>
          </div>
          <button
            type="button"
            class="button button--ghost"
            disabled={loading()}
            onClick={() => void loadSessions()}
          >
            {loading() ? t("terminal.refreshing") : t("terminal.refresh")}
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
                {t("terminal.terminate")}
              </button>
            )}
          </Show>
        </div>
      </header>

      <Show when={activeSession()}>
        {(session) => (
          <div class="terminal-surface__status muted" aria-live="polite">
            <span class="terminal-surface__state" data-state={session().state}>
              {t(STATE_LABEL_KEYS[session().state])}
            </span>
            <Show when={session().exitCode !== null}>
              <span>{t("terminal.exitCode")} {session().exitCode}</span>
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
                  {t("terminal.reconnect")}
                </button>
              </Show>
            </Show>
          </div>
        )}
      </Show>

      <Show when={paneRoot()} fallback={
        <div class="terminal-surface__screen" ref={containerRef}>
          <Show when={listError()}>
            {(error) => (
              <div class="terminal-surface__error-overlay">
                <div class="terminal-surface__error-content">
                  <ErrorBanner error={error()} />
                  <button
                    type="button"
                    class="button"
                    onClick={() => setListError(null)}
                  >
                    {t("common.close")}
                  </button>
                </div>
              </div>
            )}
          </Show>
        </div>
      }>
        {(root) => (
          <div class="terminal-surface__screen">
            <SplitPaneView
              node={root()}
              activeId={activePaneId()}
              onActivate={(paneId) => {
                setActivePaneId(paneId);
                const leaves = findLeaves(root());
                const leaf = leaves.find((l) => l.id === paneId);
                if (leaf) setActiveId(leaf.sessionId);
              }}
              renderLeaf={(sessionId, _paneId) => {
                const [el, setEl] = createSignal<HTMLDivElement>();
                // When this leaf becomes the active session, update containerRef
                // so attach() mounts the renderer here. Use createEffect to
                // react only when activeId changes, not on every render.
                createEffect(() => {
                  const div = el();
                  if (div && sessionId === activeId()) {
                    containerRef = div;
                  }
                });
                return (
                  <div
                    class="terminal-surface__screen"
                    ref={setEl}
                  />
                );
              }}
            />
          </div>
        )}
      </Show>

      <Show when={stopTarget()}>
        {(target) => (
          <ConfirmDialog
            open
            operation={t("terminal.stopSession")}
            targets={[target().label]}
            onCancel={() => setStopTarget(null)}
            onConfirm={() => {
              const id = target().id;
              setStopTarget(null);
              void terminate(id);
            }}
            confirmLabel={t("terminal.terminate")}
          />
        )}
      </Show>

      <Show when={deleteTarget()}>
        {(target) => (
          <ConfirmDialog
            open
            operation={t("terminal.closeSession")}
            targets={[target().label]}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => {
              const id = target().id;
              setDeleteTarget(null);
              void deleteSession(id);
            }}
            confirmLabel={t("common.close")}
          />
        )}
      </Show>
    </section>
  );
};

function linkLabel(status: LinkStatus): string {
  switch (status) {
    case "connecting":
      return t("terminal.connecting");
    case "live":
      return t("terminal.live");
    case "reconnecting":
      return t("terminal.disconnected");
    case "closed":
      return t("terminal.streamClosed");
    default:
      return "";
  }
}
