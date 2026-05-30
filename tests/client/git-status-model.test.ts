import { describe, expect, it } from "vitest";
import type {
  GitStatusFile,
  GitStatusResponse,
} from "../../src/features/git/api";
import type { GitError } from "../../src/features/git/errors";
import {
  canCommit,
  changesPaths,
  diffModeFor,
  emptyOperationState,
  groupStatus,
  isDirty,
  stagedCount,
  stagedPaths,
  withError,
  withOutcome,
} from "../../src/features/git/status-model";

function file(over: Partial<GitStatusFile>): GitStatusFile {
  return { path: "a.ts", state: "modified", staged: false, ...over };
}

describe("groupStatus", () => {
  it("groups staged / changes / untracked / conflicted", () => {
    const groups = groupStatus([
      file({ path: "s.ts", state: "added", staged: true }),
      file({ path: "c.ts", state: "modified", staged: false }),
      file({ path: "u.ts", state: "untracked", staged: false }),
      file({ path: "x.ts", state: "conflicted", staged: false }),
    ]);
    expect(groups.staged.map((f) => f.path)).toEqual(["s.ts"]);
    expect(groups.changes.map((f) => f.path)).toEqual(["c.ts"]);
    expect(groups.untracked.map((f) => f.path)).toEqual(["u.ts"]);
    expect(groups.conflicted.map((f) => f.path)).toEqual(["x.ts"]);
  });

  it("keeps both entries when a file is modified in index and worktree", () => {
    // Same path appears twice — once staged, once not.
    const groups = groupStatus([
      file({ path: "dual.ts", state: "modified", staged: true }),
      file({ path: "dual.ts", state: "modified", staged: false }),
    ]);
    expect(groups.staged.map((f) => f.path)).toEqual(["dual.ts"]);
    expect(groups.changes.map((f) => f.path)).toEqual(["dual.ts"]);
  });

  it("routes conflicted files to conflicts regardless of staged flag", () => {
    const groups = groupStatus([
      file({ path: "x.ts", state: "conflicted", staged: true }),
    ]);
    expect(groups.conflicted.map((f) => f.path)).toEqual(["x.ts"]);
    expect(groups.staged).toEqual([]);
  });
});

describe("canCommit", () => {
  const staged = groupStatus([
    file({ path: "s.ts", state: "added", staged: true }),
  ]);
  const noStaged = groupStatus([
    file({ path: "c.ts", state: "modified", staged: false }),
  ]);

  it("requires at least one staged entry and a non-empty message", () => {
    expect(canCommit(staged, "msg")).toBe(true);
  });

  it("rejects when there is no staged entry", () => {
    expect(canCommit(noStaged, "msg")).toBe(false);
  });

  it("rejects a blank / whitespace-only message", () => {
    expect(canCommit(staged, "")).toBe(false);
    expect(canCommit(staged, "   ")).toBe(false);
  });
});

describe("diffModeFor", () => {
  it("uses staged mode for staged selections", () => {
    expect(diffModeFor("staged")).toBe("staged");
  });

  it("uses unstaged mode for changes / untracked / conflicted", () => {
    expect(diffModeFor("changes")).toBe("unstaged");
    expect(diffModeFor("untracked")).toBe("unstaged");
    expect(diffModeFor("conflicted")).toBe("unstaged");
  });
});

describe("bulk path helpers", () => {
  const groups = groupStatus([
    file({ path: "s.ts", state: "added", staged: true }),
    file({ path: "c.ts", state: "modified", staged: false }),
    file({ path: "u.ts", state: "untracked", staged: false }),
  ]);

  it("stagedPaths returns staged entries", () => {
    expect(stagedPaths(groups)).toEqual(["s.ts"]);
    expect(stagedCount(groups)).toBe(1);
  });

  it("changesPaths includes unstaged changes and untracked", () => {
    expect(changesPaths(groups)).toEqual(["c.ts", "u.ts"]);
  });
});

describe("isDirty", () => {
  it("is true when any file is present", () => {
    const status: GitStatusResponse = {
      branch: "main",
      ahead: 0,
      behind: 0,
      files: [file({})],
      counts: { modified: 1, staged: 0, untracked: 0 },
    };
    expect(isDirty(status)).toBe(true);
  });

  it("is false for a clean tree or missing status", () => {
    const clean: GitStatusResponse = {
      branch: "main",
      ahead: 0,
      behind: 0,
      files: [],
      counts: { modified: 0, staged: 0, untracked: 0 },
    };
    expect(isDirty(clean)).toBe(false);
    expect(isDirty(undefined)).toBe(false);
  });
});

describe("operation state", () => {
  it("starts empty", () => {
    expect(emptyOperationState()).toEqual({ outcome: null, error: null });
  });

  it("records a success outcome and clears any error", () => {
    const state = withOutcome({
      op: "commit",
      message: "done",
      logRef: "log_1",
    });
    expect(state.outcome).toEqual({
      op: "commit",
      message: "done",
      logRef: "log_1",
    });
    expect(state.error).toBeNull();
  });

  it("records a typed error and clears any outcome", () => {
    const err: GitError = {
      kind: "auth",
      message: "auth failed",
      target: null,
      recoverability: "user_action",
      nextAction: "check credentials",
      logRef: "log_2",
    };
    const state = withError(err);
    expect(state.error).toBe(err);
    expect(state.outcome).toBeNull();
  });
});
