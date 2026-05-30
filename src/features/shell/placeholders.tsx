import type { Component } from "solid-js";

/**
 * Contract every central active-surface component implements. Wave 2 replaces
 * the placeholders below with the real terminal / files / review surfaces; each
 * real surface receives the currently-selected `projectId`.
 */
export interface SurfaceProps {
  projectId: string;
}

function ComingSoon(props: { title: string; detail: string }) {
  return (
    <div class="surface-placeholder">
      <h2 class="surface-placeholder__title">{props.title}</h2>
      <p class="surface-placeholder__detail">{props.detail}</p>
      <span class="badge">coming soon</span>
    </div>
  );
}

/* MOUNT: <Terminal surface> — Phase 03. Replace with the real terminal surface
   component implementing SurfaceProps. Files surface (src/features/files) and
   the log view baseline (src/features/log) are already mounted in the shell. */
export const TerminalSurfacePlaceholder: Component<SurfaceProps> = (props) => (
  <ComingSoon
    title="Terminal"
    detail={`Terminal sessions for project ${props.projectId} arrive in Phase 03.`}
  />
);
