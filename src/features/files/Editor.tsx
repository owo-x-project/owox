import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { Compartment, EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { ErrorBanner } from "../feedback";
import type { ContentResponse, FilesApi } from "./api";
import { type FileError, isConflict, toFileError } from "./errors";
import { detectLanguage, languageExtension } from "./language";

export interface EditorProps {
  api: FilesApi;
  /** Repo-relative path of the open file, or null when none is open. */
  path: string | null;
}

/**
 * Simple CodeMirror 6 editor (`SPEC-ui-editor`): open / edit / save a text file
 * with syntax highlight, no LSP. Tracks the file `version`; Save (Cmd/Ctrl+S or
 * the button) issues a PUT with `expected_version`. On a 409 conflict it does
 * NOT overwrite — it shows a conflict notice and offers reload. Binary files are
 * shown read-only. A dirty-state indicator reflects unsaved changes.
 */
export function Editor(props: EditorProps) {
  let host!: HTMLDivElement;
  let view: EditorView | undefined;
  const language = new Compartment();
  const editable = new Compartment();

  const [version, setVersion] = createSignal<string | null>(null);
  const [kind, setKind] = createSignal<"text" | "binary" | null>(null);
  const [truncated, setTruncated] = createSignal(false);
  const [dirty, setDirty] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal<FileError | null>(null);
  const [conflict, setConflict] = createSignal<FileError | null>(null);
  const [savedAt, setSavedAt] = createSignal<number | null>(null);
  const [langName, setLangName] = createSignal("Plain Text");

  const isBinary = () => kind() === "binary";
  const readOnly = () => isBinary();

  function buildState(doc: string, langId: string, ro: boolean): EditorState {
    return EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        oneDark,
        language.of(languageExtension(langId as never)),
        editable.of(EditorState.readOnly.of(ro)),
        EditorView.editable.of(!ro),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setDirty(true);
            setConflict(null);
          }
        }),
      ],
    });
  }

  function setDoc(content: string, langId: string, ro: boolean) {
    if (!view) {
      return;
    }
    view.setState(buildState(content, langId, ro));
    setDirty(false);
  }

  async function load(path: string) {
    setLoading(true);
    setError(null);
    setConflict(null);
    try {
      const res: ContentResponse = await props.api.content(path);
      const detected = detectLanguage(path);
      setVersion(res.version);
      setKind(res.kind);
      setTruncated(res.truncated);
      setLangName(detected.name);
      setSavedAt(null);
      setDoc(res.content, detected.id, res.kind === "binary");
    } catch (err) {
      setError(toFileError(err));
      setVersion(null);
      setKind(null);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    const path = props.path;
    if (!view || !path || readOnly() || saving()) {
      return;
    }
    setSaving(true);
    setError(null);
    setConflict(null);
    try {
      const content = view.state.doc.toString();
      const res = await props.api.save(path, content, version() ?? undefined);
      setVersion(res.version);
      setDirty(false);
      setSavedAt(Date.now());
    } catch (err) {
      if (isConflict(err)) {
        setConflict(toFileError(err));
      } else {
        setError(toFileError(err));
      }
    } finally {
      setSaving(false);
    }
  }

  onMount(() => {
    view = new EditorView({
      parent: host,
      state: buildState("", "plain", true),
    });
  });

  onCleanup(() => {
    view?.destroy();
    view = undefined;
  });

  // (Re)load whenever the open path changes; clear when none is open.
  createEffect(() => {
    const path = props.path;
    if (path) {
      void load(path);
    } else {
      setVersion(null);
      setKind(null);
      setError(null);
      setConflict(null);
      setDirty(false);
      setDoc("", "plain", true);
    }
  });

  function onKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void save();
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: capturing the Cmd/Ctrl+S save shortcut for the editor pane
    <section class="editor" onKeyDown={onKeyDown}>
      <header class="editor__header">
        <Show
          when={props.path}
          fallback={<span class="muted">No file open</span>}
        >
          {(path) => (
            <span class="editor__path" title={path()}>
              <Show when={dirty()}>
                <span class="editor__dirty" title="unsaved changes" role="img">
                  ●
                </span>
              </Show>
              {path()}
            </span>
          )}
        </Show>
        <span class="editor__meta">
          <Show when={props.path}>
            <span class="badge editor__lang">{langName()}</span>
          </Show>
          <Show when={isBinary()}>
            <span class="badge editor__readonly">binary · read-only</span>
          </Show>
          <Show when={truncated()}>
            <span class="badge editor__truncated">truncated</span>
          </Show>
          <Show when={savedAt()}>
            <span class="muted editor__saved">saved</span>
          </Show>
          <button
            type="button"
            class="button"
            disabled={!props.path || readOnly() || saving() || !dirty()}
            onClick={() => void save()}
          >
            {saving() ? "Saving…" : "Save"}
          </button>
        </span>
      </header>

      <Show when={loading()}>
        <p class="muted editor__state">Loading…</p>
      </Show>

      <Show when={conflict()}>
        {(err) => (
          <div class="editor__conflict" role="alert">
            <ErrorBanner error={err()} />
            <p class="muted editor__conflict-hint">
              The file changed on disk since you opened it. Saving was blocked
              to avoid overwriting those changes.
            </p>
            <button
              type="button"
              class="button"
              onClick={() => props.path && void load(props.path)}
            >
              Reload from disk (discards your edits)
            </button>
          </div>
        )}
      </Show>

      <Show when={error()}>
        {(err) => (
          <div class="editor__error">
            <ErrorBanner error={err()} />
          </div>
        )}
      </Show>

      <Show when={isBinary()}>
        <p class="muted editor__binary">
          Binary file — not shown in the text editor.
        </p>
      </Show>

      <div
        class="editor__cm"
        classList={{ "editor__cm--hidden": isBinary() || !props.path }}
        ref={host}
      />
    </section>
  );
}
