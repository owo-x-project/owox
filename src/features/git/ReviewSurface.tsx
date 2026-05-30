import {
  type Component,
  createMemo,
  createResource,
  createSignal,
  Match,
  Show,
  Switch,
} from "solid-js";
import { t } from "../../i18n";
import { LogView } from "../log";
import type { SurfaceProps } from "../shell/placeholders";
import {
  GitApi,
  type GitDiffMode,
  type GitOp,
  type GitOperationRequest,
} from "./api";
import { CommitLog } from "./CommitLog";
import { DiffView } from "./diff";
import { type GitError, toGitError } from "./errors";
import { SourceControlPanel } from "./SourceControlPanel";
import {
  type DiffSelection,
  diffModeFor,
  emptyOperationState,
  type OperationState,
  withError,
  withOutcome,
} from "./status-model";
import "./git.css";

type ReviewTab = "working-tree" | "history";

interface OperationInput {
  op: GitOp;
  paths?: string[];
  message?: string;
  branch?: string;
  confirmToken?: string;
}

/**
 * Git review active surface (`SPEC-git-workflow`, `SPEC-ui-diff-view`). Composes
 * the {@link SourceControlPanel} (status / staging / commit / branch / sync)
 * with the {@link DiffView} for the selected file, and an operation log.
 *
 * It owns all data loading: status + branches load together (keyed off a
 * refresh counter so any write op re-reads them), and the diff loads for the
 * selected file using `staged` / `unstaged` mode depending on which group the
 * file was selected from. `onLoadMore` fetches the next byte window of a
 * truncated diff and appends it. After every write op the status, branches and
 * open diff are re-read so the UI reflects the new working-tree state.
 */
export const ReviewSurface: Component<SurfaceProps> = (props) => {
  const api = createMemo(() => new GitApi(props.projectId));

  const [activeTab, setActiveTab] = createSignal<ReviewTab>("working-tree");
  const [refreshKey, setRefreshKey] = createSignal(0);
  const [busy, setBusy] = createSignal(false);
  const [opState, setOpState] = createSignal<OperationState>(
    emptyOperationState(),
  );
  const [lastLogRef, setLastLogRef] = createSignal<string | null>(null);
  const [selection, setSelection] = createSignal<DiffSelection | null>(null);
  const [commitMessage, setCommitMessage] = createSignal("");

  // Status + branches load together and re-read on every refresh bump.
  const [statusBundle] = createResource(
    () => ({ pid: props.projectId, key: refreshKey() }),
    async (source) => {
      const client = new GitApi(source.pid);
      const [status, branches] = await Promise.all([
        client.status(),
        client.branches(),
      ]);
      return { status, branches };
    },
  );

  const loadError = createMemo<GitError | null>(() => {
    const err = statusBundle.error;
    return err ? toGitError(err) : null;
  });

  // Diff for the selected file, re-read whenever selection or refresh changes.
  const [diffResource, { mutate: mutateDiff }] = createResource(
    () => {
      const sel = selection();
      if (!sel) {
        return null;
      }
      return { sel, key: refreshKey(), pid: props.projectId };
    },
    async (source) => {
      const client = new GitApi(source.pid);
      const mode = diffModeFor(source.sel.group);
      return client.diff(mode, source.sel.path, 0);
    },
  );

  const diffError = createMemo<GitError | null>(() => {
    const err = diffResource.error;
    return err ? toGitError(err) : null;
  });

  // Append the next byte window of a truncated diff (manual large-diff load).
  async function loadMoreDiff() {
    const current = diffResource();
    const sel = selection();
    if (!current?.truncated || !sel) {
      return;
    }
    const mode: GitDiffMode = diffModeFor(sel.group);
    try {
      const next = await api().diff(mode, sel.path, current.patch.length);
      mutateDiff({
        ...next,
        patch: current.patch + next.patch,
      });
    } catch {
      // Surfaced on next refresh; the partial diff stays visible.
    }
  }

  async function runOperation(input: OperationInput) {
    if (busy()) {
      return;
    }
    setBusy(true);
    setOpState(emptyOperationState());
    const body: GitOperationRequest = { op: input.op };
    if (input.paths) {
      body.paths = input.paths;
    }
    if (input.message !== undefined) {
      body.message = input.message;
    }
    if (input.branch !== undefined) {
      body.branch = input.branch;
    }
    if (input.confirmToken !== undefined) {
      body.confirm_token = input.confirmToken;
    }
    try {
      const result = await api().operation(body);
      setOpState(
        withOutcome({
          op: input.op,
          message: result.message ?? null,
          logRef: result.log_ref ?? null,
        }),
      );
      setLastLogRef(result.log_ref ?? null);
      if (input.op === "commit") {
        setCommitMessage("");
      }
    } catch (err) {
      setOpState(withError(toGitError(err)));
    } finally {
      setBusy(false);
      // Re-read status + branches + open diff after every write op.
      setRefreshKey((key) => key + 1);
    }
  }

  return (
    <div class="review-surface">
      <div class="review-tabs">
        <button
          type="button"
          class="review-tabs__tab"
          classList={{
            "review-tabs__tab--active": activeTab() === "working-tree",
          }}
          onClick={() => setActiveTab("working-tree")}
        >
          {t("review.workingTree")}
        </button>
        <button
          type="button"
          class="review-tabs__tab"
          classList={{ "review-tabs__tab--active": activeTab() === "history" }}
          onClick={() => setActiveTab("history")}
        >
          {t("review.history")}
        </button>
      </div>

      <Switch>
        <Match when={activeTab() === "working-tree"}>
          <div class="git-review">
            <div class="git-review__panel">
              <SourceControlPanel
                projectId={props.projectId}
                status={statusBundle()?.status}
                branches={statusBundle()?.branches}
                loading={statusBundle.loading}
                loadError={loadError()}
                opState={opState()}
                busy={busy()}
                selection={selection()}
                onSelect={setSelection}
                onOperation={(body) => void runOperation(body)}
                commitMessage={commitMessage()}
                onCommitMessage={setCommitMessage}
              />
            </div>

            <div class="git-review__diff">
              <Show
                when={selection()}
                fallback={
                  <p class="muted git-review__diff-empty">
                    {t("review.selectFile")}
                  </p>
                }
              >
                {(sel) => (
                  <>
                    <p class="git-review__diff-head muted">
                      {sel().path}
                      <span class="git-review__diff-mode">
                        {diffModeFor(sel().group)}
                      </span>
                    </p>
                    <DiffView
                      patch={diffResource()?.patch ?? ""}
                      binary={diffResource()?.binary ?? false}
                      truncated={diffResource()?.truncated ?? false}
                      loading={diffResource.loading}
                      error={
                        diffError()
                          ? {
                              kind: diffError()?.kind ?? "unknown",
                              message: diffError()?.message ?? "",
                              nextAction: diffError()?.nextAction,
                            }
                          : null
                      }
                      summary={diffResource()?.summary}
                      onLoadMore={() => void loadMoreDiff()}
                    />
                  </>
                )}
              </Show>

              <Show when={lastLogRef()}>
                {(logRef) => (
                  <div class="git-review__log">
                    <LogView logId={logRef()} />
                  </div>
                )}
              </Show>
            </div>
          </div>
        </Match>

        <Match when={activeTab() === "history"}>
          <CommitLog projectId={props.projectId} />
        </Match>
      </Switch>
    </div>
  );
};
