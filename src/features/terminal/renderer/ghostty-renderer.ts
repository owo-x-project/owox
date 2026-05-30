import type { RendererSize, TerminalRenderer } from "./types";

/**
 * ghostty-web prototype seam (ADR-0003).
 *
 * There is no reliable ghostty-web package to depend on yet, so this is a
 * deliberate STUB that implements the {@link TerminalRenderer} contract: it
 * renders a clearly-labelled "not available" notice into the container and its
 * I/O methods are safe no-ops. Its sole purpose is to prove that the adapter
 * seam exists — a real ghostty-web prototype can drop in behind this same
 * interface later and be compared against the xterm baseline on the same
 * WebSocket PTY path. Availability is reported as `false` via
 * `availableRenderers()` so callers (and the prototype checklist) can detect
 * the gap.
 */
export class GhosttyRenderer implements TerminalRenderer {
  static readonly UNAVAILABLE_NOTICE =
    "ghostty-web prototype not available in this build";

  private notice: HTMLElement | undefined;

  mount(el: HTMLElement): void {
    const notice = el.ownerDocument.createElement("div");
    notice.className = "terminal-renderer__unavailable";
    notice.setAttribute("role", "note");
    notice.textContent = GhosttyRenderer.UNAVAILABLE_NOTICE;
    el.appendChild(notice);
    this.notice = notice;
  }

  // I/O is intentionally inert: the stub has no terminal to drive.
  write(_data: string): void {}

  onInput(_cb: (data: string) => void): void {}

  onResize(_cb: (size: RendererSize) => void): void {}

  resize(_size: RendererSize): void {}

  fit(): RendererSize {
    return { cols: 0, rows: 0 };
  }

  focus(): void {}

  dispose(): void {
    this.notice?.remove();
    this.notice = undefined;
  }
}
