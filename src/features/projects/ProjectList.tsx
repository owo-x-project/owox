import { createResource, For, Show } from "solid-js";
import type { ApiClient } from "../../api/client";
import type { ProjectResource } from "../../api/contracts";
import { ErrorBanner } from "../feedback";
import { toProjectListError } from "./errors";

export interface ProjectListProps {
  api: ApiClient;
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
}

/**
 * Project list for the left drawer. Lists workspace-root Git repos and lets the
 * user select one to bind the shell. Renders the three states required by
 * `SPEC-ui-project-list`:
 *  - loading: while the resource is in flight.
 *  - empty: resolved with no `.git` repos -> friendly empty state.
 *  - error: workspace root missing / fetch error -> error-display contract.
 */
export function ProjectList(props: ProjectListProps) {
  const [projects, { refetch }] = createResource(() =>
    props.api.listProjects(),
  );

  return (
    <section class="project-list">
      <header class="project-list__header">
        <h2>Projects</h2>
      </header>

      <Show
        when={!projects.loading}
        fallback={<p class="muted project-list__state">Loading projects…</p>}
      >
        <Show
          when={!projects.error}
          fallback={
            <div class="project-list__state">
              <ErrorBanner
                error={toProjectListError(projects.error)}
                onRetry={() => void refetch()}
              />
            </div>
          }
        >
          <Show
            when={(projects()?.projects ?? []).length > 0}
            fallback={
              <p class="muted project-list__state">
                No Git repositories found directly under the workspace root. Add
                a project with a <code>.git</code> directory to get started.
              </p>
            }
          >
            <ul class="project-list__items">
              <For each={projects()?.projects ?? []}>
                {(project) => (
                  <ProjectListItem
                    project={project}
                    selected={project.id === props.selectedProjectId}
                    onSelect={() => props.onSelect(project.id)}
                  />
                )}
              </For>
            </ul>
          </Show>
        </Show>
      </Show>
    </section>
  );
}

function ProjectListItem(props: {
  project: ProjectResource;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        class="project-item"
        classList={{
          "project-item--selected": props.selected,
          "project-item--unavailable": props.project.status === "unavailable",
        }}
        aria-pressed={props.selected}
        disabled={props.project.status === "unavailable"}
        onClick={() => props.onSelect()}
      >
        <span class="project-item__name">{props.project.name}</span>
        <span class="project-item__meta">
          <span class="project-item__branch">
            {props.project.git_branch ?? "detached"}
          </span>
          <span
            class="project-item__status"
            classList={{
              "project-item__status--unavailable":
                props.project.status === "unavailable",
            }}
          >
            {props.project.status}
          </span>
        </span>
        <Show when={props.project.warnings.length > 0}>
          <span class="project-item__warnings">
            {props.project.warnings.length} warning
            {props.project.warnings.length === 1 ? "" : "s"}
          </span>
        </Show>
      </button>
    </li>
  );
}
