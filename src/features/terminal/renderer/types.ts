/**
 * Terminal renderer adapter contract (ADR-0003).
 *
 * The renderer is a thin, transport-agnostic surface: it only knows how to
 * draw server output, surface user input, and report its grid size. It has no
 * knowledge of WebSocket / API / session — the wave-2 integration agent wires
 * a concrete {@link TerminalRenderer} to the PTY transport.
 *
 * Two implementations sit behind this contract so they can be compared on the
 * same WebSocket PTY path per ADR-0003: the xterm.js baseline and a
 * ghostty-web prototype seam (currently a stub, since no reliable package
 * exists yet).
 */

/** Which concrete renderer implementation to construct. */
export type RendererKind = "xterm" | "ghostty";

/** Terminal grid size in character cells. */
export interface RendererSize {
  cols: number;
  rows: number;
}

export interface TerminalRenderer {
  /** Attach the renderer to a container element. */
  mount(el: HTMLElement): void;
  /** Write server output (decoded terminal bytes/text) to the screen. */
  write(data: string): void;
  /** Register a callback for user input (keystrokes + paste), as a string. */
  onInput(cb: (data: string) => void): void;
  /** Register a callback fired when the viewport is resized (cols/rows). */
  onResize(cb: (size: RendererSize) => void): void;
  /** Programmatically resize the grid. */
  resize(size: RendererSize): void;
  /** Recompute size from the container and return the new grid size. */
  fit(): RendererSize;
  focus(): void;
  /** Tear down and release all resources. */
  dispose(): void;
}

/** Static description of a renderer implementation for the picker / prototype. */
export interface RendererCapabilities {
  kind: RendererKind;
  available: boolean;
  notes: string;
}
