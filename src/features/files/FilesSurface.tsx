import { type Component, createMemo, createSignal } from "solid-js";
import type { SurfaceProps } from "../shell/placeholders";
import { FilesApi } from "./api";
import { Editor } from "./Editor";
import { FileTree } from "./FileTree";
import "./files.css";

/**
 * Files surface: composes the lazy {@link FileTree} (left) with the
 * {@link Editor} (right) for the selected project. Owns its own data loading via
 * a per-project {@link FilesApi}. This is the component the shell mounts into the
 * Files active surface; it implements the shared `Component<SurfaceProps>`.
 */
export const FilesSurface: Component<SurfaceProps> = (props) => {
  const [openPath, setOpenPath] = createSignal<string | null>(null);

  // Rebuild the API (and reset the open file) whenever the project changes.
  const api = createMemo(() => {
    setOpenPath(null);
    return new FilesApi(props.projectId);
  });

  return (
    <div class="files-surface">
      <div class="files-surface__tree">
        <FileTree
          api={api()}
          projectId={props.projectId}
          selectedPath={openPath()}
          onOpenFile={setOpenPath}
        />
      </div>
      <div class="files-surface__editor">
        <Editor api={api()} path={openPath()} />
      </div>
    </div>
  );
};
