import { describe, expect, it } from "vitest";
import { GhosttyRenderer } from "../../src/features/terminal/renderer/ghostty-renderer";
import {
  availableRenderers,
  createRenderer,
  DEFAULT_RENDERER,
} from "../../src/features/terminal/renderer/index";
import { XtermRenderer } from "../../src/features/terminal/renderer/xterm-renderer";

// Pure factory / capability logic only — this runs under the node (no-DOM)
// vitest environment. xterm needs a DOM to mount, so we never call mount()/fit()
// here; construction is DOM-free by design (see XtermRenderer / ADR-0003).

describe("createRenderer", () => {
  it("returns the xterm renderer for kind 'xterm'", () => {
    expect(createRenderer("xterm")).toBeInstanceOf(XtermRenderer);
  });

  it("returns the ghostty stub for kind 'ghostty'", () => {
    expect(createRenderer("ghostty")).toBeInstanceOf(GhosttyRenderer);
  });
});

describe("availableRenderers", () => {
  it("reports xterm available and ghostty unavailable", () => {
    const caps = availableRenderers();
    const xterm = caps.find((c) => c.kind === "xterm");
    const ghostty = caps.find((c) => c.kind === "ghostty");

    expect(xterm?.available).toBe(true);
    expect(ghostty?.available).toBe(false);
    expect(ghostty?.notes).toBe(GhosttyRenderer.UNAVAILABLE_NOTICE);
  });

  it("describes exactly the two known renderer kinds", () => {
    expect(
      availableRenderers()
        .map((c) => c.kind)
        .sort(),
    ).toEqual(["ghostty", "xterm"]);
  });
});

describe("DEFAULT_RENDERER", () => {
  it("is the provisional xterm baseline (ghostty is a stub)", () => {
    expect(DEFAULT_RENDERER).toBe("xterm");
  });
});

describe("GhosttyRenderer stub", () => {
  it("has inert no-op I/O that never throws and fit() reports a zero grid", () => {
    const r = new GhosttyRenderer();
    expect(() => {
      r.write("ignored");
      r.onInput(() => {});
      r.onResize(() => {});
      r.resize({ cols: 80, rows: 24 });
      r.focus();
      r.dispose();
    }).not.toThrow();
    expect(r.fit()).toEqual({ cols: 0, rows: 0 });
  });
});
