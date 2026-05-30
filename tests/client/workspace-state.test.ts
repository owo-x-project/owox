import { describe, expect, it } from "vitest";
import {
  DEFAULT_SURFACE,
  initialWorkspaceState,
  reduceWorkspace,
  type WorkspaceState,
} from "../../src/features/shell/state";

function withSelection(projectId: string): WorkspaceState {
  return reduceWorkspace(initialWorkspaceState, {
    type: "selectProject",
    projectId,
  });
}

describe("reduceWorkspace", () => {
  it("starts with no selected project and the default surface", () => {
    expect(initialWorkspaceState.selectedProjectId).toBeNull();
    expect(initialWorkspaceState.activeSurface).toBe(DEFAULT_SURFACE);
  });

  it("selects a project", () => {
    const next = withSelection("prj_a");
    expect(next.selectedProjectId).toBe("prj_a");
  });

  it("resets to the default surface when switching projects", () => {
    const onReview = reduceWorkspace(withSelection("prj_a"), {
      type: "setSurface",
      surface: "review",
    });
    expect(onReview.activeSurface).toBe("review");

    const switched = reduceWorkspace(onReview, {
      type: "selectProject",
      projectId: "prj_b",
    });
    expect(switched.selectedProjectId).toBe("prj_b");
    expect(switched.activeSurface).toBe(DEFAULT_SURFACE);
  });

  it("is a no-op when reselecting the same project", () => {
    const selected = withSelection("prj_a");
    const again = reduceWorkspace(selected, {
      type: "selectProject",
      projectId: "prj_a",
    });
    expect(again).toBe(selected);
  });

  it("clears the selection", () => {
    const cleared = reduceWorkspace(withSelection("prj_a"), {
      type: "clearSelection",
    });
    expect(cleared.selectedProjectId).toBeNull();
  });

  it("keeps exactly one active surface", () => {
    const files = reduceWorkspace(initialWorkspaceState, {
      type: "setSurface",
      surface: "files",
    });
    expect(files.activeSurface).toBe("files");

    const review = reduceWorkspace(files, {
      type: "setSurface",
      surface: "review",
    });
    expect(review.activeSurface).toBe("review");
  });

  it("toggles and sets the left/right drawers independently", () => {
    const leftClosed = reduceWorkspace(initialWorkspaceState, {
      type: "toggleDrawer",
      side: "left",
    });
    expect(leftClosed.leftDrawerOpen).toBe(false);
    expect(leftClosed.rightDrawerOpen).toBe(false);

    const rightOpen = reduceWorkspace(leftClosed, {
      type: "setDrawer",
      side: "right",
      open: true,
    });
    expect(rightOpen.rightDrawerOpen).toBe(true);
    expect(rightOpen.leftDrawerOpen).toBe(false);
  });

  it("toggles the bottom panel and command launcher", () => {
    const panel = reduceWorkspace(initialWorkspaceState, {
      type: "toggleBottomPanel",
    });
    expect(panel.bottomPanelOpen).toBe(true);

    const launcher = reduceWorkspace(panel, {
      type: "toggleCommandLauncher",
    });
    expect(launcher.commandLauncherOpen).toBe(true);
    // bottom panel state preserved.
    expect(launcher.bottomPanelOpen).toBe(true);
  });

  it("falls back to the project list when the selected project is removed", () => {
    const selected = withSelection("prj_a");
    const reconciled = reduceWorkspace(selected, {
      type: "reconcileAvailable",
      availableProjectIds: ["prj_b", "prj_c"],
    });
    expect(reconciled.selectedProjectId).toBeNull();
  });

  it("keeps the selection when it is still available", () => {
    const selected = withSelection("prj_a");
    const reconciled = reduceWorkspace(selected, {
      type: "reconcileAvailable",
      availableProjectIds: ["prj_a", "prj_b"],
    });
    expect(reconciled.selectedProjectId).toBe("prj_a");
  });

  it("does not mutate the input state", () => {
    const frozen = Object.freeze({ ...initialWorkspaceState });
    expect(() =>
      reduceWorkspace(frozen, { type: "selectProject", projectId: "prj_a" }),
    ).not.toThrow();
    expect(frozen.selectedProjectId).toBeNull();
  });
});
