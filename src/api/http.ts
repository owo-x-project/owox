import type { ApiErrorResponse } from "./contracts";

/**
 * Shared HTTP helper. Feature modules build their own typed API surfaces on top
 * of this so each feature owns its own `api.ts` file without colliding on a
 * single client class. Non-2xx responses are decoded into the contract error
 * envelope and thrown as {@link ApiClientError}.
 */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  baseUrl = "",
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const error = (await response
      .json()
      .catch(() => fallbackError())) as ApiErrorResponse;
    throw new ApiClientError(error, response.status);
  }

  return (await response.json()) as T;
}

function fallbackError(): ApiErrorResponse {
  return {
    error: {
      kind: "unknown",
      message: "Unexpected error",
      target: null,
      recoverability: "none",
      next_action: null,
      log_ref: null,
      request_id: "req_unknown",
    },
  };
}

export class ApiClientError extends Error {
  constructor(
    readonly response: ApiErrorResponse,
    readonly status: number,
  ) {
    super(response.error.message);
    this.name = "ApiClientError";
  }
}
