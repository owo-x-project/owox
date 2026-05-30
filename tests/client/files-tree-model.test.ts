import { describe, expect, it } from "vitest";
import type { TreeEntry } from "../../src/features/files/api";
import {
  baseName,
  createRoot,
  findNode,
  flatten,
  insertChildren,
  needsLoad,
  toggleExpand,
} from "../../src/features/files/tree-model";

function entry(path: string, kind: "file" | "dir"): TreeEntry {
  return { path, kind, version: `v_${path}` };
}

describe("baseName", () => {
  it("returns the last path segment", () => {
    expect(baseName("src/main.rs")).toBe("main.rs");
    expect(baseName("src")).toBe("src");
    expect(baseName("a/b/c")).toBe("c");
  });

  it("ignores a trailing slash", () => {
    expect(baseName("src/dir/")).toBe("dir");
  });
});

describe("insertChildren", () => {
  it("inserts a fetched listing under the root with correct depth", () => {
    const root = insertChildren(createRoot(), "", [
      entry("src", "dir"),
      entry("README.md", "file"),
    ]);
    const flat = flatten(root);
    expect(flat.map((n) => n.path)).toEqual(["src", "README.md"]);
    expect(flat.every((n) => n.depth === 1)).toBe(true);
    expect(flat[0].loaded).toBe(false);
  });

  it("inserts nested children under a sub-directory at depth+1", () => {
    let root = insertChildren(createRoot(), "", [entry("src", "dir")]);
    root = insertChildren(root, "src", [entry("src/main.rs", "file")]);
    const child = findNode(root, "src/main.rs");
    expect(child?.depth).toBe(2);
    expect(child?.kind).toBe("file");
  });

  it("is pure — does not mutate the input tree", () => {
    const root = createRoot();
    const next = insertChildren(root, "", [entry("a", "file")]);
    expect(root.children).toBeNull();
    expect(next).not.toBe(root);
    expect(next.children).toHaveLength(1);
  });

  it("preserves expansion/loaded state of surviving children on re-fetch", () => {
    let root = insertChildren(createRoot(), "", [entry("src", "dir")]);
    root = insertChildren(root, "src", [entry("src/a.rs", "file")]);
    root = toggleExpand(root, "src");
    expect(findNode(root, "src")?.expanded).toBe(true);

    // Re-fetch the root listing (e.g. after a mutation): src still expanded
    // and its previously loaded children are retained.
    root = insertChildren(root, "", [
      entry("src", "dir"),
      entry("new.txt", "file"),
    ]);
    const src = findNode(root, "src");
    expect(src?.expanded).toBe(true);
    expect(src?.children?.map((c) => c.path)).toEqual(["src/a.rs"]);
  });

  it("updates the version of an existing node on re-fetch", () => {
    let root = insertChildren(createRoot(), "", [entry("src", "dir")]);
    const bumped: TreeEntry = { path: "src", kind: "dir", version: "v_new" };
    root = insertChildren(root, "", [bumped]);
    expect(findNode(root, "src")?.version).toBe("v_new");
  });
});

describe("toggleExpand", () => {
  it("toggles a directory expand flag", () => {
    let root = insertChildren(createRoot(), "", [entry("src", "dir")]);
    expect(findNode(root, "src")?.expanded).toBe(false);
    root = toggleExpand(root, "src");
    expect(findNode(root, "src")?.expanded).toBe(true);
    root = toggleExpand(root, "src");
    expect(findNode(root, "src")?.expanded).toBe(false);
  });

  it("leaves files unchanged", () => {
    const root = insertChildren(createRoot(), "", [entry("a.txt", "file")]);
    const next = toggleExpand(root, "a.txt");
    expect(findNode(next, "a.txt")?.expanded).toBe(false);
  });

  it("returns the tree unchanged for an unknown path", () => {
    const root = insertChildren(createRoot(), "", [entry("a.txt", "file")]);
    expect(toggleExpand(root, "nope")).toBe(root);
  });
});

describe("flatten", () => {
  it("emits only visible rows, recursing into expanded dirs", () => {
    let root = insertChildren(createRoot(), "", [
      entry("src", "dir"),
      entry("top.txt", "file"),
    ]);
    root = insertChildren(root, "src", [
      entry("src/main.rs", "file"),
      entry("src/lib", "dir"),
    ]);

    // Collapsed: only the root level is visible.
    expect(flatten(root).map((n) => n.path)).toEqual(["src", "top.txt"]);

    // Expanded: src's children appear between src and top.txt.
    root = toggleExpand(root, "src");
    expect(flatten(root).map((n) => n.path)).toEqual([
      "src",
      "src/main.rs",
      "src/lib",
      "top.txt",
    ]);
  });

  it("reports loaded=true once children are inserted (even if empty)", () => {
    let root = insertChildren(createRoot(), "", [entry("empty", "dir")]);
    root = toggleExpand(root, "empty");
    root = insertChildren(root, "empty", []);
    const node = flatten(root).find((n) => n.path === "empty");
    expect(node?.loaded).toBe(true);
  });
});

describe("needsLoad", () => {
  it("is true for an unloaded directory and false otherwise", () => {
    const root = insertChildren(createRoot(), "", [
      entry("dir", "dir"),
      entry("file.txt", "file"),
    ]);
    const dir = findNode(root, "dir");
    const file = findNode(root, "file.txt");
    expect(dir && needsLoad(dir)).toBe(true);
    expect(file && needsLoad(file)).toBe(false);

    const loaded = insertChildren(root, "dir", []);
    const loadedDir = findNode(loaded, "dir");
    expect(loadedDir && needsLoad(loadedDir)).toBe(false);
  });
});
