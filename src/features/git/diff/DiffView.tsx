import { createMemo, createSignal, For, Show } from "solid-js";
import "./diff.css";
import {
  type DiffFile,
  type DiffLine,
  type DiffStatus,
  parseUnifiedDiff,
} from "./parse";

/** Error shape following `SPEC-shared-error-display` (kind / message /
 * next_action). Raw stderr / stack traces are never passed here or rendered. */
export interface DiffViewError {
  kind: string;
  message: string;
  nextAction?: string | null;
}

export interface DiffViewProps {
  /** Raw unified diff patch (may be ""). */
  patch: string;
  /** Server flagged this content as binary. */
  binary?: boolean;
  /** Layout: single column ("unified", default) or side-by-side ("split"). */
  mode?: "unified" | "split";
  /** Server truncated a large diff; show a "Load more" affordance. */
  truncated?: boolean;
  loading?: boolean;
  error?: DiffViewError | null;
  /** Called when the user asks to load the rest of a truncated diff. */
  onLoadMore?: () => void;
  /** Optional pre-computed summary shown above the body (large-diff first). */
  summary?: { files: number; additions: number; deletions: number };
}

const STATUS_LABEL: Record<DiffStatus, string> = {
  modified: "modified",
  added: "added",
  deleted: "deleted",
  renamed: "renamed",
  binary: "binary",
};

/**
 * Presentational diff view (`SPEC-ui-diff-view`). Takes raw unified-diff patch
 * text plus metadata via props and renders it — it does NOT fetch anything; the
 * Source Control panel supplies the patch.
 *
 * States: loading; error (error-display contract — never a raw stack); empty
 * ("No changes"); per-file binary ("Binary file — diff not shown"); and a
 * scrollable monospace hunk view with old+new line-number gutters and
 * +/-/context coloring. A unified ↔ split toggle switches layout. When the
 * server truncated a large diff, a summary is shown first and the body is
 * loaded manually via `onLoadMore` (large diffs are never auto-loaded in full).
 */
export function DiffView(props: DiffViewProps) {
  const [mode, setMode] = createSignal<"unified" | "split">(
    props.mode ?? "unified",
  );

  const files = createMemo<DiffFile[]>(() =>
    props.binary ? [] : parseUnifiedDiff(props.patch),
  );

  const isEmpty = createMemo(
    () => !props.binary && props.patch.trim() === "" && !props.summary,
  );

  return (
    <section class="diff-view">
      <header class="diff-view__header">
        <span class="diff-view__title">Diff</span>
        <Show when={props.summary}>
          {(summary) => (
            <span class="diff-view__summary muted">
              {summary().files} file{summary().files === 1 ? "" : "s"}
              <span class="diff-view__stat diff-view__stat--add">
                +{summary().additions}
              </span>
              <span class="diff-view__stat diff-view__stat--del">
                -{summary().deletions}
              </span>
            </span>
          )}
        </Show>
        <span class="diff-view__modes">
          <button
            type="button"
            class="button button--ghost"
            classList={{ "diff-view__mode--active": mode() === "unified" }}
            onClick={() => setMode("unified")}
          >
            Unified
          </button>
          <button
            type="button"
            class="button button--ghost"
            classList={{ "diff-view__mode--active": mode() === "split" }}
            onClick={() => setMode("split")}
          >
            Split
          </button>
        </span>
      </header>

      <Show when={props.loading}>
        <p class="diff-view__state muted">Loading diff…</p>
      </Show>

      <Show when={!props.loading && props.error}>
        {(error) => <DiffErrorDisplay error={error()} />}
      </Show>

      <Show when={!props.loading && !props.error && props.binary}>
        <p class="diff-view__state muted">Binary file — diff not shown.</p>
      </Show>

      <Show when={!props.loading && !props.error && !props.binary}>
        <Show when={isEmpty()}>
          <p class="diff-view__state muted">No changes.</p>
        </Show>

        <div class="diff-view__body">
          <For each={files()}>
            {(file) => <FileDiff file={file} mode={mode()} />}
          </For>
        </div>

        <Show when={props.truncated}>
          <footer class="diff-view__footer">
            <span class="muted diff-view__truncated-note">
              Large diff — only part of it was loaded.
            </span>
            <button
              type="button"
              class="button"
              onClick={() => props.onLoadMore?.()}
            >
              Load more
            </button>
          </footer>
        </Show>
      </Show>
    </section>
  );
}

