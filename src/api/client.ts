import type { ProjectResource, ProjectsResponse } from "./contracts";
import { ApiClientError, apiRequest } from "./http";

export { ApiClientError };

/**
 * Project / workspace API surface. Other domains (files, logs, git, terminal)
 * own their own `features/<domain>/api.ts` modules built on {@link apiRequest}.
 */
export class ApiClient {
  constructor(private readonly baseUrl = "") {}

  listProjects(): Promise<ProjectsResponse> {
    return apiRequest<ProjectsResponse>(
      "/api/projects",
      undefined,
      this.baseUrl,
    );
  }

  getProject(projectId: string): Promise<{ project: ProjectResource }> {
    return apiRequest<{ project: ProjectResource }>(
      `/api/projects/${encodeURIComponent(projectId)}`,
      undefined,
      this.baseUrl,
    );
  }
}
