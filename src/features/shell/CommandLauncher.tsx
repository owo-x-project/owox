import { createMemo, createSignal, For, Show } from "solid-js";
import { t } from "../../i18n";
import { ErrorBanner, type ErrorView, toErrorView } from "../feedback";
import {
  type CommandHistoryEntry,
  type CreatedSession,
  type CreateSessionRequest,
  describeCommand,
  emptyHistory,
  type LauncherHistory,
  rememberFailed,
  rememberRecent,
} from "../terminal";
import {
  CommandIcon,
  FilesIcon,
  ReviewIcon,
  SearchIcon,
  TerminalIcon,
} from "./icons";
import { ACTIVE_SURFACES, type ActiveSurface } from "./state";

export interface CommandLauncherProps {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  createSession: (
    projectId: string,
    request: CreateSessionRequest,
  ) => Promise<CreatedSession>;
  onSessionCreated: () => void;
  /** Switch the shell's active surface. */
  onSwitchSurface?: (surface: ActiveSurface) => void;
  /** Select a project by id. */
  onSelectProject?: (projectId: string) => void;
  /** Available project ids for switching. */
  availableProjectIds?: string[];
}

const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 32;

function toLauncherError(error: unknown): ErrorView {
  return toErrorView(error, t("launcher.failedToStart"));
}

interface LauncherItem {
  id: string;
  icon: string;
  label: string;
  detail?: string;
  category: string;
  action: () => void;
}

