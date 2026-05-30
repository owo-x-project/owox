import {
  createEffect,
  For,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import type { ApiClient } from "../../api/client";
import { FilesSurface } from "../files";
import { ReviewSurface } from "../git";
import { ProjectList } from "../projects/ProjectList";
import {
  type CreatedSession,
  type CreateSessionRequest,
  TerminalApi,
  TerminalSurface,
} from "../terminal";
import { CommandLauncher } from "./CommandLauncher";
import { Sheet } from "./Sheet";
import {
  ACTIVE_SURFACES,
  type ActiveSurface,
  createWorkspaceStore,
} from "./state";
import { useViewport } from "./useViewport";

const SURFACE_LABELS: Record<ActiveSurface, string> = {
  terminal: "Terminal",
  files: "Files",
  review: "Review",
};

export interface WorkspaceShellProps {
  api: ApiClient;
}

/**
 * Top-level workspace shell (`SPEC-ui-workspace-shell` + responsive behaviour
 * in `SPEC-ui-responsive-webui`).
 *
 * Desktop / tablet keep the top status bar, left/right drawers, central active
 * surface and bottom transient panel. Tablet defaults its drawers closed
 * (overlay) to preserve surface width; desktop pins them. Exactly one active
 * surface is primary at a time and the shell is always bound to at most one
 * selected project.
 *
 * Smartphone has NO persistent bottom navigation. The terminal is the base
 * surface; files / review / terminal are directional sheets (left / right /
 * bottom) and the command palette is a top modal — all invoked from compact
 * status-bar icon buttons. Only one sheet/modal is primary at a time. Opening a
 * file makes the files sheet full-screen so the editor (inside FilesSurface)
 * fills the viewport; a "back to terminal" affordance closes it and returns to
 * the terminal context.
 */
export function WorkspaceShell(props: WorkspaceShellProps) {
  const ws = createWorkspaceStore();
  const viewport = useViewport();

  const isMobile = () => ws.state.viewport === "smartphone";

  // Keep the store's viewport in sync with the live signal without ever
  // clearing the selected project / active context (`SPEC-ui-responsive-webui`).
  createEffect(() => {
    ws.setViewport(viewport());
  });

  // Cmd/Ctrl+K opens the command launcher (`ux-command-launcher`).
  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      ws.toggleCommandLauncher();
    }
  };
  onMount(() => window.addEventListener("keydown", onKeyDown));
  onCleanup(() => window.removeEventListener("keydown", onKeyDown));

  // Create a terminal session for a project (used by the command launcher).
  const createSession = async (
    projectId: string,
    request: CreateSessionRequest,
  ): Promise<CreatedSession> => {
    const response = await new TerminalApi(projectId).create(request);
    return response.session;
  };

  return (
    <div
      class="workspace-shell"
      classList={{
        "workspace-shell--left-open": ws.state.leftDrawerOpen,
        "workspace-shell--right-open": ws.state.rightDrawerOpen,
        "workspace-shell--bottom-open": ws.state.bottomPanelOpen,
        [`workspace-shell--${ws.state.viewport}`]: true,
      }}
    >
      <header class="status-bar">
        <div class="status-bar__group">
          <Show
            when={isMobile()}
            fallback={
              <button
                type="button"
                class="button button--icon"
                aria-label="Toggle project drawer"
                aria-pressed={ws.state.leftDrawerOpen}
                onClick={() => ws.toggleDrawer("left")}
              >
                ☰
              </button>
            }
          >
            <button
              type="button"
              class="button button--icon"
              aria-label="Open files"
              aria-pressed={ws.state.activeSheet === "files"}
              disabled={!ws.hasProject()}
              onClick={() => ws.openSheet("files")}
            >
              🗂
            </button>
          </Show>
          <span class="status-bar__brand">owox</span>
          <span class="status-bar__project">
            <Show when={ws.hasProject()} fallback="No project selected">
              {ws.state.selectedProjectId}
            </Show>
          </span>
        </div>

        <Show when={!isMobile()}>
          <nav class="surface-switcher" aria-label="Active surface">
            <For each={ACTIVE_SURFACES}>
              {(surface) => (
                <button
                  type="button"
                  class="surface-switcher__tab"
                  classList={{
                    "surface-switcher__tab--active":
                      ws.state.activeSurface === surface,
                  }}
                  aria-pressed={ws.state.activeSurface === surface}
                  disabled={!ws.hasProject()}
                  onClick={() => ws.setSurface(surface)}
                >
                  {SURFACE_LABELS[surface]}
                </button>
              )}
            </For>
          </nav>
        </Show>

        <div class="status-bar__group">
          <Show
            when={isMobile()}
            fallback={
              <>
                <button
                  type="button"
                  class="button button--ghost"
                  onClick={() => ws.setCommandLauncher(true)}
                >
                  Command (⌘K)
                </button>
                <button
                  type="button"
                  class="button button--icon"
                  aria-label="Toggle review drawer"
                  aria-pressed={ws.state.rightDrawerOpen}
                  onClick={() => ws.toggleDrawer("right")}
                >
                  ⌥
                </button>
              </>
            }
          >
            {/* Mobile affordances: no bottom nav — each sheet opens from here. */}
            <button
              type="button"
              class="button button--icon"
              aria-label="Open command palette"
              aria-pressed={ws.state.activeSheet === "palette"}
              onClick={() => ws.openSheet("palette")}
            >
              ⌘
            </button>
            <button
              type="button"
              class="button button--icon"
              aria-label="Open terminal sheet"
              aria-pressed={ws.state.activeSheet === "terminal"}
              disabled={!ws.hasProject()}
              onClick={() => ws.openSheet("terminal")}
            >
              ⌶
            </button>
            <button
              type="button"
              class="button button--icon"
              aria-label="Open review"
              aria-pressed={ws.state.activeSheet === "review"}
              disabled={!ws.hasProject()}
              onClick={() => ws.openSheet("review")}
            >
              ⎇
            </button>
          </Show>
        </div>
      </header>

      <Switch>
        {/* ----------------------------------------- desktop / tablet layout */}
        <Match when={!isMobile()}>
          <div class="workspace-body">
            <Show when={ws.state.leftDrawerOpen}>
              <aside class="drawer drawer--left" aria-label="Left drawer">
                <ProjectList
                  api={props.api}
                  selectedProjectId={ws.state.selectedProjectId}
                  onSelect={(projectId) => ws.selectProject(projectId)}
                />
                {/* MOUNT: file tree slot — bound to the selected project. */}
              </aside>
            </Show>

            <main class="active-surface" aria-label="Active surface">
              <Show
                when={ws.state.selectedProjectId}
                fallback={
                  <div class="surface-placeholder">
                    <h2 class="surface-placeholder__title">
                      No project selected
                    </h2>
                    <p class="surface-placeholder__detail">
                      Select a project from the left drawer to open its
                      workspace.
                    </p>
                  </div>
                }
              >
                {(projectId) => (
                  <Switch>
                    <Match when={ws.state.activeSurface === "terminal"}>
                      <TerminalSurface projectId={projectId()} />
                    </Match>
                    <Match when={ws.state.activeSurface === "files"}>
                      <FilesSurface projectId={projectId()} />
                    </Match>
                    <Match when={ws.state.activeSurface === "review"}>
                      <ReviewSurface projectId={projectId()} />
                    </Match>
                  </Switch>
                )}
              </Show>
            </main>

            <Show when={ws.state.rightDrawerOpen}>
              <aside class="drawer drawer--right" aria-label="Right drawer">
                <div class="surface-placeholder">
                  <p class="surface-placeholder__detail muted">
                    Git / review auxiliary panel — coming soon.
                  </p>
                </div>
              </aside>
            </Show>
          </div>

          <Show when={ws.state.bottomPanelOpen}>
            <section class="bottom-panel" aria-label="Transient panel">
              <div class="bottom-panel__inner muted">
                Transient panel — coming soon.
              </div>
            </section>
          </Show>

          <button
            type="button"
            class="bottom-panel__toggle"
            aria-pressed={ws.state.bottomPanelOpen}
            onClick={() => ws.toggleBottomPanel()}
          >
            {ws.state.bottomPanelOpen ? "Hide panel" : "Show panel"}
          </button>
        </Match>

        {/* ------------------------------------------------ smartphone layout */}
        <Match when={isMobile()}>
          {/* Base surface is always the terminal (`ux-mobile-bottom-shell`). */}
          <main class="active-surface active-surface--mobile-base">
            <Show
              when={ws.state.selectedProjectId}
              fallback={
                <ProjectList
                  api={props.api}
                  selectedProjectId={ws.state.selectedProjectId}
                  onSelect={(projectId) => ws.selectProject(projectId)}
                />
              }
            >
              {(projectId) => <TerminalSurface projectId={projectId()} />}
            </Show>
          </main>

          {/* terminal → bottom sheet */}
          <Sheet
            open={ws.state.activeSheet === "terminal"}
            direction="bottom"
            label="Terminal"
            onClose={() => ws.closeSheet()}
          >
            <div class="sheet__body">
              <Show when={ws.state.selectedProjectId}>
                {(projectId) => <TerminalSurface projectId={projectId()} />}
              </Show>
            </div>
          </Sheet>

          {/* files → left sheet (full-screen so the editor fills the viewport) */}
          <Sheet
            open={ws.state.activeSheet === "files"}
            direction="left"
            label="Files"
            fullscreen
            onClose={() => ws.closeSheet()}
          >
            <div class="sheet__header">
              <button
                type="button"
                class="button button--ghost"
                onClick={() => {
                  ws.closeEditorFullscreen();
                  ws.closeSheet();
                }}
              >
                ‹ Back to terminal
              </button>
            </div>
            <div class="sheet__body">
              <Show when={ws.state.selectedProjectId}>
                {(projectId) => <FilesSurface projectId={projectId()} />}
              </Show>
            </div>
          </Sheet>

          {/* Git / review → right sheet */}
          <Sheet
            open={ws.state.activeSheet === "review"}
            direction="right"
            label="Review"
            fullscreen
            onClose={() => ws.closeSheet()}
          >
            <div class="sheet__header">
              <button
                type="button"
                class="button button--ghost"
                onClick={() => ws.closeSheet()}
              >
                ‹ Back to terminal
              </button>
            </div>
            <div class="sheet__body">
              <Show when={ws.state.selectedProjectId}>
                {(projectId) => <ReviewSurface projectId={projectId()} />}
              </Show>
            </div>
          </Sheet>
        </Match>
      </Switch>

      {/*
        Command palette = top modal on every viewport. On mobile the palette
        sheet drives `commandLauncherOpen` via openSheet; closing it clears the
        sheet flag too.
      */}
      <CommandLauncher
        open={ws.state.commandLauncherOpen}
        onClose={() => {
          if (ws.state.activeSheet === "palette") {
            ws.closeSheet();
          } else {
            ws.setCommandLauncher(false);
          }
        }}
        projectId={ws.state.selectedProjectId}
        createSession={createSession}
        onSessionCreated={() => {
          ws.setSurface("terminal");
          if (isMobile()) {
            ws.closeSheet();
          }
        }}
      />
    </div>
  );
}
