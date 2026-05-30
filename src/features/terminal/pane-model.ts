export type SplitDirection = "horizontal" | "vertical";

export interface LeafPane {
  kind: "leaf";
  id: string;
  sessionId: string;
}

export interface SplitPane {
  kind: "split";
  id: string;
  direction: SplitDirection;
  children: PaneNode[];
  sizes: number[];
}

export type PaneNode = LeafPane | SplitPane;

let counter = 0;
function uid(): string {
  return `pane-${++counter}`;
}

export function createLeaf(sessionId: string): LeafPane {
  return { kind: "leaf", id: uid(), sessionId };
}

export function splitPane(
  root: PaneNode,
  targetId: string,
  newSessionId: string,
  direction: SplitDirection,
): PaneNode {
  if (root.kind === "leaf") {
    if (root.id === targetId) {
      return {
        kind: "split",
        id: uid(),
        direction,
        children: [root, createLeaf(newSessionId)],
        sizes: [50, 50],
      };
    }
    return root;
  }
  return {
    ...root,
    children: root.children.map((child) =>
      splitPane(child, targetId, newSessionId, direction),
    ),
  };
}

export function removePane(root: PaneNode, targetId: string): PaneNode | null {
  if (root.kind === "leaf") {
    return root.id === targetId ? null : root;
  }
  const remaining = root.children
    .map((child) => removePane(child, targetId))
    .filter((c): c is PaneNode => c !== null);
  if (remaining.length === 0) return null;
  if (remaining.length === 1) return remaining[0];
  return { ...root, children: remaining, sizes: remaining.map(() => 100 / remaining.length) };
}

export function findLeaves(root: PaneNode): LeafPane[] {
  if (root.kind === "leaf") return [root];
  return root.children.flatMap(findLeaves);
}
