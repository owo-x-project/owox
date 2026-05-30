import { createSignal, For, Show } from "solid-js";
import { ConfirmDialog, ErrorBanner } from "../feedback";
import type { FilesApi } from "./api";
import { type FileError, toFileError } from "./errors";
import {
  createRoot,
  type FlatNode,
  findNode,
  flatten,
  insertChildren,
  needsLoad,
  type TreeNode,
  toggleExpand,
} from "./tree-model";

export interface FileTreeProps {
  api: FilesApi;
  projectId: string;
  selectedPath: string | null;
  onOpenFile: (path: string) => void;
}

type Pending =
  | { mode: "new-file"; parent: string }
  | { mode: "new-folder"; parent: string }
  | { mode: "rename"; path: string }
  | { mode: "delete"; path: string };

/**
 * Lazy file tree (`SPEC-ui-file-tree`). Directories load their children on first
 * expand. Supports file/folder create, rename, and delete; delete is gated by a
 * destructive confirmation step that derives the server confirm token. Repo
 * boundary / permission / not-found errors are surfaced via the shared
 * error-display contract.
 */
export function FileTree(props: FileTreeProps) {
  const [root, setRoot] = createSignal<TreeNode>(createRoot());
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal<FileError | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [pending, setPending] = createSignal<Pending | null>(null);
  const [draft, setDraft] = createSignal("");

  const rows = (): FlatNode[] => flatten(root());

  async function loadDir(path: string) {
    setError(null);
    try {
      const listing = await props.api.tree(path);
      setRoot((current) => insertChildren(current, path, listing.entries));
    } catch (err) {
      setError(toFileError(err));
      throw err;
    }
  }

  async function ensureRoot() {
    if (loaded()) {
      return;
    }
    try {
      await loadDir("");
      setLoaded(true);
    } catch {
      // error already surfaced by loadDir
    }
  }

  void ensureRoot();

  async function onToggle(node: FlatNode) {
    if (node.kind !== "dir") {
      return;
    }
    const target = findNode(root(), node.path);
    if (target && needsLoad(target)) {
      try {
        await loadDir(node.path);
      } catch {
        return;
      }
    }
    setRoot((current) => toggleExpand(current, node.path));
  }

  function startPending(next: Pending) {
    setError(null);
    setPending(next);
    setDraft(next.mode === "rename" ? baseSegment(next.path) : "");
  }

  function cancelPending() {
    setPending(null);
    setDraft("");
  }

  /** Refresh a directory listing after a mutation so the tree reflects it. */
  async function refresh(dirPath: string) {
    try {
      await loadDir(dirPath);
    } catch {
      // error already surfaced
    }
  }

  async function submitPending() {
    const current = pending();
    if (!current || busy()) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (current.mode === "new-file" || current.mode === "new-folder") {
        const name = draft().trim();
        if (!name) {
          setBusy(false);
          return;
        }
        const path = joinPath(current.parent, name);
        await props.api.create(
          path,
          current.mode === "new-file" ? "file" : "dir",
          current.mode === "new-file" ? "" : undefined,
        );
        await refresh(current.parent);
        cancelPending();
        if (current.mode === "new-file") {
          props.onOpenFile(path);
        }
      } else if (current.mode === "rename") {
        const name = draft().trim();
        if (!name) {
          setBusy(false);
          return;
        }
        const parent = parentOf(current.path);
        const target = joinPath(parent, name);
        const node = findNode(root(), current.path);
        await props.api.rename(current.path, target, node?.version);
        await refresh(parent);
        cancelPending();
      } else {
        // delete: confirmation already shown; send the derived token.
        const parent = parentOf(current.path);
        await props.api.remove(current.path);
        await refresh(parent);
        cancelPending();
      }
    } catch (err) {
      setError(toFileError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="file-tree">
      <header class="file-tree__header">
        <h2 class="file-tree__title">Files</h2>
        <div class="file-tree__actions">
          <button
            type="button"
            class="button button--icon"
            title="New file in root"
            aria-label="New file in root"
            disabled={busy()}
            onClick={() => startPending({ mode: "new-file", parent: "" })}
          >
            +F
          </button>
          <button
            type="button"
            class="button button--icon"
            title="New folder in root"
            aria-label="New folder in root"
            disabled={busy()}
            onClick={() => startPending({ mode: "new-folder", parent: "" })}
          >
            +D
          </button>
        </div>
      </header>

      <Show when={error()}>
        {(err) => (
          <div class="file-tree__error">
            <ErrorBanner error={err()} />
          </div>
        )}
      </Show>

      <Show
        when={loaded()}
        fallback={
          <Show when={!error()}>
            <p class="muted file-tree__state">Loading files…</p>
          </Show>
        }
      >
        <Show
          when={rows().length > 0}
          fallback={<p class="muted file-tree__state">Empty repository.</p>}
        >
          <ul class="file-tree__list">
            <For each={rows()}>
              {(node) => (
                <FileTreeRow
                  node={node}
                  selected={node.path === props.selectedPath}
                  busy={busy()}
                  onToggle={() => void onToggle(node)}
                  onOpen={() => props.onOpenFile(node.path)}
                  onNewFile={() =>
                    startPending({ mode: "new-file", parent: node.path })
                  }
                  onNewFolder={() =>
                    startPending({ mode: "new-folder", parent: node.path })
                  }
                  onRename={() =>
                    startPending({ mode: "rename", path: node.path })
                  }
                  onDelete={() =>
                    startPending({ mode: "delete", path: node.path })
                  }
                />
              )}
            </For>
          </ul>
        </Show>
      </Show>

      <Show when={pending()}>
        {(p) => (
          <Show
            when={p().mode !== "delete"}
            fallback={
              <ConfirmDialog
                open
                operation="Delete file"
                project={props.projectId}
                targets={[deletePath(p())]}
                phrase={deletePath(p())}
                confirmLabel="Delete"
                onCancel={cancelPending}
                onConfirm={() => void submitPending()}
              />
            }
          >
            <PendingDialog
              pending={p()}
              draft={draft()}
              busy={busy()}
              onInput={setDraft}
              onCancel={cancelPending}
              onSubmit={() => void submitPending()}
            />
          </Show>
        )}
      </Show>
    </section>
  );
}

function FileTreeRow(props: {
  node: FlatNode;
  selected: boolean;
  busy: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const isDir = () => props.node.kind === "dir";
  return (
    <li>
      <div
        class="file-tree__row"
        classList={{ "file-tree__row--selected": props.selected }}
        style={{ "padding-left": `${(props.node.depth - 1) * 14 + 8}px` }}
      >
        <button
          type="button"
          class="file-tree__label"
          onClick={() => (isDir() ? props.onToggle() : props.onOpen())}
        >
          <span class="file-tree__icon" aria-hidden="true">
            {isDir() ? (props.node.expanded ? "▾" : "▸") : "·"}
          </span>
          <span class="file-tree__kind" aria-hidden="true">
            {isDir() ? "📁" : "📄"}
          </span>
          <span class="file-tree__name">{props.node.name}</span>
        </button>
        <span class="file-tree__row-actions">
          <Show when={isDir()}>
            <button
              type="button"
              class="button button--icon file-tree__action"
              title="New file"
              aria-label={`New file in ${props.node.name}`}
              disabled={props.busy}
              onClick={props.onNewFile}
            >
              +F
            </button>
            <button
              type="button"
              class="button button--icon file-tree__action"
              title="New folder"
              aria-label={`New folder in ${props.node.name}`}
              disabled={props.busy}
              onClick={props.onNewFolder}
            >
              +D
            </button>
          </Show>
          <button
            type="button"
            class="button button--icon file-tree__action"
            title="Rename"
            aria-label={`Rename ${props.node.name}`}
            disabled={props.busy}
            onClick={props.onRename}
          >
            ✎
          </button>
          <button
            type="button"
            class="button button--icon file-tree__action file-tree__action--danger"
            title="Delete"
            aria-label={`Delete ${props.node.name}`}
            disabled={props.busy}
            onClick={props.onDelete}
          >
            🗑
          </button>
        </span>
      </div>
    </li>
  );
}

function PendingDialog(props: {
  pending: Pending;
  draft: string;
  busy: boolean;
  onInput: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const title = () => {
    switch (props.pending.mode) {
      case "new-file":
        return "New file";
      case "new-folder":
        return "New folder";
      default:
        return "Rename";
    }
  };

  return (
    <div class="file-tree__dialog" role="dialog" aria-label={title()}>
      <h3 class="file-tree__dialog-title">{title()}</h3>
      <form
        class="file-tree__dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit();
        }}
      >
        <input
          type="text"
          class="file-tree__input"
          autofocus
          value={props.draft}
          placeholder="name"
          disabled={props.busy}
          onInput={(event) => props.onInput(event.currentTarget.value)}
        />
        <div class="file-tree__dialog-buttons">
          <button
            type="button"
            class="button button--ghost"
            disabled={props.busy}
            onClick={props.onCancel}
          >
            Cancel
          </button>
          <button type="submit" class="button" disabled={props.busy}>
            Confirm
          </button>
        </div>
      </form>
    </div>
  );
}

function deletePath(pending: Pending): string {
  return pending.mode === "delete" ? pending.path : "";
}

function baseSegment(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash === -1 ? path : path.slice(slash + 1);
}

function parentOf(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash === -1 ? "" : path.slice(0, slash);
}

function joinPath(parent: string, name: string): string {
  return parent ? `${parent}/${name}` : name;
}
