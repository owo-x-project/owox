import { createMemo } from "solid-js";
import { createStore, produce } from "solid-js/store";

/**
 * The central active surface. Exactly one is primary at a time per
 * `SPEC-ui-workspace-shell` ("active surface は同時に 1 つを主表示する").
 */
export type ActiveSurface = "terminal" | "files" | "review";

export const ACTIVE_SURFACES: readonly ActiveSurface[] = [
  "terminal",
  "files",
  "review",
] as const;

/**
 * Default surface for the shell. Mobile also defaults to `terminal`
 * (`SPEC-ui-responsive-webui`).
 */
export const DEFAULT_SURFACE: ActiveSurface = "terminal";

/**
 * Viewport classification (`SPEC-ui-responsive-webui`). `desktop` keeps the
 * pinned drawer layout, `tablet` prefers overlay drawers, `smartphone` uses
 * directional sheets with no persistent bottom navigation.
 */
export type ViewportClass = "desktop" | "tablet" | "smartphone";

/**
 * Breakpoint thresholds (px, width-based). Documented so the responsive layout
 * and the pure {@link classifyViewport} stay in sync:
 *   - width < 640  → smartphone
 *   - width < 1024 → tablet
 *   - else         → desktop
 */
export const SMARTPHONE_MAX_WIDTH = 640;
export const TABLET_MAX_WIDTH = 1024;

/**
 * Pure, DOM-independent viewport classifier. Boundaries are inclusive-lower:
 * `640` is the first tablet width, `1024` the first desktop width.
 */
export function classifyViewport(width: number): ViewportClass {
  if (width < SMARTPHONE_MAX_WIDTH) {
    return "smartphone";
  }
  if (width < TABLET_MAX_WIDTH) {
    return "tablet";
  }
  return "desktop";
}

/**
 * The single primary sheet/modal on smartphone (`SPEC-ui-responsive-webui`,
 * `ux-mobile-bottom-shell`). `none` means the base terminal surface is showing.
 * At most one of these is open at a time.
 *   - terminal → bottom sheet
 *   - files    → left sheet
 *   - review   → right sheet
 *   - palette  → top modal (the command launcher)
 */
export type ActiveSheet = "none" | "terminal" | "files" | "review" | "palette";

export interface WorkspaceState {
  /** Selected project id, or null when no project is bound to the shell. */
  selectedProjectId: string | null;
  /** The single primary surface shown in the central area. */
  activeSurface: ActiveSurface;
  /** Left drawer (hosts project list + file tree slot). */
  leftDrawerOpen: boolean;
  /** Right drawer (hosts Git / review auxiliary). */
  rightDrawerOpen: boolean;
  /** Bottom transient panel. */
  bottomPanelOpen: boolean;
  /** Command launcher overlay. */
  commandLauncherOpen: boolean;
  /** Current viewport classification (`SPEC-ui-responsive-webui`). */
  viewport: ViewportClass;
  /**
   * The single primary sheet/modal on smartphone. `none` shows the base
   * terminal surface. Only one sheet is open at a time.
   */
  activeSheet: ActiveSheet;
  /**
   * Whether the file editor is shown full-screen on smartphone after a file is
   * opened. Closing it returns to the terminal context.
   */
  editorFullscreen: boolean;
}

export const initialWorkspaceState: WorkspaceState = {
  selectedProjectId: null,
  activeSurface: DEFAULT_SURFACE,
  leftDrawerOpen: true,
  rightDrawerOpen: false,
  bottomPanelOpen: false,
  commandLauncherOpen: false,
  viewport: "desktop",
  activeSheet: "none",
  editorFullscreen: false,
};

export type WorkspaceAction =
  | { type: "selectProject"; projectId: string }
  | { type: "clearSelection" }
  | { type: "setSurface"; surface: ActiveSurface }
  | { type: "toggleDrawer"; side: "left" | "right" }
  | { type: "setDrawer"; side: "left" | "right"; open: boolean }
  | { type: "toggleBottomPanel" }
  | { type: "setBottomPanel"; open: boolean }
  | { type: "toggleCommandLauncher" }
  | { type: "setCommandLauncher"; open: boolean }
  /**
   * Update the viewport classification. Per `SPEC-ui-responsive-webui` this
   * must NOT clear the selected project or active surface/context.
   */
  | { type: "setViewport"; viewport: ViewportClass }
  /**
   * Open a smartphone sheet/modal. Enforces the one-at-a-time invariant: any
   * currently-open sheet is replaced. Opening any sheet leaves the editor
   * full-screen state untouched except `files`, which is what hosts the editor.
   */
  | { type: "openSheet"; sheet: ActiveSheet }
  /** Close the current sheet/modal (back to the base terminal surface). */
  | { type: "closeSheet" }
  /** Open the full-screen editor (smartphone, after a file is opened). */
  | { type: "openEditorFullscreen" }
  /** Close the full-screen editor and return to the terminal context. */
  | { type: "closeEditorFullscreen" }
  /**
   * Reconcile the shell with the currently-available project ids. If the
   * selected project is no longer available the shell falls back to the
   * project list (selection cleared) per `SPEC-ui-project-list`:
   * "selected project が失われた場合、workspace shell は project list に戻る".
   */
  | { type: "reconcileAvailable"; availableProjectIds: readonly string[] };

