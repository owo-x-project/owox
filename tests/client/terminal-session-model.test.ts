import { describe, expect, it } from "vitest";
import type { SessionSummary } from "../../src/features/terminal/api";
import {
  applyOutputSeq,
  applyTermState,
  describeCommand,
  emptyHistory,
  emptyLauncherInput,
  isFinished,
  isRepoRelative,
  parseArgs,
  rememberFailed,
  rememberRecent,
  sessionsFromList,
  validateLauncherInput,
} from "../../src/features/terminal/session-model";
import type { TermStateInfo } from "../../src/features/terminal/transport";

describe("launcher input validation", () => {
  it("accepts an empty command (default shell) and empty cwd (repo root)", () => {
    const result = validateLauncherInput(emptyLauncherInput());
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual({
      command: "",
      args: [],
      cwd: "",
      env: {},
    });
  });

  it("splits args on whitespace and parses KEY=VALUE env", () => {
    const result = validateLauncherInput({
      command: "npm",
      args: "  run   build ",
      cwd: "packages/app",
      env: "FOO=bar\nBAZ=qux\n",
    });
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual({
      command: "npm",
      args: ["run", "build"],
      cwd: "packages/app",
      env: { FOO: "bar", BAZ: "qux" },
    });
  });

  it("rejects absolute and boundary-escaping cwd", () => {
    expect(isRepoRelative("")).toBe(true);
    expect(isRepoRelative("src/feature")).toBe(true);
    expect(isRepoRelative("a/../b")).toBe(true);
    expect(isRepoRelative("/etc")).toBe(false);
    expect(isRepoRelative("../secret")).toBe(false);
    expect(isRepoRelative("a/../../b")).toBe(false);
    expect(isRepoRelative("C:\\Windows")).toBe(false);

    const result = validateLauncherInput({
      command: "ls",
      args: "",
      cwd: "../outside",
      env: "",
    });
    expect(result.valid).toBe(false);
    expect(result.parsed).toBeNull();
    expect(result.errors.some((e) => e.field === "cwd")).toBe(true);
  });

  it("rejects malformed env lines and invalid keys", () => {
    const result = validateLauncherInput({
      command: "x",
      args: "",
      cwd: "",
      env: "NOEQUALS\n1BAD=v",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.filter((e) => e.field === "env")).toHaveLength(2);
  });

  it("parses args helper independently", () => {
    expect(parseArgs("")).toEqual([]);
    expect(parseArgs("   ")).toEqual([]);
    expect(parseArgs("a b  c")).toEqual(["a", "b", "c"]);
  });
});

describe("recent / failed history", () => {
  const entry = { command: "npm", args: ["test"], cwd: "" };

  it("remembers a recent command without duplicates", () => {
    let history = emptyHistory();
    history = rememberRecent(history, entry);
    history = rememberRecent(history, entry);
    expect(history.recent).toHaveLength(1);
    expect(history.recent[0]).toEqual(entry);
  });

  it("moves a command from recent to failed", () => {
    let history = rememberRecent(emptyHistory(), entry);
    history = rememberFailed(history, entry);
    expect(history.recent).toHaveLength(0);
    expect(history.failed).toHaveLength(1);
  });

  it("describes a command for the launcher list", () => {
    expect(describeCommand({ command: "", args: [], cwd: "" })).toBe(
      "(default shell)",
    );
    expect(
      describeCommand({ command: "npm", args: ["run", "build"], cwd: "app" }),
    ).toBe("npm run build — app");
  });
});

describe("session map updates", () => {
  const summaries: SessionSummary[] = [
    {
      id: "ses_1",
      label: "terminal",
      state: "running",
      cwd: ".",
      created_at: 1,
    },
  ];

  it("builds a map from the list response", () => {
    const map = sessionsFromList(summaries);
    expect(map.ses_1.state).toBe("running");
    expect(map.ses_1.lastOutputSeq).toBe(0);
  });

  it("applies a term.state transition with exit code", () => {
    const map = sessionsFromList(summaries);
    const info: TermStateInfo = {
      state: "exited",
      exit_code: 2,
      started_at: 1,
      ended_at: 2,
      reason: null,
    };
    const next = applyTermState(map, "ses_1", info);
    expect(next.ses_1.state).toBe("exited");
    expect(next.ses_1.exitCode).toBe(2);
    expect(isFinished(next.ses_1.state)).toBe(true);
  });

  it("tracks only the highest output seq", () => {
    let map = sessionsFromList(summaries);
    map = applyOutputSeq(map, "ses_1", 5);
    expect(map.ses_1.lastOutputSeq).toBe(5);
    map = applyOutputSeq(map, "ses_1", 3);
    expect(map.ses_1.lastOutputSeq).toBe(5);
    map = applyOutputSeq(map, "ses_1", 9);
    expect(map.ses_1.lastOutputSeq).toBe(9);
  });

  it("ignores updates for unknown sessions", () => {
    const map = sessionsFromList(summaries);
    expect(applyOutputSeq(map, "ses_missing", 1)).toBe(map);
  });
});
