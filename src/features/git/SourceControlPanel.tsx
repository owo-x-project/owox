import { createMemo, createSignal, For, Show } from "solid-js";
import { t } from "../../i18n";
import { ConfirmDialog, ErrorBanner } from "../feedback";
import type { GitBranchesResponse, GitOp, GitStatusResponse } from "./api";
import { checkoutToken, discardToken } from "./api";
import type { GitError } from "./errors";
import {
  canCommit,
  changesPaths,
  type DiffSelection,
  type GroupedFile,
  groupStatus,
  isDirty,
  type OperationState,
  type SelectionGroup,
  type StatusGroups,
  stagedPaths,
} from "./status-model";

export interface SourceControlPanelProps {
  projectId: string;
  status: GitStatusResponse | undefined;
  branches: GitBranchesResponse | undefined;
  /** Loading / error state for the status + branches resources. */
  loading: boolean;
  loadError: GitError | null;
  /** Recent write-op result / error (success vs. typed error). */
  opState: OperationState;
  /** True while a write op is in flight (disables actions). */
  busy: boolean;
  selection: DiffSelection | null;
  onSelect: (selection: DiffSelection) => void;
  /**
   * Send a Git operation. The panel supplies the derived confirm_token for
   * destructive ops; non-destructive ops omit it.
   */
  onOperation: (body: {
    op: GitOp;
    paths?: string[];
    message?: string;
    branch?: string;
    confirmToken?: string;
  }) => void;
  /** Clear the commit message after a successful commit. */
  commitMessage: string;
  onCommitMessage: (value: string) => void;
}

type Pending =
  | { kind: "discard"; paths: string[] }
  | { kind: "branch_checkout"; branch: string };

const STATE_GLYPH: Record<GroupedFile["state"], string> = {
  modified: "M",
  added: "A",
  deleted: "D",
  renamed: "R",
  untracked: "U",
  conflicted: "!",
};

/**
 * VS Code-style Source Control panel (`SPEC-git-workflow`). Composes the branch
 * header (current branch + ahead/behind + branch picker with checkout/create),
 * remote sync actions, the grouped changed-file list with per-file
 * stage/unstage/discard plus stage-all/unstage-all, and the commit box.
 *
 * Destructive ops (discard always; dirty-tree branch checkout) route through a
 * confirmation step mirroring the file-tree delete UX before the op is sent
 * with its derived confirm_token. All errors render via the shared
 * error-display contract; conflict / auth / network kinds are visually
 * distinguished by the kind badge plus a per-kind hint.
 */
