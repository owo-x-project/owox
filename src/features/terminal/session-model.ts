import type { SessionState, SessionSummary } from "./api";
import type { TermStateInfo } from "./transport";

/**
 * DOM-free, unit-testable state for the terminal feature: the per-session view
 * model map, and the command-launcher input model (validation, recent / failed
 * command history). No Solid, no WebSocket, no fetch — the surface and launcher
 * components own those and fold pure results from here into reactive state.
 */

/** Per-session view model tracked by the surface. */
export interface SessionEntry {
  id: string;
  label: string;
  state: SessionState;
  cwd: string;
  /** Exit code once the process ends, else null. */
  exitCode: number | null;
  /** Highest `term.output` seq observed (for ordering / replay accounting). */
  lastOutputSeq: number;
}

/** A map of sessionId → entry, keyed for stable lookup. */
export type SessionMap = Record<string, SessionEntry>;

/** Fold the list endpoint response into a session map (reconnect). */
export function sessionsFromList(sessions: SessionSummary[]): SessionMap {
  const map: SessionMap = {};
  for (const s of sessions) {
    map[s.id] = {
      id: s.id,
      label: s.label,
      state: s.state,
      cwd: s.cwd,
      exitCode: null,
      lastOutputSeq: 0,
    };
  }
  return map;
}

/** Insert or replace a single session entry. */
export function upsertSession(
  map: SessionMap,
  entry: SessionEntry,
): SessionMap {
  return { ...map, [entry.id]: entry };
}

/** Apply a `term.state` transition to a session in the map. */
export function applyTermState(
  map: SessionMap,
  sessionId: string,
  info: TermStateInfo,
): SessionMap {
  const existing = map[sessionId];
  if (!existing) {
    return map;
  }
  return {
    ...map,
    [sessionId]: {
      ...existing,
      state: info.state,
      exitCode: info.exit_code ?? existing.exitCode,
    },
  };
}

/** Record the highest output seq seen for a session (monotonic). */
export function applyOutputSeq(
  map: SessionMap,
  sessionId: string,
  seq: number,
): SessionMap {
  const existing = map[sessionId];
  if (!existing || seq <= existing.lastOutputSeq) {
    return map;
  }
  return {
    ...map,
    [sessionId]: { ...existing, lastOutputSeq: seq },
  };
}

/** True when the session has reached a terminal (non-live) state. */
export function isFinished(state: SessionState): boolean {
  return state === "exited" || state === "failed" || state === "terminated";
}

// ---------------------------------------------------------------------------
// Command launcher input model
// ---------------------------------------------------------------------------

/** Raw launcher input, as typed by the user. */
export interface LauncherInput {
  command: string;
  /** Whitespace / shell-style args string (split on spaces). */
  args: string;
  /** Repo-relative working directory. Empty means repo root. */
  cwd: string;
  /** Optional `KEY=VALUE` env lines, newline-separated. */
  env: string;
}

/** A single validation problem on a launcher field. */
export interface LauncherFieldError {
  field: "command" | "args" | "cwd" | "env";
  message: string;
}

/** Parsed, validated launcher input ready to become a create request. */
export interface ParsedLauncherInput {
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
}

export interface LauncherValidation {
  valid: boolean;
  errors: LauncherFieldError[];
  parsed: ParsedLauncherInput | null;
}

/** Empty launcher input. */
export function emptyLauncherInput(): LauncherInput {
  return { command: "", args: "", cwd: "", env: "" };
}

/**
 * Validate and parse launcher input. Constraints, all client-side guards (the
 * server still enforces the workspace boundary authoritatively):
 *
 * - `cwd` is repo-relative: it must not be absolute and must not escape the
 *   project boundary via `..` segments. An empty `cwd` means the repo root.
 * - `command` may be empty (runs the default shell) but must not be only
 *   whitespace once trimmed if any non-space char is present.
 * - `args` split on whitespace into a token list.
 * - `env` lines are `KEY=VALUE`; keys must be valid env identifiers.
 */
