import {
  createEffect,
  createSignal,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import type { ApiClient } from "../../api/client";
import { t } from "../../i18n";
import { ToastContainer } from "../feedback/ToastContainer";
import { NotificationPanel } from "../feedback/NotificationPanel";
import { getUnreadCount } from "../feedback/toast-store";
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
import { SettingsModal } from "./SettingsModal";
import { ShortcutHelp } from "./ShortcutHelp";
import {
  CommandIcon,
  TerminalIcon,
  FilesIcon,
  ReviewIcon,
  BellIcon,
  SettingsIcon,
  SearchIcon,
} from "./icons";
import {
  type ActiveSurface,
  createWorkspaceStore,
} from "./state";
import { useViewport } from "./useViewport";

export interface WorkspaceShellProps {
  api: ApiClient;
}

export function WorkspaceShell(props: WorkspaceShellProps) {
  const ws = createWorkspaceStore();
  const viewport = useViewport();
  const [shortcutHelpOpen, setShortcutHelpOpen] = createSignal(false);
  const [notifPanelOpen, setNotifPanelOpen] = createSignal(false);
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [settingsOpen, setSettingsOpen] = createSignal(false);

  createEffect(() => {
    ws.setViewport(viewport());
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      ws.toggleCommandLauncher();
    }
    if (event.key === "?" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      event.preventDefault();
      setShortcutHelpOpen((prev) => !prev);
    }
  };
  onMount(() => window.addEventListener("keydown", onKeyDown));
  onCleanup(() => window.removeEventListener("keydown", onKeyDown));

  const createSession = async (
    projectId: string,
    request: CreateSessionRequest,
  ): Promise<CreatedSession> => {
    const response = await new TerminalApi(projectId).create(request);
    return response.session;
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div
      class="workspace-shell"
    >
      {/* Activity Bar */}
      <nav class="activity-bar" aria-label="Activity Bar">
        <div class="activity-bar__brand-area">
          <button
            type="button"
            class="activity-bar__btn activity-bar__brand"
            aria-label="owox"
          >
            <CommandIcon size={18} />
          </button>
        </div>

        <div class="activity-bar__search-group">
          <button
            type="button"
            class="activity-bar__btn"
            aria-label={t("launcher.searchPlaceholder")}
            onClick={() => ws.toggleCommandLauncher()}
          >
            <SearchIcon size={18} />
          </button>
        </div>

        <div class="activity-bar__top">
          <button
            type="button"
            class="activity-bar__btn"
            classList={{ "activity-bar__btn--active": ws.state.activeSurface === "terminal" }}
            aria-label={t("terminal.title")}
            disabled={!ws.hasProject()}
            onClick={() => ws.setSurface("terminal")}
          >
            <TerminalIcon size={20} />
          </button>
          <button
            type="button"
            class="activity-bar__btn"
            classList={{ "activity-bar__btn--active": ws.state.activeSurface === "files" }}
            aria-label={t("files.title")}
            disabled={!ws.hasProject()}
            onClick={() => ws.setSurface("files")}
          >
            <FilesIcon size={20} />
          </button>
          <button
            type="button"
            class="activity-bar__btn"
            classList={{ "activity-bar__btn--active": ws.state.activeSurface === "review" }}
            aria-label={t("review.title")}
            disabled={!ws.hasProject()}
            onClick={() => ws.setSurface("review")}
          >
            <ReviewIcon size={20} />
          </button>
        </div>

        <div class="activity-bar__middle">
          <button
            type="button"
            class="activity-bar__project-label"
            aria-label={t("shell.toggleProjectDrawer")}
            onClick={toggleSidebar}
          >
            {ws.state.selectedProjectId ?? t("projects.title")}
          </button>
        </div>

        <div class="activity-bar__bottom">
          <button
            type="button"
            class="activity-bar__btn"
            onClick={() => setNotifPanelOpen((prev) => !prev)}
            aria-label="Notifications"
          >
            <BellIcon size={18} />
            <Show when={getUnreadCount()() > 0}>
              <span class="notification-badge">{getUnreadCount()()}</span>
            </Show>
          </button>
          <button
            type="button"
            class="activity-bar__btn"
            aria-label={t("settings.title")}
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </nav>

      {/* Content area with gradient border */}
      <div class="workspace-content">
        {/* Panels */}
        <div class="workspace-panels">
          <Show when={sidebarOpen()}>
            <aside class="sidebar" aria-label="Project list">
              <ProjectList
                api={props.api}
                selectedProjectId={ws.state.selectedProjectId}
                onSelect={(projectId) => {
                  ws.selectProject(projectId);
                }}
              />
            </aside>
          </Show>

          <main class="main-surface" aria-label="Active surface">
            <Show
              when={ws.state.selectedProjectId}
              fallback={
                <div class="surface-placeholder">
                  <h2 class="surface-placeholder__title">
                    {t("common.noProjectSelected")}
                  </h2>
                  <p class="surface-placeholder__detail">
                    {t("common.selectProject")}
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

          <NotificationPanel
            open={notifPanelOpen()}
            onClose={() => setNotifPanelOpen(false)}
          />
        </div>
      </div>

      {/* Overlays */}
      <CommandLauncher
        open={ws.state.commandLauncherOpen}
        onClose={() => ws.setCommandLauncher(false)}
        projectId={ws.state.selectedProjectId}
        createSession={createSession}
        onSessionCreated={() => {
          ws.setSurface("terminal");
        }}
        onSwitchSurface={(surface) => ws.setSurface(surface)}
        onSelectProject={(pid) => ws.selectProject(pid)}
      />

      <ShortcutHelp
        open={shortcutHelpOpen()}
        onClose={() => setShortcutHelpOpen(false)}
      />

      <SettingsModal
        open={settingsOpen()}
        onClose={() => setSettingsOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
