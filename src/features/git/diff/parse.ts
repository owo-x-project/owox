/**
 * PURE unified-diff parser (`SPEC-ui-diff-view`). Turns the raw `diff --git`
 * patch text produced by Git into a structured {@link DiffFile} list that the
 * presentational {@link DiffView} renders. Has no Solid / DOM / API
 * dependencies so it can be unit tested in a plain node environment.
 *
 * It understands: `diff --git a/… b/…` file headers, `---` / `+++` old/new
 * path lines, `@@ -a,b +c,d @@` hunk headers (tracking per-line old/new line
 * numbers), `+` / `-` / ` ` content prefixes, `rename from` / `rename to`,
 * `new file` / `deleted file` modes, and `Binary files … differ` (which marks
 * a file binary with no hunks — binary content is never shown as text). It is
 * robust to an empty patch (→ `[]`).
 */

/** Classification of a single rendered diff line. */
export type DiffLineKind = "context" | "add" | "del" | "hunk" | "meta";

/** One line of a hunk with its resolved old/new line numbers (null when the
 * line does not exist on that side, e.g. an added line has no old number). */
export interface DiffLine {
  kind: DiffLineKind;
  text: string;
  oldLine: number | null;
  newLine: number | null;
}

/** A contiguous `@@ … @@` change region. */
export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

/** Per-file change status. */
export type DiffStatus =
  | "modified"
  | "added"
  | "deleted"
  | "renamed"
  | "binary";

/** A single file's diff within a multi-file patch. */
export interface DiffFile {
  oldPath: string | null;
  newPath: string | null;
  status: DiffStatus;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
  binary: boolean;
}

/** Mutable accumulator used while parsing a single file section. */
interface FileAcc {
  oldPath: string | null;
  newPath: string | null;
  isNew: boolean;
  isDeleted: boolean;
  isRenamed: boolean;
  binary: boolean;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/** Strip a leading `a/` or `b/` git path prefix; `/dev/null` → null. */
function cleanPath(raw: string): string | null {
  const path = raw.trim();
  if (path === "/dev/null") {
    return null;
  }
  if (path.startsWith("a/") || path.startsWith("b/")) {
    return path.slice(2);
  }
  return path;
}

/** Parse the two paths out of a `diff --git a/x b/y` header line. */
function parseGitHeader(line: string): {
  oldPath: string | null;
  newPath: string | null;
} {
  const rest = line.slice("diff --git ".length);
  const match = rest.match(/^a\/(.*) b\/(.*)$/);
  if (match) {
    return { oldPath: match[1], newPath: match[2] };
  }
  // Fallback: split on the midpoint of two space-separated halves.
  const parts = rest.split(" ");
  const half = Math.floor(parts.length / 2);
  return {
    oldPath: cleanPath(parts.slice(0, half).join(" ")),
    newPath: cleanPath(parts.slice(half).join(" ")),
  };
}

function newFileAcc(): FileAcc {
  return {
    oldPath: null,
    newPath: null,
    isNew: false,
    isDeleted: false,
    isRenamed: false,
    binary: false,
    hunks: [],
    additions: 0,
    deletions: 0,
  };
}

function resolveStatus(acc: FileAcc): DiffStatus {
  if (acc.binary) {
    return "binary";
  }
  if (acc.isRenamed) {
    return "renamed";
  }
  if (acc.isNew) {
    return "added";
  }
  if (acc.isDeleted) {
    return "deleted";
  }
  return "modified";
}

function finishFile(acc: FileAcc): DiffFile {
  return {
    oldPath: acc.oldPath,
    newPath: acc.newPath,
    status: resolveStatus(acc),
    hunks: acc.hunks,
    additions: acc.additions,
    deletions: acc.deletions,
    binary: acc.binary,
  };
}

/**
 * Parse a unified diff patch into a list of {@link DiffFile}. Returns `[]` for
 * an empty / whitespace-only patch. Never throws on malformed input — unknown
 * lines inside a hunk are treated as context.
 */
export function parseUnifiedDiff(patch: string): DiffFile[] {
  if (!patch || patch.trim() === "") {
    return [];
  }

  const files: DiffFile[] = [];
  const lines = patch.split("\n");

  let acc: FileAcc | null = null;
  let hunk: DiffHunk | null = null;
  let oldNo = 0;
  let newNo = 0;

  const flushFile = () => {
    if (acc) {
      files.push(finishFile(acc));
    }
    acc = null;
    hunk = null;
  };

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      flushFile();
      acc = newFileAcc();
      const { oldPath, newPath } = parseGitHeader(line);
      acc.oldPath = oldPath;
      acc.newPath = newPath;
      continue;
    }

    if (acc === null) {
      // Preamble (e.g. a bare patch with no `diff --git`): start a file lazily
      // when we hit a hunk or `---`/`+++` header.
      if (
        line.startsWith("--- ") ||
        line.startsWith("+++ ") ||
        HUNK_RE.test(line)
      ) {
        acc = newFileAcc();
      } else {
        continue;
      }
    }

    if (line.startsWith("new file mode")) {
      acc.isNew = true;
      continue;
    }
    if (line.startsWith("deleted file mode")) {
      acc.isDeleted = true;
      continue;
    }
    if (line.startsWith("rename from ")) {
      acc.isRenamed = true;
      acc.oldPath = line.slice("rename from ".length).trim();
      continue;
    }
    if (line.startsWith("rename to ")) {
      acc.isRenamed = true;
      acc.newPath = line.slice("rename to ".length).trim();
      continue;
    }
    if (
      line.startsWith("Binary files ") ||
      line.startsWith("GIT binary patch")
    ) {
      acc.binary = true;
      acc.hunks = [];
      hunk = null;
      continue;
    }
    if (line.startsWith("--- ")) {
      acc.oldPath = cleanPath(line.slice(4));
      continue;
    }
    if (line.startsWith("+++ ")) {
      acc.newPath = cleanPath(line.slice(4));
      continue;
    }

    const hunkMatch = line.match(HUNK_RE);
    if (hunkMatch) {
      hunk = {
        header: line,
        oldStart: Number(hunkMatch[1]),
        oldLines: hunkMatch[2] === undefined ? 1 : Number(hunkMatch[2]),
        newStart: Number(hunkMatch[3]),
        newLines: hunkMatch[4] === undefined ? 1 : Number(hunkMatch[4]),
        lines: [],
      };
      oldNo = hunk.oldStart;
      newNo = hunk.newStart;
      acc.hunks.push(hunk);
      continue;
    }

    if (hunk === null) {
      // index / mode / similarity lines outside a hunk are ignored.
      continue;
    }

    // "\ No newline at end of file" — a marker, not a content line.
    if (line.startsWith("\\")) {
      hunk.lines.push({
        kind: "meta",
        text: line,
        oldLine: null,
        newLine: null,
      });
      continue;
    }

    const prefix = line[0];
    if (prefix === "+") {
      hunk.lines.push({
        kind: "add",
        text: line.slice(1),
        oldLine: null,
        newLine: newNo,
      });
      newNo += 1;
      acc.additions += 1;
    } else if (prefix === "-") {
      hunk.lines.push({
        kind: "del",
        text: line.slice(1),
        oldLine: oldNo,
        newLine: null,
      });
      oldNo += 1;
      acc.deletions += 1;
    } else {
      // Context (leading space) or any stray line: counts on both sides.
      hunk.lines.push({
        kind: "context",
        text: prefix === " " ? line.slice(1) : line,
        oldLine: oldNo,
        newLine: newNo,
      });
      oldNo += 1;
      newNo += 1;
    }
  }

  flushFile();
  return files;
}