/**
 * Pure reducer for the workspace shell. Side-effect free and DOM independent so
 * it can be unit-tested directly (vitest env is "node").
 */
export function reduceWorkspace(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case "selectProject":
      if (action.projectId === state.selectedProjectId) {
        return state;
      }
      // Switching projects resets the primary surface to the default so the
      // shell never shows a surface bound to a previous project.
      return {
        ...state,
        selectedProjectId: action.projectId,
        activeSurface: DEFAULT_SURFACE,
      };

    case "clearSelection":
      if (state.selectedProjectId === null) {
        return state;
      }
      return { ...state, selectedProjectId: null };

    case "setSurface":
      if (action.surface === state.activeSurface) {
        return state;
      }
      return { ...state, activeSurface: action.surface };

    case "toggleDrawer":
      return action.side === "left"
        ? { ...state, leftDrawerOpen: !state.leftDrawerOpen }
        : { ...state, rightDrawerOpen: !state.rightDrawerOpen };

    case "setDrawer":
      return action.side === "left"
        ? { ...state, leftDrawerOpen: action.open }
        : { ...state, rightDrawerOpen: action.open };

    case "toggleBottomPanel":
      return { ...state, bottomPanelOpen: !state.bottomPanelOpen };

    case "setBottomPanel":
      return { ...state, bottomPanelOpen: action.open };

    case "toggleCommandLauncher":
      return { ...state, commandLauncherOpen: !state.commandLauncherOpen };

    case "setCommandLauncher":
      return { ...state, commandLauncherOpen: action.open };

    case "setViewport":
      if (action.viewport === state.viewport) {
        return state;
      }
      // Viewport change must preserve selection + active context: only the
      // viewport class changes here.
      return { ...state, viewport: action.viewport };

    case "openSheet": {
      if (action.sheet === state.activeSheet) {
        return state;
      }
      // One sheet at a time: opening any sheet replaces the current one. The
      // command palette also reuses the launcher overlay flag so desktop ⌘K
      // and the mobile top modal stay consistent.
      return {
        ...state,
        activeSheet: action.sheet,
        commandLauncherOpen: action.sheet === "palette",
      };
    }

    case "closeSheet":
      if (state.activeSheet === "none" && !state.commandLauncherOpen) {
        return state;
      }
      return { ...state, activeSheet: "none", commandLauncherOpen: false };

    case "openEditorFullscreen":
      if (state.editorFullscreen) {
        return state;
      }
      return { ...state, editorFullscreen: true };

    case "closeEditorFullscreen":
      if (!state.editorFullscreen) {
        return state;
      }
      // Returning from the full-screen editor lands back on the terminal
      // context (base surface), closing any open sheet.
      return {
        ...state,
        editorFullscreen: false,
        activeSheet: "none",
        activeSurface: "terminal",
      };

    case "reconcileAvailable": {
      if (state.selectedProjectId === null) {
        return state;
      }
      if (action.availableProjectIds.includes(state.selectedProjectId)) {
        return state;
      }
      // Selected project disappeared: fall back to the project list.
      return { ...state, selectedProjectId: null };
    }

    default:
      return state;
  }
}

/**
 * Thin Solid wrapper around {@link reduceWorkspace}. Keeps a reactive store and
 * exposes `dispatch` plus convenience action helpers for components.
 */
export function createWorkspaceStore(
  initial: WorkspaceState = initialWorkspaceState,
) {
  const [state, setState] = createStore<WorkspaceState>({ ...initial });

  const dispatch = (action: WorkspaceAction): void => {
    setState(
      produce((draft) => {
        const next = reduceWorkspace(draft as WorkspaceState, action);
        Object.assign(draft, next);
      }),
    );
  };

  const hasProject = createMemo(() => state.selectedProjectId !== null);

  return {
    state,
    dispatch,
    hasProject,
    selectProject: (projectId: string) =>
      dispatch({ type: "selectProject", projectId }),
    clearSelection: () => dispatch({ type: "clearSelection" }),
    setSurface: (surface: ActiveSurface) =>
      dispatch({ type: "setSurface", surface }),
    toggleDrawer: (side: "left" | "right") =>
      dispatch({ type: "toggleDrawer", side }),
    toggleBottomPanel: () => dispatch({ type: "toggleBottomPanel" }),
    toggleCommandLauncher: () => dispatch({ type: "toggleCommandLauncher" }),
    setCommandLauncher: (open: boolean) =>
      dispatch({ type: "setCommandLauncher", open }),
    setViewport: (viewport: ViewportClass) =>
      dispatch({ type: "setViewport", viewport }),
    openSheet: (sheet: ActiveSheet) => dispatch({ type: "openSheet", sheet }),
    closeSheet: () => dispatch({ type: "closeSheet" }),
    openEditorFullscreen: () => dispatch({ type: "openEditorFullscreen" }),
    closeEditorFullscreen: () => dispatch({ type: "closeEditorFullscreen" }),
    reconcileAvailable: (availableProjectIds: readonly string[]) =>
      dispatch({ type: "reconcileAvailable", availableProjectIds }),
  };
}

export type WorkspaceStore = ReturnType<typeof createWorkspaceStore>;
