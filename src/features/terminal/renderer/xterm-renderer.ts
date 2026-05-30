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
  private resizeObserver: ResizeObserver | null = null;
  private scrollback: number;

  constructor(scrollback?: number) {
    this.scrollback = scrollback ?? getTerminalScrollback();
  }

  mount(el: HTMLElement): void {
    // Read owox theme tokens from CSS custom properties so the terminal
    // respects light/dark theme switching at runtime.
    const style = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) =>
      style.getPropertyValue(name).trim() || fallback;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      scrollback: this.scrollback,
      allowProposedApi: true,
      theme: {
        background: v("--owox-bg", "#0f1216"),
        foreground: v("--owox-text", "#e6e9ee"),
        cursor: v("--owox-accent", "#7aa2f7"),
        cursorAccent: v("--owox-bg", "#0f1216"),
        selectionBackground: "rgba(122, 162, 247, 0.30)",
        black: v("--owox-surface", "#171b21"),
        brightBlack: v("--owox-border-strong", "#3a434f"),
        red: v("--owox-danger", "#f7768e"),
        brightRed: v("--owox-danger", "#f7768e"),
        green: v("--owox-success", "#9ece6a"),
        brightGreen: v("--owox-success", "#9ece6a"),
        yellow: v("--owox-warning", "#e0af68"),
        brightYellow: v("--owox-warning", "#e0af68"),
        blue: v("--owox-accent", "#7aa2f7"),
        brightBlue: v("--owox-accent", "#7aa2f7"),
        magenta: "#bb9af7",
        brightMagenta: "#bb9af7",
        cyan: "#7dcfff",
        brightCyan: "#7dcfff",
        white: v("--owox-text", "#e6e9ee"),
        brightWhite: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(el);

    // Defer the initial fit so the container has settled its layout.
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

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

    // Auto-fit when the container element is resized, debounced to prevent
    // infinite resize loops (e.g. when split panes trigger cascading layout).
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    this.resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        this.fitAddon?.fit();
      }, 50);
    });
    this.resizeObserver.observe(el);
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
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
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

/** Default terminal scrollback line count. */
export const DEFAULT_SCROLLBACK = 3000;

const SCROLLBACK_KEY = "owox:terminalScrollback";

/** Read the user-configured scrollback value from localStorage. */
export function getTerminalScrollback(): number {
  if (typeof localStorage === "undefined") return DEFAULT_SCROLLBACK;
  const stored = localStorage.getItem(SCROLLBACK_KEY);
  if (stored) {
    const n = Number.parseInt(stored, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_SCROLLBACK;
}

/** Persist the scrollback setting to localStorage. */
export function setTerminalScrollback(value: number): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    SCROLLBACK_KEY,
    String(Math.max(100, Math.floor(value))),
  );
}