export function CommandLauncher(props: CommandLauncherProps) {
  const [query, setQuery] = createSignal("");
  const [history, setHistory] = createSignal<LauncherHistory>(emptyHistory());
  const [error, setError] = createSignal<ErrorView | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const isTerminalMode = createMemo(
    () => query().startsWith("> ") || query() === ">",
  );

  const terminalCommand = createMemo(() => {
    if (!isTerminalMode()) return "";
    return query().slice(2).trim();
  });

  function close() {
    setError(null);
    setQuery("");
    setSelectedIndex(0);
    props.onClose();
  }

  const filteredItems = createMemo<LauncherItem[]>(() => {
    const q = query().toLowerCase().trim();
    if (isTerminalMode()) return [];

    const items: LauncherItem[] = [];

    // Command/terminal history
    for (const entry of history().recent) {
      items.push({
        id: `recent-${describeCommand(entry)}`,
        icon: "terminal",
        label: `> ${describeCommand(entry)}`,
        detail: t("launcher.recent"),
        category: t("launcher.recent"),
        action: () => runCommand(entry),
      });
    }

    // Surface switching
    for (const surface of ACTIVE_SURFACES) {
      items.push({
        id: `surface-${surface}`,
        icon: surface,
        label: `${t(`${surface}.title`)}`,
        detail: surface,
        category: "アプリ・ウィンドウ",
        action: () => {
          props.onSwitchSurface?.(surface);
          close();
        },
      });
    }

    // Project switching
    if (props.availableProjectIds) {
      for (const pid of props.availableProjectIds) {
        items.push({
          id: `project-${pid}`,
          icon: "project",
          label: pid,
          detail: "project",
          category: t("projects.title"),
          action: () => {
            props.onSelectProject?.(pid);
            close();
          },
        });
      }
    }

    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.detail?.toLowerCase().includes(q) ?? false),
    );
  });

  // Group items by category
  const groupedItems = createMemo(() => {
    const groups = new Map<string, LauncherItem[]>();
    for (const item of filteredItems()) {
      const existing = groups.get(item.category);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(item.category, [item]);
      }
    }
    return groups;
  });

  function runCommand(entry: CommandHistoryEntry) {
    setQuery(`> ${describeCommand(entry)}`);
  }

  async function submitTerminal() {
    const projectId = props.projectId;
    if (!projectId || busy()) return;

    const cmd = terminalCommand();
    const parts = cmd.split(/\s+/).filter(Boolean);
    const command = parts[0] || "";
    const args = parts.slice(1);

    const historyEntry: CommandHistoryEntry = { command, args, cwd: "." };
    const request: CreateSessionRequest = {
      cwd: ".",
      command,
      args,
      env: {},
      cols: DEFAULT_COLS,
      rows: DEFAULT_ROWS,
      label: command || "terminal",
    };

    setBusy(true);
    try {
      const session = await props.createSession(projectId, request);
      if (session.state === "failed") {
        setHistory((prev) => rememberFailed(prev, historyEntry));
        setError(toLauncherError(new Error(t("launcher.commandNotFound"))));
        props.onSessionCreated();
        return;
      }
      setHistory((prev) => rememberRecent(prev, historyEntry));
      props.onSessionCreated();
      close();
    } catch (err) {
      setHistory((prev) => rememberFailed(prev, historyEntry));
      setError(toLauncherError(err));
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (isTerminalMode()) {
        void submitTerminal();
      } else {
        const items = filteredItems();
        const idx = selectedIndex();
        if (items[idx]) {
          items[idx].action();
        }
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredItems().length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
  }

  let flatIndex = 0;

  return (
    <Show when={props.open}>
      <div class="command-launcher__overlay">
        <button
          type="button"
          class="command-launcher__backdrop"
          aria-label={t("launcher.close")}
          onClick={close}
        />
        <div
          class="command-launcher"
          role="dialog"
          aria-modal="true"
          aria-label={t("launcher.title")}
          onKeyDown={onKeyDown}
        >
          {/* Search input */}
          <div class="command-launcher__search">
            <span class="command-launcher__search-icon">
              <SearchIcon size={16} />
            </span>
            <input
              class="command-launcher__search-input"
              type="text"
              placeholder={
                t("launcher.searchPlaceholder") ||
                "コマンドまたはファイル名… ( > でターミナル実行 )"
              }
              value={query()}
              autofocus
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setSelectedIndex(0);
              }}
            />
            <kbd class="command-launcher__search-kbd">ESC</kbd>
          </div>

          {/* Terminal mode */}
          <Show when={isTerminalMode()}>
            <div class="command-launcher__terminal-hint">
              <Show
                when={props.projectId}
                fallback={
                  <p class="command-launcher__empty muted">
                    {t("launcher.noProject")}
                  </p>
                }
              >
                <div class="command-launcher__terminal-row">
                  <span class="command-launcher__terminal-prompt">&gt;_</span>
                  <span>
                    {terminalCommand() || t("launcher.commandPlaceholder")}
                  </span>
                  <span class="command-launcher__terminal-action">
                    {busy() ? t("launcher.starting") : "ターミナルで実行 ↵"}
                  </span>
                </div>
              </Show>
            </div>
          </Show>

          {/* Results list */}
          <Show when={!isTerminalMode()}>
            <div class="command-launcher__results">
              {(() => {
                flatIndex = 0;
                return null;
              })()}
              <For each={Array.from(groupedItems().entries())}>
                {([category, items]) => (
                  <div class="command-launcher__group">
                    <div class="command-launcher__group-label">{category}</div>
                    <For each={items}>
                      {(item) => {
                        const myIndex = flatIndex++;
                        return (
                          <button
                            type="button"
                            class="command-launcher__result-item"
                            classList={{
                              "command-launcher__result-item--selected":
                                selectedIndex() === myIndex,
                            }}
                            onClick={() => item.action()}
                            onMouseEnter={() => setSelectedIndex(myIndex)}
                          >
                            <span class="command-launcher__result-icon">
                              {item.icon === "terminal" && (
                                <TerminalIcon size={16} />
                              )}
                              {item.icon === "files" && <FilesIcon size={16} />}
                              {item.icon === "review" && (
                                <ReviewIcon size={16} />
                              )}
                              {item.icon === "project" && (
                                <CommandIcon size={16} />
                              )}
                            </span>
                            <span class="command-launcher__result-label">
                              {item.label}
                            </span>
                            <span class="command-launcher__result-detail">
                              {item.detail}
                            </span>
                          </button>
                        );
                      }}
                    </For>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <div class="command-launcher__error" aria-live="polite">
            <Show when={error()}>{(err) => <ErrorBanner error={err()} />}</Show>
          </div>
        </div>
      </div>
    </Show>
  );
}
