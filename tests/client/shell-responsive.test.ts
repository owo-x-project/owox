import { describe, expect, it } from "vitest";
import {
  classifyViewport,
  initialWorkspaceState,
  reduceWorkspace,
  SMARTPHONE_MAX_WIDTH,
  TABLET_MAX_WIDTH,
  type WorkspaceState,
} from "../../src/features/shell/state";

function withSelection(projectId: string): WorkspaceState {
  return reduceWorkspace(initialWorkspaceState, {
    type: "selectProject",
    projectId,
  });
}

describe("classifyViewport", () => {
  it("classifies clearly-sized widths", () => {
    expect(classifyViewport(360)).toBe("smartphone");
    expect(classifyViewport(800)).toBe("tablet");
    expect(classifyViewport(1440)).toBe("desktop");
  });

  it("treats the smartphone/tablet boundary as inclusive-lower", () => {
    expect(classifyViewport(SMARTPHONE_MAX_WIDTH - 1)).toBe("smartphone");
    expect(classifyViewport(SMARTPHONE_MAX_WIDTH)).toBe("tablet");
  });

  it("treats the tablet/desktop boundary as inclusive-lower", () => {
    expect(classifyViewport(TABLET_MAX_WIDTH - 1)).toBe("tablet");
    expect(classifyViewport(TABLET_MAX_WIDTH)).toBe("desktop");
  });

  it("handles zero and very large widths", () => {
    expect(classifyViewport(0)).toBe("smartphone");
    expect(classifyViewport(10000)).toBe("desktop");
  });
});

describe("setViewport", () => {
  it("defaults to desktop", () => {
    expect(initialWorkspaceState.viewport).toBe("desktop");
  });

  it("changes the viewport class", () => {
    const next = reduceWorkspace(initialWorkspaceState, {
      type: "setViewport",
      viewport: "smartphone",
    });
    expect(next.viewport).toBe("smartphone");
  });

  it("is a no-op when the viewport is unchanged", () => {
    const next = reduceWorkspace(initialWorkspaceState, {
      type: "setViewport",
      viewport: "desktop",
    });
    expect(next).toBe(initialWorkspaceState);
  });

  it("preserves selected project and active context on resize", () => {
    // Select a project then move it onto the review surface.
    const onReview = reduceWorkspace(withSelection("prj_a"), {
      type: "setSurface",
      surface: "review",
    });

    const resized = reduceWorkspace(onReview, {
      type: "setViewport",
      viewport: "tablet",
    });
    expect(resized.selectedProjectId).toBe("prj_a");
    expect(resized.activeSurface).toBe("review");

    const resizedAgain = reduceWorkspace(resized, {
      type: "setViewport",
      viewport: "smartphone",
    });
    expect(resizedAgain.selectedProjectId).toBe("prj_a");
    expect(resizedAgain.activeSurface).toBe("review");
  });
});

describe("mobile sheets (one-at-a-time)", () => {
  it("starts with no sheet open", () => {
    expect(initialWorkspaceState.activeSheet).toBe("none");
  });

  it("opens a sheet", () => {
    const next = reduceWorkspace(initialWorkspaceState, {
      type: "openSheet",
      sheet: "files",
    });
    expect(next.activeSheet).toBe("files");
  });

  it("opening a second sheet replaces the first (one-at-a-time)", () => {
    const files = reduceWorkspace(initialWorkspaceState, {
      type: "openSheet",
      sheet: "files",
    });
    const review = reduceWorkspace(files, {
      type: "openSheet",
      sheet: "review",
    });
    expect(review.activeSheet).toBe("review");
  });

  it("the palette sheet drives the command launcher overlay flag", () => {
    const palette = reduceWorkspace(initialWorkspaceState, {
      type: "openSheet",
      sheet: "palette",
    });
    expect(palette.activeSheet).toBe("palette");
    expect(palette.commandLauncherOpen).toBe(true);

    // Switching to a non-palette sheet drops the launcher flag.
    const terminal = reduceWorkspace(palette, {
      type: "openSheet",
      sheet: "terminal",
    });
    expect(terminal.activeSheet).toBe("terminal");
    expect(terminal.commandLauncherOpen).toBe(false);
  });

  it("closes the sheet back to the base terminal surface", () => {
    const open = reduceWorkspace(initialWorkspaceState, {
      type: "openSheet",
      sheet: "review",
    });
    const closed = reduceWorkspace(open, { type: "closeSheet" });
    expect(closed.activeSheet).toBe("none");
    expect(closed.commandLauncherOpen).toBe(false);
  });

  it("closeSheet is a no-op when nothing is open", () => {
    const next = reduceWorkspace(initialWorkspaceState, { type: "closeSheet" });
    expect(next).toBe(initialWorkspaceState);
  });

  it("opening a sheet preserves the selected project", () => {
    const next = reduceWorkspace(withSelection("prj_a"), {
      type: "openSheet",
      sheet: "files",
    });
    expect(next.selectedProjectId).toBe("prj_a");
  });
});

describe("editor full-screen (mobile)", () => {
  it("starts closed", () => {
    expect(initialWorkspaceState.editorFullscreen).toBe(false);
  });

  it("opens the full-screen editor", () => {
    const next = reduceWorkspace(initialWorkspaceState, {
      type: "openEditorFullscreen",
    });
    expect(next.editorFullscreen).toBe(true);
  });

  it("openEditorFullscreen is a no-op when already open", () => {
    const open = reduceWorkspace(initialWorkspaceState, {
      type: "openEditorFullscreen",
    });
    const again = reduceWorkspace(open, { type: "openEditorFullscreen" });
    expect(again).toBe(open);
  });

  it("closing returns to the terminal context and clears the sheet", () => {
    // Open files sheet, go full-screen on a non-terminal surface.
    const onReview = reduceWorkspace(withSelection("prj_a"), {
      type: "setSurface",
      surface: "review",
    });
    const filesSheet = reduceWorkspace(onReview, {
      type: "openSheet",
      sheet: "files",
    });
    const fullscreen = reduceWorkspace(filesSheet, {
      type: "openEditorFullscreen",
    });
    expect(fullscreen.editorFullscreen).toBe(true);
    expect(fullscreen.activeSheet).toBe("files");

    const closed = reduceWorkspace(fullscreen, {
      type: "closeEditorFullscreen",
    });
    expect(closed.editorFullscreen).toBe(false);
    expect(closed.activeSheet).toBe("none");
    expect(closed.activeSurface).toBe("terminal");
    // Selection is preserved.
    expect(closed.selectedProjectId).toBe("prj_a");
  });

  it("closeEditorFullscreen is a no-op when already closed", () => {
    const next = reduceWorkspace(initialWorkspaceState, {
      type: "closeEditorFullscreen",
    });
    expect(next).toBe(initialWorkspaceState);
  });
});
