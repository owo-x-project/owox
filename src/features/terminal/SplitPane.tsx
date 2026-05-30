import type { JSX } from "solid-js";
import { For, Match, Switch } from "solid-js";
import type { LeafPane, PaneNode, SplitPane } from "./pane-model";

export interface SplitPaneProps {
  node: PaneNode;
  activeId: string | null;
  onActivate: (paneId: string) => void;
  renderLeaf: (sessionId: string, paneId: string) => JSX.Element;
}

function handlePaneKeyDown(event: KeyboardEvent, onActivate: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

export function SplitPaneView(props: SplitPaneProps) {
  return (
    <Switch>
      <Match when={props.node.kind === "leaf"}>
        {(() => {
          const leaf = props.node as LeafPane;
          return (
            /* biome-ignore lint/a11y/useSemanticElements: pane wrapper contains terminal content and cannot be a button element */
            <div
              class="terminal-pane"
              classList={{
                "terminal-pane--active": props.activeId === leaf.id,
              }}
              role="button"
              tabIndex={0}
              onClick={() => props.onActivate(leaf.id)}
              onKeyDown={(event) =>
                handlePaneKeyDown(event, () => props.onActivate(leaf.id))
              }
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
                    {i() > 0 && <div class="terminal-split__handle" />}
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