export function SourceControlPanel(props: SourceControlPanelProps) {
  const groups = createMemo<StatusGroups>(() =>
    groupStatus(props.status?.files ?? []),
  );
  const dirty = createMemo(() => isDirty(props.status));
  const [pending, setPending] = createSignal<Pending | null>(null);
  const [newBranch, setNewBranch] = createSignal("");

  const commitEnabled = createMemo(
    () => !props.busy && canCommit(groups(), props.commitMessage),
  );

  function selected(path: string, group: SelectionGroup): boolean {
    return props.selection?.path === path && props.selection?.group === group;
  }

  function startDiscard(paths: string[]) {
    setPending({ kind: "discard", paths });
  }

  function requestCheckout(branch: string) {
    if (branch === props.branches?.current) {
      return;
    }
    if (dirty()) {
      // Dirty-tree checkout is destructive → confirm first.
      setPending({ kind: "branch_checkout", branch });
    } else {
      props.onOperation({ op: "branch_checkout", branch });
    }
  }

  function confirmPending() {
    const p = pending();
    if (!p) {
      return;
    }
    if (p.kind === "discard") {
      props.onOperation({
        op: "discard",
        paths: p.paths,
        confirmToken: discardToken(props.projectId, p.paths),
      });
    } else {
      props.onOperation({
        op: "branch_checkout",
        branch: p.branch,
        confirmToken: checkoutToken(props.projectId, p.branch),
      });
    }
    setPending(null);
  }

  function cancelPending() {
    setPending(null);
  }

  function createBranch() {
    const name = newBranch().trim();
    if (!name || props.busy) {
      return;
    }
    props.onOperation({ op: "branch_create", branch: name });
    setNewBranch("");
  }

  const remoteOps: { op: GitOp; labelKey: string }[] = [
    { op: "fetch", labelKey: "review.fetch" },
    { op: "pull", labelKey: "review.pull" },
    { op: "push", labelKey: "review.push" },
    { op: "sync", labelKey: "review.sync" },
  ];

  return (
    <section class="git-panel" aria-label="Source Control">
      <header class="git-panel__branch">
        <div class="git-panel__branch-info">
          <span class="git-panel__branch-icon" aria-hidden="true">
            ⎇
          </span>
          <span class="git-panel__branch-name">
            {props.branches?.current ?? props.status?.branch ?? "—"}
          </span>
          <Show when={props.status}>
            {(status) => (
              <span class="git-panel__tracking muted">
                <span title="commits ahead of upstream">↑{status().ahead}</span>
                <span title="commits behind upstream">↓{status().behind}</span>
              </span>
            )}
          </Show>
          <Show when={props.loading}>
            <span class="muted git-panel__loading">…</span>
          </Show>
        </div>

        <div class="git-panel__branch-picker">
          <select
            class="git-panel__select"
            aria-label="Checkout branch"
            disabled={props.busy || !props.branches}
            value={props.branches?.current ?? ""}
            onChange={(event) => {
              requestCheckout(event.currentTarget.value);
            }}
          >
            <For each={props.branches?.branches ?? []}>
              {(branch) => (
                <option value={branch.name}>
                  {branch.name}
                  {branch.remote ? " (remote)" : ""}
                </option>
              )}
            </For>
          </select>
          <form
            class="git-panel__new-branch"
            onSubmit={(event) => {
              event.preventDefault();
              createBranch();
            }}
          >
            <input
              type="text"
              class="git-panel__input"
              placeholder={t("review.newBranch")}
              aria-label={t("review.newBranch")}
              value={newBranch()}
              disabled={props.busy}
              onInput={(event) => setNewBranch(event.currentTarget.value)}
            />
            <button
              type="submit"
              class="button button--ghost"
              disabled={props.busy || newBranch().trim() === ""}
            >
              {t("review.create")}
            </button>
          </form>
        </div>
      </header>

      <div class="git-panel__sync">
        <For each={remoteOps}>
          {(remote) => (
            <button
              type="button"
              class="button button--ghost"
              disabled={props.busy}
              onClick={() => props.onOperation({ op: remote.op })}
            >
              {t(remote.labelKey)}
            </button>
          )}
        </For>
      </div>

      <Show when={props.loadError}>
        {(err) => (
          <div class="git-panel__error">
            <ErrorBanner error={err()} />
          </div>
        )}
      </Show>

      <Show when={props.opState.error}>
        {(err) => (
          <div class="git-panel__error">
            <ErrorBanner error={err()} />
          </div>
        )}
      </Show>

      <Show when={props.opState.outcome}>
        {(outcome) => (
          <p class="git-panel__op-ok" role="status">
            {outcome().op} ok
            <Show when={outcome().message}>
              {(message) => <span class="muted"> — {message()}</span>}
            </Show>
          </p>
        )}
      </Show>

      <div class="git-panel__commit">
        <textarea
          class="git-panel__commit-message"
          rows={2}
          placeholder={t("review.commitPlaceholder")}
          aria-label={t("review.commitMessage")}
          value={props.commitMessage}
          disabled={props.busy}
          onInput={(event) => props.onCommitMessage(event.currentTarget.value)}
        />
        <button
          type="button"
          class="button git-panel__commit-button"
          disabled={!commitEnabled()}
          onClick={() =>
            props.onOperation({
              op: "commit",
              message: props.commitMessage,
            })
          }
        >
          {t("review.commit")}
        </button>
      </div>

      <FileGroup
        title={t("review.conflicts")}
        modifier="conflicted"
        files={groups().conflicted}
        busy={props.busy}
        selected={(path) => selected(path, "conflicted")}
        onSelect={(path) => props.onSelect({ path, group: "conflicted" })}
      />

      <FileGroup
        title={t("review.stagedChanges")}
        modifier="staged"
        files={groups().staged}
        busy={props.busy}
        bulk={
          groups().staged.length > 0
            ? {
                label: t("review.unstageAll"),
                onClick: () =>
                  props.onOperation({
                    op: "unstage",
                    paths: stagedPaths(groups()),
                  }),
              }
            : undefined
        }
        selected={(path) => selected(path, "staged")}
        onSelect={(path) => props.onSelect({ path, group: "staged" })}
        rowAction={(file) => ({
          label: t("review.unstage"),
          glyph: "−",
          onClick: () =>
            props.onOperation({ op: "unstage", paths: [file.path] }),
        })}
      />

      <FileGroup
        title={t("review.changes")}
        modifier="changes"
        files={groups().changes}
        busy={props.busy}
        bulk={
          changesPaths(groups()).length > 0
            ? {
                label: t("review.stageAll"),
                onClick: () =>
                  props.onOperation({
                    op: "stage",
                    paths: changesPaths(groups()),
                  }),
              }
            : undefined
        }
        bulkDanger={
          changesPaths(groups()).length > 0
            ? {
                label: t("review.discardAll"),
                onClick: () => startDiscard(changesPaths(groups())),
              }
            : undefined
        }
        selected={(path) => selected(path, "changes")}
        onSelect={(path) => props.onSelect({ path, group: "changes" })}
        rowAction={(file) => ({
          label: t("review.stage"),
          glyph: "+",
          onClick: () => props.onOperation({ op: "stage", paths: [file.path] }),
        })}
        rowDiscard={(file) => startDiscard([file.path])}
      />

      <FileGroup
        title={t("review.untracked")}
        modifier="untracked"
        files={groups().untracked}
        busy={props.busy}
        selected={(path) => selected(path, "untracked")}
        onSelect={(path) => props.onSelect({ path, group: "untracked" })}
        rowAction={(file) => ({
          label: t("review.stage"),
          glyph: "+",
          onClick: () => props.onOperation({ op: "stage", paths: [file.path] }),
        })}
        rowDiscard={(file) => startDiscard([file.path])}
      />

      <Show when={pending()}>
        {(p) => (
          <ConfirmDialog
            open
            operation={
              p().kind === "discard"
                ? t("review.discardChanges")
                : t("review.switchBranch")
            }
            project={props.projectId}
            targets={
              p().kind === "discard"
                ? (p() as { kind: "discard"; paths: string[] }).paths
                : [(p() as { kind: "branch_checkout"; branch: string }).branch]
            }
            phrase={p().kind === "discard" ? "discard" : "checkout"}
            confirmLabel={
              p().kind === "discard"
                ? t("review.discard")
                : t("review.switchBranch")
            }
            onCancel={cancelPending}
            onConfirm={confirmPending}
          />
        )}
      </Show>
    </section>
  );
}

