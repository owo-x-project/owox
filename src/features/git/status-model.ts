import type { GitDiffMode, GitStatusFile, GitStatusResponse } from "./api";
import type { GitError } from "./errors";

/**
 * Pure, DOM-free source-control state model (`SPEC-git-workflow`,
 * `SPEC-ui-diff-view`). Groups status entries, derives the commit-enablement
 * rule, tracks the selected file + diff mode, and holds the most recent
 * operation result / error. Unit-testable in a Node environment.
 */

/** A file grouped for display. `path` is the repo-relative path. */
export interface GroupedFile {
  path: string;
  state: GitStatusFile["state"];
}

/** Status entries grouped into the four Source Control sections. */
export interface StatusGroups {
  /** Index changes (staged: true), excluding conflicts. */
  staged: GroupedFile[];
  /** Worktree changes (staged: false), excluding untracked and conflicts. */
  changes: GroupedFile[];
  /** Untracked worktree files. */
  untracked: GroupedFile[];
  /** Conflicted files (merge conflicts). */
  conflicted: GroupedFile[];
}

/** Which group a selected file belongs to — determines the diff mode. */
export type SelectionGroup = "staged" | "changes" | "untracked" | "conflicted";

/** The currently selected file driving the diff view. */
export interface DiffSelection {
  path: string;
  group: SelectionGroup;
}

/** Result of a completed write operation, kept for the recent-op display. */
export interface OperationOutcome {
  op: string;
  message: string | null;
  logRef: string | null;
}

/**
 * Group raw status files into staged / changes / untracked / conflicted.
 *
 * A file modified in both index and worktree appears TWICE in the input — once
 * `staged: true` (→ staged group) and once `staged: false` (→ changes group);
 * both entries are kept so the user can stage / unstage each side. Conflicted
 * files are surfaced in their own group regardless of the `staged` flag.
 */
export function groupStatus(files: GitStatusFile[]): StatusGroups {
  const groups: StatusGroups = {
    staged: [],
    changes: [],
    untracked: [],
    conflicted: [],
  };

  for (const file of files) {
    const entry: GroupedFile = { path: file.path, state: file.state };
    if (file.state === "conflicted") {
      groups.conflicted.push(entry);
    } else if (file.state === "untracked") {
      groups.untracked.push(entry);
    } else if (file.staged) {
      groups.staged.push(entry);
    } else {
      groups.changes.push(entry);
    }
  }

  return groups;
}

/** Total number of staged entries (drives the commit rule + "unstage all"). */
export function stagedCount(groups: StatusGroups): number {
  return groups.staged.length;
}

/**
 * Commit-enablement rule (`SPEC-git-workflow`: "commit は staged changes と
 * commit message を必要とする"): at least one staged entry AND a non-empty
 * (trimmed) commit message.
 */
export function canCommit(groups: StatusGroups, message: string): boolean {
  return stagedCount(groups) > 0 && message.trim().length > 0;
}

/**
 * Diff mode for a selection: staged selections read the index diff
 * (`staged`); everything else reads the working-tree diff (`unstaged`).
 */
export function diffModeFor(group: SelectionGroup): GitDiffMode {
  return group === "staged" ? "staged" : "unstaged";
}

/** All non-untracked, non-conflicted unstaged paths (for "stage all"). */
export function changesPaths(groups: StatusGroups): string[] {
  return [
    ...groups.changes.map((f) => f.path),
    ...groups.untracked.map((f) => f.path),
  ];
}

/** All staged paths (for "unstage all"). */
export function stagedPaths(groups: StatusGroups): string[] {
  return groups.staged.map((f) => f.path);
}

/**
 * Whether the working tree is dirty (any change present). A dirty tree makes
 * `branch_checkout` destructive and so requires a confirm token.
 */
export function isDirty(status: GitStatusResponse | undefined): boolean {
  return (status?.files.length ?? 0) > 0;
}

/** Recent-op state: either a success outcome or a typed error (never both). */
export interface OperationState {
  outcome: OperationOutcome | null;
  error: GitError | null;
}

export function emptyOperationState(): OperationState {
  return { outcome: null, error: null };
}

export function withOutcome(outcome: OperationOutcome): OperationState {
  return { outcome, error: null };
}

export function withError(error: GitError): OperationState {
  return { outcome: null, error };
}
