import { createSignal, For, Show } from "solid-js";
import { ErrorBanner, toErrorView } from "../feedback";
import { GitApi } from "./api";
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
  const [copiedHash, setCopiedHash] = createSignal<string | null>(null);

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

  function copyHash(hash: string) {
    void navigator.clipboard.writeText(hash).then(() => {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 1500);
    });
  }

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
            <div class="commit-log__item">
              <div class="commit-log__item-header">
                <span class="commit-log__hash-group">
                  <span class="commit-log__hash">{commit.short_hash}</span>
                  <button
                    type="button"
                    class="commit-log__copy"
                    title="Copy full hash"
                    onClick={() => copyHash(commit.hash)}
                  >
                    {copiedHash() === commit.hash ? "✓" : "⎘"}
                  </button>
                </span>
                <span class="commit-log__meta">
                  <span class="commit-log__author">{commit.author}</span>
                  <span class="commit-log__date">
                    {relativeTime(commit.date)}
                  </span>
                </span>
              </div>
              <div class="commit-log__message">
                {commit.message.split("\n")[0]}
              </div>
            </div>
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
    </div>
  );
}
