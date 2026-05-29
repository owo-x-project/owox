import { createResource, For, Show } from "solid-js";
import { render } from "solid-js/web";
import { ApiClient } from "./api/client";
import "./styles.css";

const api = new ApiClient();

function App() {
  const [projects] = createResource(() => api.listProjects());

  return (
    <main class="app-shell">
      <aside class="project-rail">
        <h1>owox</h1>
        <Show when={!projects.loading} fallback={<p class="muted">Loading</p>}>
          <ul>
            <For each={projects()?.projects ?? []}>
              {(project) => (
                <li>
                  <button type="button">
                    <span>{project.name}</span>
                    <small>{project.git_branch ?? "detached"}</small>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </aside>
      <section class="workspace-surface">
        <header>
          <strong>Workspace</strong>
          <span>Foundation contracts connected</span>
        </header>
        <div class="surface-grid">
          <section>
            <h2>Terminal</h2>
          </section>
          <section>
            <h2>Files</h2>
          </section>
          <section>
            <h2>Git</h2>
          </section>
        </div>
      </section>
    </main>
  );
}

render(() => <App />, document.getElementById("root") as HTMLElement);
