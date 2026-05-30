import { GhosttyRenderer } from "./ghostty-renderer";
import type {
  RendererCapabilities,
  RendererKind,
  TerminalRenderer,
} from "./types";
import { XtermRenderer } from "./xterm-renderer";

export type {
  RendererCapabilities,
  RendererKind,
  RendererSize,
  TerminalRenderer,
} from "./types";
export {
  DEFAULT_SCROLLBACK,
  getTerminalScrollback,
  setTerminalScrollback,
} from "./xterm-renderer";

/**
 * Provisional default renderer. xterm.js is the stable baseline; ghostty-web is
 * only a stub seam today, so xterm is the default. This default is PROVISIONAL
 * pending the prototype comparison required by ADR-0003 (see
 * PROTOTYPE-CHECKLIST.md) — the final choice is made after measuring both on
 * the same WebSocket PTY path.
 */
export const DEFAULT_RENDERER: RendererKind = "xterm";

/** Construct the concrete renderer for the given kind. */
export function createRenderer(kind: RendererKind): TerminalRenderer {
  switch (kind) {
    case "xterm":
      return new XtermRenderer();
    case "ghostty":
      return new GhosttyRenderer();
  }
}

/**
 * Static capabilities of each renderer, for a picker UI and the ADR-0003
 * prototype comparison. ghostty-web reports `available: false` until a real
 * prototype replaces the stub.
 */
export function availableRenderers(): RendererCapabilities[] {
  return [
    {
      kind: "xterm",
      available: true,
      notes: "xterm.js baseline with fit + web-links addons; stable default.",
    },
    {
      kind: "ghostty",
      available: false,
      notes: GhosttyRenderer.UNAVAILABLE_NOTICE,
    },
  ];
}
