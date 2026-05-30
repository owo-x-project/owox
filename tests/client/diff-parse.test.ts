import { describe, expect, it } from "vitest";
import { parseUnifiedDiff } from "../../src/features/git/diff/parse";

describe("parseUnifiedDiff", () => {
  it("returns [] for an empty or whitespace-only patch", () => {
    expect(parseUnifiedDiff("")).toEqual([]);
    expect(parseUnifiedDiff("   \n  \n")).toEqual([]);
  });

  it("parses a single modified file with add/del counts", () => {
    const patch = [
      "diff --git a/src/main.rs b/src/main.rs",
      "index 1111111..2222222 100644",
      "--- a/src/main.rs",
      "+++ b/src/main.rs",
      "@@ -1,4 +1,4 @@",
      " fn main() {",
      '-    println!("old");',
      '+    println!("new");',
      "+    let extra = 1;",
      " }",
      "",
    ].join("\n");

    const files = parseUnifiedDiff(patch);
    expect(files).toHaveLength(1);
    const file = files[0];
    expect(file.status).toBe("modified");
    expect(file.oldPath).toBe("src/main.rs");
    expect(file.newPath).toBe("src/main.rs");
    expect(file.binary).toBe(false);
    expect(file.additions).toBe(2);
    expect(file.deletions).toBe(1);
    expect(file.hunks).toHaveLength(1);
  });

  it("tracks old/new line numbers per line", () => {
    const patch = [
      "diff --git a/f.txt b/f.txt",
      "--- a/f.txt",
      "+++ b/f.txt",
      "@@ -10,4 +20,5 @@",
      " context-a",
      "-removed",
      "+added-1",
      "+added-2",
      " context-b",
      "",
    ].join("\n");

    const hunk = parseUnifiedDiff(patch)[0].hunks[0];
    expect(hunk.oldStart).toBe(10);
    expect(hunk.oldLines).toBe(4);
    expect(hunk.newStart).toBe(20);
    expect(hunk.newLines).toBe(5);

    const lines = hunk.lines;
    // " context-a"
    expect(lines[0]).toMatchObject({
      kind: "context",
      oldLine: 10,
      newLine: 20,
    });
    // "-removed" — only an old line number
    expect(lines[1]).toMatchObject({ kind: "del", oldLine: 11, newLine: null });
    // "+added-1" — only a new line number
    expect(lines[2]).toMatchObject({ kind: "add", oldLine: null, newLine: 21 });
    // "+added-2"
    expect(lines[3]).toMatchObject({ kind: "add", oldLine: null, newLine: 22 });
    // " context-b" — old advanced past the deletion, new past both adds
    expect(lines[4]).toMatchObject({
      kind: "context",
      oldLine: 12,
      newLine: 23,
    });
    expect(lines[0].text).toBe("context-a");
    expect(lines[1].text).toBe("removed");
  });

  it("parses a multi-file patch into separate files", () => {
    const patch = [
      "diff --git a/a.txt b/a.txt",
      "--- a/a.txt",
      "+++ b/a.txt",
      "@@ -1 +1 @@",
      "-one",
      "+ONE",
      "diff --git a/b.txt b/b.txt",
      "--- a/b.txt",
      "+++ b/b.txt",
      "@@ -1 +1 @@",
      "-two",
      "+TWO",
      "",
    ].join("\n");

    const files = parseUnifiedDiff(patch);
    expect(files).toHaveLength(2);
    expect(files[0].newPath).toBe("a.txt");
    expect(files[1].newPath).toBe("b.txt");
    expect(files[0].additions).toBe(1);
    expect(files[1].deletions).toBe(1);
  });

  it("uses 1 as the implied count when a hunk header omits it", () => {
    const patch = [
      "diff --git a/x b/x",
      "--- a/x",
      "+++ b/x",
      "@@ -5 +7 @@",
      "-a",
      "+b",
      "",
    ].join("\n");
    const hunk = parseUnifiedDiff(patch)[0].hunks[0];
    expect(hunk.oldLines).toBe(1);
    expect(hunk.newLines).toBe(1);
    expect(hunk.oldStart).toBe(5);
    expect(hunk.newStart).toBe(7);
  });

  it("detects a renamed file and records both paths", () => {
    const patch = [
      "diff --git a/old/name.ts b/new/name.ts",
      "similarity index 95%",
      "rename from old/name.ts",
      "rename to new/name.ts",
      "--- a/old/name.ts",
      "+++ b/new/name.ts",
      "@@ -1 +1 @@",
      "-x",
      "+y",
      "",
    ].join("\n");

    const file = parseUnifiedDiff(patch)[0];
    expect(file.status).toBe("renamed");
    expect(file.oldPath).toBe("old/name.ts");
    expect(file.newPath).toBe("new/name.ts");
  });

  it("detects a new (added) file", () => {
    const patch = [
      "diff --git a/added.txt b/added.txt",
      "new file mode 100644",
      "index 0000000..abc1234",
      "--- /dev/null",
      "+++ b/added.txt",
      "@@ -0,0 +1,2 @@",
      "+line one",
      "+line two",
      "",
    ].join("\n");

    const file = parseUnifiedDiff(patch)[0];
    expect(file.status).toBe("added");
    expect(file.oldPath).toBeNull();
    expect(file.newPath).toBe("added.txt");
    expect(file.additions).toBe(2);
    expect(file.deletions).toBe(0);
  });

  it("detects a deleted file", () => {
    const patch = [
      "diff --git a/gone.txt b/gone.txt",
      "deleted file mode 100644",
      "index abc1234..0000000",
      "--- a/gone.txt",
      "+++ /dev/null",
      "@@ -1,2 +0,0 @@",
      "-line one",
      "-line two",
      "",
    ].join("\n");

    const file = parseUnifiedDiff(patch)[0];
    expect(file.status).toBe("deleted");
    expect(file.oldPath).toBe("gone.txt");
    expect(file.newPath).toBeNull();
    expect(file.deletions).toBe(2);
  });

  it("marks a binary file with no hunks", () => {
    const patch = [
      "diff --git a/logo.png b/logo.png",
      "index 1111111..2222222 100644",
      "Binary files a/logo.png and b/logo.png differ",
      "",
    ].join("\n");

    const file = parseUnifiedDiff(patch)[0];
    expect(file.status).toBe("binary");
    expect(file.binary).toBe(true);
    expect(file.hunks).toHaveLength(0);
    expect(file.additions).toBe(0);
    expect(file.deletions).toBe(0);
  });

  it("handles a mixed patch (text + binary + new) together", () => {
    const patch = [
      "diff --git a/code.ts b/code.ts",
      "--- a/code.ts",
      "+++ b/code.ts",
      "@@ -1 +1 @@",
      "-let a = 1;",
      "+let a = 2;",
      "diff --git a/image.bin b/image.bin",
      "Binary files a/image.bin and b/image.bin differ",
      "diff --git a/fresh.txt b/fresh.txt",
      "new file mode 100644",
      "--- /dev/null",
      "+++ b/fresh.txt",
      "@@ -0,0 +1 @@",
      "+hello",
      "",
    ].join("\n");

    const files = parseUnifiedDiff(patch);
    expect(files.map((f) => f.status)).toEqual(["modified", "binary", "added"]);
    expect(files[1].binary).toBe(true);
    expect(files[2].additions).toBe(1);
  });
});
