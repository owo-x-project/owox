import type { TreeEntry } from "./api";

/**
 * A node in the lazily-loaded file tree. DOM-free and pure so it is unit
 * testable. Directories start collapsed with `children === null` (not yet
 * loaded); the first expand fetches and inserts children.
 */
export interface TreeNode {
  /** Repo-relative path. The synthetic root uses "". */
  path: string;
  /** Display name (the last path segment); "" for the root. */
  name: string;
  kind: "file" | "dir";
  version: string;
  expanded: boolean;
  /** null = not yet loaded; [] = loaded and empty. Always null for files. */
  children: TreeNode[] | null;
  /** Depth from the root (root === 0), used for render indentation. */
  depth: number;
}

/** A flattened, render-ready row for the visible (expanded) portion of the tree. */
export interface FlatNode {
  path: string;
  name: string;
  kind: "file" | "dir";
  version: string;
  expanded: boolean;
  loaded: boolean;
  depth: number;
}

/** The last path segment, e.g. "src/main.rs" -> "main.rs". */
export function baseName(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  const slash = trimmed.lastIndexOf("/");
  return slash === -1 ? trimmed : trimmed.slice(slash + 1);
}

/** Create the synthetic, always-expanded root node for a tree. */
export function createRoot(version = ""): TreeNode {
  return {
    path: "",
    name: "",
    kind: "dir",
    version,
    expanded: true,
    children: null,
    depth: 0,
  };
}

/** Map a fetched listing entry into a fresh (collapsed, unloaded) node. */
function nodeFromEntry(entry: TreeEntry, depth: number): TreeNode {
  return {
    path: entry.path,
    name: baseName(entry.path),
    kind: entry.kind,
    version: entry.version,
    expanded: false,
    children: null,
    depth,
  };
}

/**
 * Return a new tree with the fetched `entries` inserted as the children of the
 * node identified by `path`. Pure: the input tree is not mutated. Existing
 * children's expand/loaded state is preserved where the path still exists, so
 * re-fetching a directory after a file operation keeps open sub-directories.
 */
export function insertChildren(
  root: TreeNode,
  path: string,
  entries: TreeEntry[],
): TreeNode {
  return mapNode(root, path, (node) => {
    const previous = new Map((node.children ?? []).map((c) => [c.path, c]));
    const children = entries.map((entry) => {
      const fresh = nodeFromEntry(entry, node.depth + 1);
      const prior = previous.get(entry.path);
      if (prior && prior.kind === fresh.kind) {
        // Preserve expansion / already-loaded children across a re-fetch.
        return {
          ...fresh,
          version: entry.version,
          expanded: prior.expanded,
          children: prior.children,
        };
      }
      return fresh;
    });
    return { ...node, children };
  });
}

/**
 * Toggle the `expanded` flag of the directory node at `path`. Returns a new
 * tree; files and unknown paths are returned unchanged.
 */
export function toggleExpand(root: TreeNode, path: string): TreeNode {
  return mapNode(root, path, (node) =>
    node.kind === "dir" ? { ...node, expanded: !node.expanded } : node,
  );
}

/** True when a directory node has not yet had its children fetched. */
export function needsLoad(node: { kind: string; children: unknown }): boolean {
  return node.kind === "dir" && node.children === null;
}

/**
 * Flatten the tree into the ordered list of rows that are currently visible:
 * the root's children, recursing into expanded directories. The synthetic root
 * itself is not emitted.
 */
export function flatten(root: TreeNode): FlatNode[] {
  const out: FlatNode[] = [];
  const walk = (node: TreeNode) => {
    for (const child of node.children ?? []) {
      out.push({
        path: child.path,
        name: child.name,
        kind: child.kind,
        version: child.version,
        expanded: child.expanded,
        loaded: child.children !== null,
        depth: child.depth,
      });
      if (child.kind === "dir" && child.expanded) {
        walk(child);
      }
    }
  };
  walk(root);
  return out;
}

/** Find a node by path (depth-first). Returns undefined when absent. */
export function findNode(root: TreeNode, path: string): TreeNode | undefined {
  if (root.path === path) {
    return root;
  }
  for (const child of root.children ?? []) {
    const found = findNode(child, path);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/**
 * Return a new tree where the node at `path` is replaced by `fn(node)`. If the
 * path is not found the tree is returned structurally unchanged (a new object
 * graph is only produced along the matched branch).
 */
function mapNode(
  node: TreeNode,
  path: string,
  fn: (node: TreeNode) => TreeNode,
): TreeNode {
  if (node.path === path) {
    return fn(node);
  }
  if (node.children === null) {
    return node;
  }
  let changed = false;
  const children = node.children.map((child) => {
    const next = mapNode(child, path, fn);
    if (next !== child) {
      changed = true;
    }
    return next;
  });
  return changed ? { ...node, children } : node;
}