export function validateLauncherInput(
  input: LauncherInput,
): LauncherValidation {
  const errors: LauncherFieldError[] = [];

  const command = input.command.trim();

  const cwd = input.cwd.trim();
  if (!isRepoRelative(cwd)) {
    errors.push({
      field: "cwd",
      message:
        "Working directory must stay inside the project (no absolute or ../ paths).",
    });
  }

  const args = parseArgs(input.args);

  const env: Record<string, string> = {};
  for (const line of input.env.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      errors.push({
        field: "env",
        message: `Invalid environment line "${trimmed}" — use KEY=VALUE.`,
      });
      continue;
    }
    const key = trimmed.slice(0, eq);
    if (!isEnvKey(key)) {
      errors.push({
        field: "env",
        message: `Invalid environment key "${key}".`,
      });
      continue;
    }
    env[key] = trimmed.slice(eq + 1);
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    parsed: valid ? { command, args, cwd, env } : null,
  };
}

/** A repo-relative path: not absolute, with no boundary-escaping `..` segment. */
export function isRepoRelative(cwd: string): boolean {
  if (cwd === "") {
    return true;
  }
  if (cwd.startsWith("/") || cwd.startsWith("\\")) {
    return false;
  }
  // Reject Windows drive-letter absolute paths (e.g. C:\...).
  if (/^[a-zA-Z]:/.test(cwd)) {
    return false;
  }
  const segments = cwd.split(/[\\/]/);
  let depth = 0;
  for (const segment of segments) {
    if (segment === "" || segment === ".") {
      continue;
    }
    if (segment === "..") {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
      continue;
    }
    depth += 1;
  }
  return true;
}

/** Split an args string on whitespace into a token list. */
export function parseArgs(args: string): string[] {
  const trimmed = args.trim();
  if (trimmed === "") {
    return [];
  }
  return trimmed.split(/\s+/);
}

function isEnvKey(key: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
}

// ---------------------------------------------------------------------------
// Recent / failed command history
// ---------------------------------------------------------------------------

/** One remembered launch, for the recent / failed lists. */
export interface CommandHistoryEntry {
  command: string;
  args: string[];
  cwd: string;
}

export interface LauncherHistory {
  recent: CommandHistoryEntry[];
  failed: CommandHistoryEntry[];
}

export function emptyHistory(): LauncherHistory {
  return { recent: [], failed: [] };
}

const MAX_HISTORY = 10;

/** Push a successfully-launched command onto the front of the recent list. */
export function rememberRecent(
  history: LauncherHistory,
  entry: CommandHistoryEntry,
): LauncherHistory {
  return {
    ...history,
    recent: dedupePush(history.recent, entry),
  };
}

/**
 * Record a command that failed to start (`state:"failed"` session, or a create
 * error). It is kept on the failed list and removed from the recent list.
 */
export function rememberFailed(
  history: LauncherHistory,
  entry: CommandHistoryEntry,
): LauncherHistory {
  return {
    recent: history.recent.filter((e) => !sameCommand(e, entry)),
    failed: dedupePush(history.failed, entry),
  };
}

function dedupePush(
  list: CommandHistoryEntry[],
  entry: CommandHistoryEntry,
): CommandHistoryEntry[] {
  const next = [entry, ...list.filter((e) => !sameCommand(e, entry))];
  return next.slice(0, MAX_HISTORY);
}

function sameCommand(a: CommandHistoryEntry, b: CommandHistoryEntry): boolean {
  return (
    a.command === b.command &&
    a.cwd === b.cwd &&
    a.args.length === b.args.length &&
    a.args.every((v, i) => v === b.args[i])
  );
}

/** Render a history entry as a one-line label for the launcher list. */
export function describeCommand(entry: CommandHistoryEntry): string {
  const cmd = entry.command === "" ? "(default shell)" : entry.command;
  const args = entry.args.length > 0 ? ` ${entry.args.join(" ")}` : "";
  const cwd = entry.cwd === "" ? "" : ` — ${entry.cwd}`;
  return `${cmd}${args}${cwd}`;
}
