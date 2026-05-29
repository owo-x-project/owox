import type { ApiErrorResponse, ProjectsResponse } from "./contracts";

export class ApiClient {
  constructor(private readonly baseUrl = "") {}

  async listProjects(): Promise<ProjectsResponse> {
    return this.request<ProjectsResponse>("/api/projects");
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
      ...init,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorResponse;
      throw new ApiClientError(error, response.status);
    }

    return (await response.json()) as T;
  }
}

export class ApiClientError extends Error {
  constructor(
    readonly response: ApiErrorResponse,
    readonly status: number,
  ) {
    super(response.error.message);
  }
}