function FileDiff(props: { file: DiffFile; mode: "unified" | "split" }) {
  const file = () => props.file;
  const heading = () => {
    const f = file();
    if (f.status === "renamed" && f.oldPath && f.newPath) {
      return `${f.oldPath} → ${f.newPath}`;
    }
    return f.newPath ?? f.oldPath ?? "(unknown)";
  };

  return (
    <article class="diff-file">
      <header class="diff-file__header">
        <span class={`diff-file__status diff-file__status--${file().status}`}>
          {STATUS_LABEL[file().status]}
        </span>
        <span class="diff-file__path" title={heading()}>
          {heading()}
        </span>
        <span class="diff-file__stats">
          <span class="diff-view__stat diff-view__stat--add">
            +{file().additions}
          </span>
          <span class="diff-view__stat diff-view__stat--del">
            -{file().deletions}
          </span>
        </span>
      </header>

      <Show when={file().binary}>
        <p class="diff-file__binary muted">Binary file — diff not shown.</p>
      </Show>

      <Show when={!file().binary && file().hunks.length === 0}>
        <p class="diff-file__binary muted">No textual changes.</p>
      </Show>

      <Show when={!file().binary && file().hunks.length > 0}>
        <Show
          when={props.mode === "split"}
          fallback={<UnifiedBody file={file()} />}
        >
          <SplitBody file={file()} />
        </Show>
      </Show>
    </article>
  );
}

function UnifiedBody(props: { file: DiffFile }) {
  return (
    <div class="diff-table diff-table--unified">
      <For each={props.file.hunks}>
        {(hunk) => (
          <>
            <div class="diff-row diff-row--hunk">
              <span class="diff-gutter" />
              <span class="diff-gutter" />
              <span class="diff-code">{hunk.header}</span>
            </div>
            <For each={hunk.lines}>
              {(line) => (
                <Show when={line.kind !== "meta"}>
                  <div class={`diff-row diff-row--${line.kind}`}>
                    <span class="diff-gutter">{line.oldLine ?? ""}</span>
                    <span class="diff-gutter">{line.newLine ?? ""}</span>
                    <span class="diff-code">
                      <span class="diff-sign">{signFor(line.kind)}</span>
                      {line.text}
                    </span>
                  </div>
                </Show>
              )}
            </For>
          </>
        )}
      </For>
    </div>
  );
}

function SplitBody(props: { file: DiffFile }) {
  return (
    <div class="diff-table diff-table--split">
      <For each={props.file.hunks}>
        {(hunk) => (
          <>
            <div class="diff-row diff-row--hunk">
              <span class="diff-gutter" />
              <span class="diff-code">{hunk.header}</span>
              <span class="diff-gutter" />
              <span class="diff-code">{hunk.header}</span>
            </div>
            <For each={pairLines(hunk.lines)}>
              {(pair) => (
                <div class="diff-row diff-row--split">
                  <span
                    class={`diff-gutter diff-gutter--${pair.left ? pair.left.kind : "empty"}`}
                  >
                    {pair.left?.oldLine ?? ""}
                  </span>
                  <span
                    class={`diff-code diff-code--${pair.left ? pair.left.kind : "empty"}`}
                  >
                    {pair.left?.text ?? ""}
                  </span>
                  <span
                    class={`diff-gutter diff-gutter--${pair.right ? pair.right.kind : "empty"}`}
                  >
                    {pair.right?.newLine ?? ""}
                  </span>
                  <span
                    class={`diff-code diff-code--${pair.right ? pair.right.kind : "empty"}`}
                  >
                    {pair.right?.text ?? ""}
                  </span>
                </div>
              )}
            </For>
          </>
        )}
      </For>
    </div>
  );
}

interface LinePair {
  left: DiffLine | null;
  right: DiffLine | null;
}

/** Pair up hunk lines for side-by-side display: context goes on both sides,
 * a run of deletions is zipped against the following run of additions. */
function pairLines(lines: DiffLine[]): LinePair[] {
  const pairs: LinePair[] = [];
  const dels: DiffLine[] = [];
  const adds: DiffLine[] = [];

  const flush = () => {
    const count = Math.max(dels.length, adds.length);
    for (let i = 0; i < count; i += 1) {
      pairs.push({ left: dels[i] ?? null, right: adds[i] ?? null });
    }
    dels.length = 0;
    adds.length = 0;
  };

  for (const line of lines) {
    if (line.kind === "meta") {
      continue;
    }
    if (line.kind === "del") {
      dels.push(line);
    } else if (line.kind === "add") {
      adds.push(line);
    } else {
      flush();
      pairs.push({ left: line, right: line });
    }
  }
  flush();
  return pairs;
}

function signFor(kind: DiffLine["kind"]): string {
  if (kind === "add") {
    return "+";
  }
  if (kind === "del") {
    return "-";
  }
  return " ";
}

/**
 * Inline error renderer following `SPEC-shared-error-display`: shows kind,
 * message, and next action. Raw stderr / stack traces are never rendered.
 */
function DiffErrorDisplay(props: { error: DiffViewError }) {
  return (
    <div class="error-display" role="alert">
      <div class="error-display__head">
        <span class="error-display__kind">{props.error.kind}</span>
      </div>
      <p class="error-display__message">{props.error.message}</p>
      <Show when={props.error.nextAction}>
        {(nextAction) => <p class="error-display__action">{nextAction()}</p>}
      </Show>
    </div>
  );
}
