import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { type IDisposable, Terminal } from "@xterm/xterm";
import type { RendererSize, TerminalRenderer } from "./types";

// NOTE: xterm's CSS is intentionally NOT imported here. It lives in
// renderer.css (imported by the Solid surface), so that constructing this
// class and exercising the factory works under the node test environment,
// which cannot load a `.css` module. The xterm JS modules above are DOM-free
// at import time; only `mount()` / `fit()` touch the DOM.

/**
 * xterm.js baseline renderer (ADR-0003). Mirrors the external-library mounting
 * pattern used by the CodeMirror {@link Editor}: nothing touches the DOM until
 * {@link mount} runs, and everything is released in {@link dispose}.
 *
 * Construction is DOM-free so the renderer factory can be unit-tested under a
 * node (no-DOM) environment.
 */
export class XtermRenderer implements TerminalRenderer {
  private term: Terminal | undefined;
  private fitAddon: FitAddon | undefined;
  private inputCb: ((data: string) => void) | null = null;
  private resizeCb: ((size: RendererSize) => void) | null = null;
  private disposables: IDisposable[] = [];

  mount(el: HTMLElement): void {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      scrollback: 10000,
      allowProposedApi: true,
      // Dark theme aligned with the app's caelestia-inspired tokens
      // (src/styles.css). Kept in sync manually since the renderer cannot read
      // CSS variables at construction.
      theme: {
        background: "#0f1216",
        foreground: "#e6e9ee",
        cursor: "#7aa2f7",
        cursorAccent: "#0f1216",
        selectionBackground: "rgba(122, 162, 247, 0.30)",
        black: "#171b21",
        brightBlack: "#3a434f",
        red: "#f7768e",
        brightRed: "#f7768e",
        green: "#9ece6a",
        brightGreen: "#9ece6a",
        yellow: "#e0af68",
        brightYellow: "#e0af68",
        blue: "#7aa2f7",
        brightBlue: "#7aa2f7",
        magenta: "#bb9af7",
        brightMagenta: "#bb9af7",
        cyan: "#7dcfff",
        brightCyan: "#7dcfff",
        white: "#e6e9ee",
        brightWhite: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(el);

    // Map xterm's input + resize events onto the adapter callbacks. onData
    // covers keystrokes, IME-composed text and paste (delivered as one string).
    this.disposables.push(term.onData((data) => this.inputCb?.(data)));
    this.disposables.push(
      term.onResize((size) =>
        this.resizeCb?.({ cols: size.cols, rows: size.rows }),
      ),
    );

    this.term = term;
    this.fitAddon = fitAddon;
  }

  write(data: string): void {
    this.term?.write(data);
  }

  onInput(cb: (data: string) => void): void {
    this.inputCb = cb;
  }

  onResize(cb: (size: RendererSize) => void): void {
    this.resizeCb = cb;
  }

  resize(size: RendererSize): void {
    this.term?.resize(size.cols, size.rows);
  }

  fit(): RendererSize {
    this.fitAddon?.fit();
    return { cols: this.term?.cols ?? 0, rows: this.term?.rows ?? 0 };
  }

  focus(): void {
    this.term?.focus();
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
    this.term?.dispose();
    this.term = undefined;
    this.fitAddon = undefined;
    this.inputCb = null;
    this.resizeCb = null;
  }
}
