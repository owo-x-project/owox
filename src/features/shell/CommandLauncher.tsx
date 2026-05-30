import { createSignal, For, Show } from "solid-js";
import { t } from "../../i18n";
import { ErrorBanner, type ErrorView, toErrorView } from "../feedback";
import { PluginCommandList } from "../plugins";
import {
  type CommandHistoryEntry,
  type CreatedSession,
  type CreateSessionRequest,
  describeCommand,
  emptyHistory,
  emptyLauncherInput,
  type LauncherHistory,
  type LauncherInput,
  rememberFailed,
  rememberRecent,
  validateLauncherInput,
} from "../terminal";

export interface CommandLauncherProps {
  open: boolean;
  onClose: () => void;
  /** The currently-selected project, or null when none is bound. */
  projectId: string | null;
  /** Create a terminal session for the selected project. */
  createSession: (
    projectId: string,
    request: CreateSessionRequest,
  ) => Promise<CreatedSession>;
  /** Switch the shell's active surface to the terminal. */
  onSessionCreated: () => void;
}

/** Default terminal grid used for the create request. */
const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 32;

function toLauncherError(error: unknown): ErrorView {
  return toErrorView(error, t("launcher.failedToStart"));
}

/**
 * Command launcher (`ux-command-launcher`). v0 phase 03 wires the top-modal
 * palette to terminal session creation: the user enters command + args + a
 * repo-relative cwd + optional env, then a session is POSTed for the selected
 * project and the shell switches to the terminal surface.
 *
 * Input constraints come from {@link validateLauncherInput} (no absolute /
 * boundary-escaping cwd; KEY=VALUE env; whitespace-split args). The launcher
 * never executes anything that crosses the workspace boundary — the server is
 * authoritative and any boundary error is surfaced inline. A session that comes
 * back `state:"failed"` (command not found) or a create error moves the command
 * to the failed list; a session that starts is remembered as recent.
 */
