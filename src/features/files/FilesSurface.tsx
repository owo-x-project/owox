import {
  type Component,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { t } from "../../i18n";
import { ConfirmDialog } from "../feedback";
import type { SurfaceProps } from "../shell/placeholders";
import { FilesApi } from "./api";
import { Editor } from "./Editor";
import { FileTree } from "./FileTree";
import "./files.css";

/** Minimum tree pane width in pixels. */
const MIN_TREE_WIDTH = 140;
const DEFAULT_TREE_WIDTH = 260;

/**
 * Files surface: composes the lazy {@link FileTree} (left) with a multi-tab
 * {@link Editor} (right) for the selected project. The tree / editor split is
 * draggable. Each open file is a tab; dirty tabs prompt a warning on close.
 */
export const FilesSurface: Component<SurfaceProps> = (props) => {
  const [openPaths, setOpenPaths] = createSignal<string[]>([]);
  const [activeTab, setActiveTab] = createSignal<string | null>(null);
  const [dirtyPaths, setDirtyPaths] = createSignal<Set<string>>(new Set());
  const [closeTarget, setCloseTarget] = createSignal<string | null>(null);
  const [treeWidth, setTreeWidth] = createSignal(DEFAULT_TREE_WIDTH);

  // Rebuild the API (and reset open tabs) whenever the project changes.
  const api = createMemo(() => {
    setOpenPaths([]);
    setActiveTab(null);
    setDirtyPaths(new Set<string>());
    return new FilesApi(props.projectId);
  });

  /**
   * Open a file: if already open, activate its tab. Otherwise add a new tab.
   */
  function openFile(path: string) {
    if (!openPaths().includes(path)) {
      setOpenPaths((prev) => [...prev, path]);
    }
    setActiveTab(path);
  }

  function markDirty(path: string, dirty: boolean) {
    setDirtyPaths((prev) => {
      const next = new Set(prev);
      if (dirty) next.add(path);
      else next.delete(path);
      return next;
    });
  }

  function requestCloseTab(path: string) {
    if (dirtyPaths().has(path)) {
      setCloseTarget(path);
    } else {
      closeTab(path);
    }
  }

  function closeTab(path: string) {
    setDirtyPaths((prev) => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
    setOpenPaths((prev) => {
      const next = prev.filter((p) => p !== path);
      if (activeTab() === path) {
        const idx = prev.indexOf(path);
        setActiveTab(next[Math.min(idx, next.length - 1)] ?? null);
      }
      return next;
    });
  }

  // Drag resize handle
  let containerRef: HTMLDivElement | undefined;

  function onDragStart(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = treeWidth();

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const containerWidth = containerRef?.clientWidth ?? 1000;
      const newWidth = Math.max(MIN_TREE_WIDTH, Math.min(startWidth + delta, containerWidth - MIN_TREE_WIDTH));
      setTreeWidth(newWidth);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function baseName(path: string): string {
    const idx = path.lastIndexOf("/");
    return idx === -1 ? path : path.slice(idx + 1);
  }

  return (
    <div class="files-surface" ref={containerRef}>
      <div class="files-surface__tree" style={{ width: `${treeWidth()}px`, "flex-shrink": 0 }}>
        <FileTree
          api={api()}
          projectId={props.projectId}
          selectedPath={activeTab()}
          onOpenFile={openFile}
        />
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag handle for pane resize */}
      <div class="files-surface__handle" onMouseDown={onDragStart} />
      <div class="files-surface__editor-area">
        <Show when={openPaths().length > 0}>
          <div class="editor-tabs" role="tablist">
            <For each={openPaths()}>
              {(path) => (
                <button
                  type="button"
                  role="tab"
                  class="editor-tab"
                  classList={{ "editor-tab--active": path === activeTab() }}
                  aria-selected={path === activeTab()}
                  onClick={() => setActiveTab(path)}
                >
                  <Show when={dirtyPaths().has(path)}>
                    <span class="editor-tab__dirty" aria-label="unsaved changes">●</span>
                  </Show>
                  <span class="editor-tab__name">{baseName(path)}</span>
                  <span
                    class="editor-tab__close"
                    role="button"
                    aria-label={t("common.close")}
                    onClick={(e) => {
                      e.stopPropagation();
                      requestCloseTab(path);
                    }}
                  >
                    ×
                  </span>
                </button>
              )}
            </For>
          </div>
        </Show>
        <For each={openPaths()}>
          {(path) => (
            <div
              class="editor-tab-panel"
              classList={{ "editor-tab-panel--hidden": path !== activeTab() }}
            >
              <Editor
                api={api()}
                path={path}
                onDirtyChange={(dirty) => markDirty(path, dirty)}
              />
            </div>
          )}
        </For>
        <Show when={openPaths().length === 0}>
          <div class="files-surface__empty">
            <span class="muted">No file open</span>
          </div>
        </Show>
      </div>

      <Show when={closeTarget()}>
        {(target) => (
          <ConfirmDialog
            open
            operation={t("files.closeUnsaved")}
            targets={[target()]}
            onCancel={() => setCloseTarget(null)}
            onConfirm={() => {
              closeTab(target());
              setCloseTarget(null);
            }}
            confirmLabel={t("files.discardClose")}
          />
        )}
      </Show>
    </div>
  );
};
