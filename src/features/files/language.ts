import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import type { Extension } from "@codemirror/state";

/** Identifier for a detected language; "plain" is the no-highlight fallback. */
export type LanguageId =
  | "rust"
  | "javascript"
  | "typescript"
  | "json"
  | "markdown"
  | "html"
  | "css"
  | "python"
  | "plain";

/** A detected language: its id, a human display name, and how to build the
 * CodeMirror extension. The extension is built lazily so the pure detection can
 * be unit tested without instantiating CodeMirror. */
export interface DetectedLanguage {
  id: LanguageId;
  name: string;
}

/** Lower-cased file extension (without dot), or "" when there is none. */
export function extensionOf(path: string): string {
  const name = path.replace(/\/+$/, "").split("/").pop() ?? "";
  const dot = name.lastIndexOf(".");
  if (dot <= 0) {
    return "";
  }
  return name.slice(dot + 1).toLowerCase();
}

const BY_EXTENSION: Record<string, DetectedLanguage> = {
  rs: { id: "rust", name: "Rust" },
  js: { id: "javascript", name: "JavaScript" },
  jsx: { id: "javascript", name: "JavaScript" },
  mjs: { id: "javascript", name: "JavaScript" },
  cjs: { id: "javascript", name: "JavaScript" },
  ts: { id: "typescript", name: "TypeScript" },
  tsx: { id: "typescript", name: "TypeScript" },
  mts: { id: "typescript", name: "TypeScript" },
  cts: { id: "typescript", name: "TypeScript" },
  json: { id: "json", name: "JSON" },
  jsonc: { id: "json", name: "JSON" },
  md: { id: "markdown", name: "Markdown" },
  markdown: { id: "markdown", name: "Markdown" },
  html: { id: "html", name: "HTML" },
  htm: { id: "html", name: "HTML" },
  css: { id: "css", name: "CSS" },
  py: { id: "python", name: "Python" },
};

/**
 * PURE: detect the language for a path/extension. Returns the `plain` fallback
 * for unknown or extension-less paths. Does not build any CodeMirror extension.
 */
export function detectLanguage(path: string): DetectedLanguage {
  return BY_EXTENSION[extensionOf(path)] ?? { id: "plain", name: "Plain Text" };
}

/**
 * Build the CodeMirror language extension for a detected language id. Returns
 * an empty extension array for `plain`. Imports CodeMirror packages, so this is
 * kept separate from {@link detectLanguage} to keep detection pure/testable.
 */
export function languageExtension(id: LanguageId): Extension {
  switch (id) {
    case "rust":
      return rust();
    case "javascript":
      return javascript({ jsx: true });
    case "typescript":
      return javascript({ jsx: true, typescript: true });
    case "json":
      return json();
    case "markdown":
      return markdown();
    case "html":
      return html();
    case "css":
      return css();
    case "python":
      return python();
    default:
      return [];
  }
}