export function CommandLauncher(props: CommandLauncherProps) {
  const [input, setInput] = createSignal<LauncherInput>(emptyLauncherInput());
  const [history, setHistory] = createSignal<LauncherHistory>(emptyHistory());
  const [error, setError] = createSignal<ErrorView | null>(null);
  const [fieldErrors, setFieldErrors] = createSignal<
    Record<string, string | undefined>
  >({});
  const [busy, setBusy] = createSignal(false);

  function patch(part: Partial<LauncherInput>) {
    setInput((prev) => ({ ...prev, ...part }));
  }

  function close() {
    setError(null);
    setFieldErrors({});
    props.onClose();
  }

  function fillFrom(entry: CommandHistoryEntry) {
    setInput({
      command: entry.command,
      args: entry.args.join(" "),
      cwd: entry.cwd,
      env: "",
    });
  }

  async function submit() {
    const projectId = props.projectId;
    if (projectId === null || busy()) {
      return;
    }
    setError(null);
    const validation = validateLauncherInput(input());
    if (!validation.valid || validation.parsed === null) {
      const map: Record<string, string> = {};
      for (const fe of validation.errors) {
        map[fe.field] = fe.message;
      }
      setFieldErrors(map);
      return;
    }
    setFieldErrors({});

    const parsed = validation.parsed;
    const historyEntry: CommandHistoryEntry = {
      command: parsed.command,
      args: parsed.args,
      cwd: parsed.cwd,
    };
    const request: CreateSessionRequest = {
      cwd: parsed.cwd,
      command: parsed.command,
      args: parsed.args,
      env: parsed.env,
      cols: DEFAULT_COLS,
      rows: DEFAULT_ROWS,
      label: parsed.command === "" ? "terminal" : parsed.command,
    };

    setBusy(true);
    try {
      const session = await props.createSession(projectId, request);
      if (session.state === "failed") {
        // Command-not-found: session exists but never started.
        setHistory((prev) => rememberFailed(prev, historyEntry));
        setError(
          toLauncherError(new Error(t("launcher.commandNotFound"))),
        );
        props.onSessionCreated();
        return;
      }
      setHistory((prev) => rememberRecent(prev, historyEntry));
      props.onSessionCreated();
      close();
    } catch (err) {
      // Boundary / validation errors are surfaced inline (server-enforced).
      setHistory((prev) => rememberFailed(prev, historyEntry));
      setError(toLauncherError(err));
    } finally {
      setBusy(false);
    }
  }

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
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              close();
            }
          }}
        >
          <Show
            when={props.projectId !== null}
            fallback={
              <p class="command-launcher__empty muted">
                {t("launcher.noProject")}
              </p>
            }
          >
            <form
              class="command-launcher__form"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <label class="command-launcher__field">
                <span class="command-launcher__field-label">{t("launcher.command")}</span>
                <input
                  class="command-launcher__field-input"
                  type="text"
                  placeholder={t("launcher.commandPlaceholder")}
                  value={input().command}
                  autofocus
                  onInput={(e) => patch({ command: e.currentTarget.value })}
                />
                <Show when={fieldErrors().command}>
                  {(msg) => (
                    <span class="command-launcher__field-error">{msg()}</span>
                  )}
                </Show>
              </label>

              <label class="command-launcher__field">
                <span class="command-launcher__field-label">{t("launcher.arguments")}</span>
                <input
                  class="command-launcher__field-input"
                  type="text"
                  placeholder="--flag value"
                  value={input().args}
                  onInput={(e) => patch({ args: e.currentTarget.value })}
                />
                <Show when={fieldErrors().args}>
                  {(msg) => (
                    <span class="command-launcher__field-error">{msg()}</span>
                  )}
                </Show>
              </label>

              <label class="command-launcher__field">
                <span class="command-launcher__field-label">
                  {t("launcher.workingDir")}
                </span>
                <input
                  class="command-launcher__field-input"
                  type="text"
                  placeholder="."
                  value={input().cwd}
                  onInput={(e) => patch({ cwd: e.currentTarget.value })}
                />
                <Show when={fieldErrors().cwd}>
                  {(msg) => (
                    <span class="command-launcher__field-error">{msg()}</span>
                  )}
                </Show>
              </label>

              <label class="command-launcher__field">
                <span class="command-launcher__field-label">
                  {t("launcher.env")}
                </span>
                <textarea
                  class="command-launcher__field-textarea"
                  rows="2"
                  placeholder="FOO=bar"
                  value={input().env}
                  onInput={(e) => patch({ env: e.currentTarget.value })}
                />
                <Show when={fieldErrors().env}>
                  {(msg) => (
                    <span class="command-launcher__field-error">{msg()}</span>
                  )}
                </Show>
              </label>

              <button
                type="submit"
                class="button command-launcher__submit"
                disabled={busy()}
              >
                {busy() ? t("launcher.starting") : t("launcher.startSession")}
              </button>
            </form>

            <Show when={history().recent.length > 0}>
              <p class="command-launcher__history-title">{t("launcher.recent")}</p>
              <ul class="command-launcher__list">
                <For each={history().recent}>
                  {(entry) => (
                    <li>
                      <button
                        type="button"
                        class="command-launcher__history-item"
                        onClick={() => fillFrom(entry)}
                      >
                        {describeCommand(entry)}
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>

            <Show when={history().failed.length > 0}>
              <p class="command-launcher__history-title">{t("launcher.failed")}</p>
              <ul class="command-launcher__list">
                <For each={history().failed}>
                  {(entry) => (
                    <li>
                      <button
                        type="button"
                        class="command-launcher__history-item command-launcher__history-item--failed"
                        onClick={() => fillFrom(entry)}
                      >
                        {describeCommand(entry)}
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>

          {/*
            Plugin command contributions (`ux-command-launcher`). v0 surfaces
            them here read-only: the entries are reserved / non-runnable (no
            execute endpoint exists), independent of project selection.
          */}
          <PluginCommandList active={props.open} />

          <div class="command-launcher__error" aria-live="polite">
            <Show when={error()}>{(err) => <ErrorBanner error={err()} />}</Show>
          </div>
        </div>
      </div>
    </Show>
  );
}
