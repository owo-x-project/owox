import { Match, Switch, For } from "solid-js";
import type { PaneNode, LeafPane, SplitPane } from "./pane-model";

export interface SplitPaneProps {
  node: PaneNode;
  activeId: string | null;
  onActivate: (paneId: string) => void;
  renderLeaf: (sessionId: string, paneId: string) => any;
}

export function SplitPaneView(props: SplitPaneProps) {
  return (
    <Switch>
      <Match when={props.node.kind === "leaf"}>
        {(() => {
          const leaf = props.node as LeafPane;
          return (
            <div
              class="terminal-pane"
              classList={{ "terminal-pane--active": props.activeId === leaf.id }}
              onClick={() => props.onActivate(leaf.id)}
            >
              {props.renderLeaf(leaf.sessionId, leaf.id)}
            </div>
          );
        })()}
      </Match>
      <Match when={props.node.kind === "split"}>
        {(() => {
          const split = props.node as SplitPane;
          const gridTemplate = () =>
            split.sizes.map((s) => `${s}%`).join(" 4px ");
          return (
            <div
              class="terminal-split"
              classList={{
                "terminal-split--horizontal": split.direction === "horizontal",
                "terminal-split--vertical": split.direction === "vertical",
              }}
              style={{
                [split.direction === "horizontal"
                  ? "grid-template-columns"
                  : "grid-template-rows"]: gridTemplate(),
              }}
            >
              <For each={split.children}>
                {(child, i) => (
                  <>
                    {i() > 0 && (
                      <div class="terminal-split__handle" />
                    )}
                    <SplitPaneView
                      node={child}
                      activeId={props.activeId}
                      onActivate={props.onActivate}
                      renderLeaf={props.renderLeaf}
                    />
                  </>
                )}
              </For>
            </div>
          );
        })()}
      </Match>
    </Switch>
  );
}
