import { createSignal, For, Show } from "solid-js";
import { ErrorBanner, toErrorView } from "../feedback";
import { GitApi, type GitDiffMode } from "./api";
import {
  type Commit,
  type CommitLogResponse,
  relativeTime,
} from "./commit-model";

export interface CommitLogProps {
  projectId: string;
}

export function CommitLog(props: CommitLogProps) {
  const [commits, setCommits] = createSignal<Commit[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<ReturnType<typeof toErrorView> | null>(
    null,
  );
  const [hasMore, setHasMore] = createSignal(true);
  const [selectedHash, setSelectedHash] = createSignal<string | null>(null);
  const [diffContent, setDiffContent] = createSignal<string | null>(null);

  const api = () => new GitApi(props.projectId);

  const loadCommits = async (append = false) => {
    setLoading(true);
    setError(null);
    try {
      const offset = append ? commits().length : 0;
      const result: CommitLogResponse = await api().log(offset, 30);
      if (append) {
        setCommits((prev) => [...prev, ...result.commits]);
      } else {
        setCommits(result.commits);
      }
      setHasMore(commits().length < result.total);
    } catch (e: unknown) {
      setError(toErrorView(e));
    } finally {
      setLoading(false);
    }
  };

  const selectCommit = async (hash: string) => {
    setSelectedHash(hash);
    setDiffContent(null);
    try {
      const result = await api().diff(
        `commit:${hash}` as unknown as GitDiffMode,
      );
      setDiffContent(result.patch);
    } catch (e: unknown) {
      setError(toErrorView(e));
    }
  };

  // Load on mount
  loadCommits();

  return (
    <div class="commit-log">
      <Show when={error()}>
        {(err) => <ErrorBanner error={err()} />}
      </Show>

      <div class="commit-log__list">
        <For each={commits()}>
          {(commit) => (
            <button
              type="button"
              class="commit-log__item"
              classList={{
                "commit-log__item--selected":
                  selectedHash() === commit.hash,
              }}
              onClick={() => selectCommit(commit.hash)}
            >
              <div class="commit-log__item-header">
                <span class="commit-log__hash">{commit.short_hash}</span>
                <span class="commit-log__date">
                  {relativeTime(commit.date)}
                </span>
              </div>
              <div class="commit-log__message">
                {commit.message.split("\n")[0]}
              </div>
              <div class="commit-log__author">{commit.author}</div>
            </button>
          )}
        </For>

        <Show when={hasMore() && !loading()}>
          <button
            type="button"
            class="button"
            onClick={() => loadCommits(true)}
          >
            Load more
          </button>
        </Show>

        <Show when={loading()}>
          <div class="commit-log__loading">Loading...</div>
        </Show>
      </div>

      <Show when={selectedHash() && diffContent()}>
        <div class="commit-log__diff">
          <div class="commit-log__diff-header">
            <span class="commit-log__hash">{selectedHash()}</span>
          </div>
          <pre class="commit-log__diff-content">{diffContent()}</pre>
        </div>
      </Show>
    </div>
  );
}
