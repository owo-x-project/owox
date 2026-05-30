import { apiRequest } from "../../api/http";

/** A single entry returned by the non-recursive tree listing. */
export interface TreeEntry {
  path: string;
  kind: "file" | "dir";
  version: string;
}

/** Response of `GET /files/tree` — one directory level under `path`. */
export interface TreeResponse {
  path: string;
  entries: TreeEntry[];
  version: string;
}

/** Response of `GET /files/content`. Binary files carry empty `content`. */
export interface ContentResponse {
  path: string;
  kind: "text" | "binary";
  version: string;
  content: string;
  truncated: boolean;
}

/** Response of `PUT /files/content`. */
export interface SaveResponse {
  path: string;
  version: string;
  result: "saved";
}

/** Response of `POST /files`. */
export interface CreateResponse {
  path: string;
  kind: "file" | "dir";
  version: string;
}

/** Response of `PATCH /files`. */
export interface RenameResponse {
  path: string;
  version: string;
  result: "renamed";
}

/**
 * Typed client for the file/editor endpoints, built on the shared
 * {@link apiRequest} helper. All paths are repo-relative; the server enforces
 * the workspace boundary and returns typed error envelopes for violations.
 */
export class FilesApi {
  constructor(
    private readonly projectId: string,
    private readonly baseUrl = "",
  ) {}

  private base(): string {
    return `/api/projects/${encodeURIComponent(this.projectId)}/files`;
  }

  /** Read one directory level. Default `path` ("") is the repo root. */
  tree(path = ""): Promise<TreeResponse> {
    const query = new URLSearchParams({ path });
    return apiRequest<TreeResponse>(
      `${this.base()}/tree?${query.toString()}`,
      undefined,
      this.baseUrl,
    );
  }

  /** Read file content, optionally with a byte range. */
  content(path: string, offset = 0, limit = 65536): Promise<ContentResponse> {
    const query = new URLSearchParams({
      path,
      offset: String(offset),
      limit: String(limit),
    });
    return apiRequest<ContentResponse>(
      `${this.base()}/content?${query.toString()}`,
      undefined,
      this.baseUrl,
    );
  }

  /**
   * Save file content. A stale `expectedVersion` returns HTTP 409 with a
   * conflict envelope (thrown as `ApiClientError`, `error.kind === "conflict"`).
   */
  save(
    path: string,
    content: string,
    expectedVersion?: string,
  ): Promise<SaveResponse> {
    return apiRequest<SaveResponse>(
      `${this.base()}/content`,
      {
        method: "PUT",
        body: JSON.stringify({
          path,
          content,
          expected_version: expectedVersion,
        }),
      },
      this.baseUrl,
    );
  }

  /** Create a file or directory. */
  create(
    path: string,
    kind: "file" | "dir",
    content?: string,
  ): Promise<CreateResponse> {
    return apiRequest<CreateResponse>(
      `${this.base()}`,
      {
        method: "POST",
        body: JSON.stringify({ path, kind, content }),
      },
      this.baseUrl,
    );
  }

  /** Rename / move an entry. */
  rename(
    path: string,
    targetPath: string,
    expectedVersion?: string,
  ): Promise<RenameResponse> {
    return apiRequest<RenameResponse>(
      `${this.base()}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          path,
          target_path: targetPath,
          expected_version: expectedVersion,
        }),
      },
      this.baseUrl,
    );
  }

  /**
   * Delete an entry. The destructive `confirm_token` must equal
   * {@link deleteConfirmToken}; without it the server returns HTTP 400.
   */
  remove(path: string): Promise<void> {
    return apiRequest<void>(
      `${this.base()}`,
      {
        method: "DELETE",
        body: JSON.stringify({
          path,
          confirm_token: deleteConfirmToken(this.projectId, path),
        }),
      },
      this.baseUrl,
    );
  }
}

/**
 * Derive the destructive delete confirmation token. The server requires it to
 * equal exactly `confirm:{projectId}:{path}` (per the file API contract and
 * `SPEC-shared-destructive-confirmation`).
 */
export function deleteConfirmToken(projectId: string, path: string): string {
  return `confirm:${projectId}:${path}`;
}