interface RowAction {
  label: string;
  glyph: string;
  onClick: () => void;
}

function FileGroup(props: {
  title: string;
  modifier: string;
  files: GroupedFile[];
  busy: boolean;
  bulk?: { label: string; onClick: () => void };
  bulkDanger?: { label: string; onClick: () => void };
  selected: (path: string) => boolean;
  onSelect: (path: string) => void;
  rowAction?: (file: GroupedFile) => RowAction;
  rowDiscard?: (file: GroupedFile) => void;
}) {
  return (
    <Show when={props.files.length > 0}>
      <section class={`git-group git-group--${props.modifier}`}>
        <header class="git-group__header">
          <h3 class="git-group__title">
            {props.title}
            <span class="git-group__count muted"> {props.files.length}</span>
          </h3>
          <div class="git-group__header-actions">
            <Show when={props.bulk}>
              {(bulk) => (
                <button
                  type="button"
                  class="button button--ghost git-group__bulk"
                  disabled={props.busy}
                  onClick={() => bulk().onClick()}
                >
                  {bulk().label}
                </button>
              )}
            </Show>
            <Show when={props.bulkDanger}>
              {(danger) => (
                <button
                  type="button"
                  class="button button--ghost git-group__bulk git-group__bulk--danger"
                  disabled={props.busy}
                  onClick={() => danger().onClick()}
                >
                  {danger().label}
                </button>
              )}
            </Show>
          </div>
        </header>
        <ul class="git-group__list">
          <For each={props.files}>
            {(file) => (
              <li
                class="git-row"
                classList={{ "git-row--selected": props.selected(file.path) }}
              >
                <button
                  type="button"
                  class="git-row__label"
                  onClick={() => props.onSelect(file.path)}
                >
                  <span
                    class={`git-row__state git-row__state--${file.state}`}
                    aria-hidden="true"
                  >
                    {STATE_GLYPH[file.state]}
                  </span>
                  <span class="git-row__path" title={file.path}>
                    {file.path}
                  </span>
                </button>
                <span class="git-row__actions">
                  <Show when={props.rowAction}>
                    {(action) => (
                      <button
                        type="button"
                        class="button button--icon"
                        title={action()(file).label}
                        aria-label={`${action()(file).label} ${file.path}`}
                        disabled={props.busy}
                        onClick={() => action()(file).onClick()}
                      >
                        {action()(file).glyph}
                      </button>
                    )}
                  </Show>
                  <Show when={props.rowDiscard}>
                    {(discard) => (
                      <button
                        type="button"
                        class="button button--icon git-row__action--danger"
                        title={t("review.discardChanges")}
                        aria-label={`${t("review.discard")} ${file.path}`}
                        disabled={props.busy}
                        onClick={() => discard()(file)}
                      >
                        ⤺
                      </button>
                    )}
                  </Show>
                </span>
              </li>
            )}
          </For>
        </ul>
      </section>
    </Show>
  );
}
