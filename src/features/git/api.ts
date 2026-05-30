import { apiRequest } from "../../api/http";

/** State of a single file as reported by `git status`. */
export type GitFileState =
  | "modified"
  | "added"
  | "deleted"
  | "renamed"
  | "untracked"
  | "conflicted";

/**
 * One status entry. A file modified in both the index and the worktree appears
 * TWICE — once with `staged: true` and once with `staged: false`.
 */
export interface GitStatusFile {
  path: string;
  state: GitFileState;
  staged: boolean;
}

/** Response of `GET /git/status`. */
export interface GitStatusResponse {
  branch: string;
  ahead: number;
  behind: number;
  files: GitStatusFile[];
  counts: { modified: number; staged: number; untracked: number };
}

/** One branch entry from `GET /git/branches`. */
export interface GitBranch {
  name: string;
  current: boolean;
  remote: boolean;
}

/** Response of `GET /git/branches`. */
export interface GitBranchesResponse {
  current: string;
  branches: GitBranch[];
}

/** Diff mode: working-tree (`unstaged`) or index (`staged`). */
export type GitDiffMode = "unstaged" | "staged";

/** Response of `GET /git/diff`. `patch` is a byte window over the full diff. */
export interface GitDiffResponse {
  mode: GitDiffMode;
  path: string | null;
  summary: { files: number; additions: number; deletions: number };
  binary: boolean;
  patch: string;
  total: number;
  truncated: boolean;
}

/** Git operation kinds accepted by `POST /git/operations`. */
export type GitOp =
  | "stage"
  | "unstage"
  | "discard"
  | "commit"
  | "branch_checkout"
  | "branch_create"
  | "fetch"
  | "pull"
  | "push"
  | "sync";

/** Request body for `POST /git/operations`. */
export interface GitOperationRequest {
  op: GitOp;
  paths?: string[];
  message?: string;
  branch?: string;
  remote?: string;
  confirm_token?: string;
}

/** Response (202) of `POST /git/operations`. */
export interface GitOperationResponse {
  command_id: string;
  status: string;
  exit_code?: number | null;
  message?: string | null;
  log_ref?: string | null;
}

/** Default diff byte window, matching the server default (65536). */
export const DEFAULT_DIFF_LIMIT = 65536;

/**
 * Typed client for the Git workflow endpoints, built on the shared
 * {@link apiRequest} helper. The server enforces the workspace boundary and
 * returns typed error envelopes (`ApiClientError`) for failures, including the
 * HTTP 400 envelope when a destructive op is missing / has a mismatched
 * `confirm_token`.
 */
export class GitApi {
  constructor(
    private readonly projectId: string,
    private readonly baseUrl = "",
  ) {}

  private base(): string {
    return `/api/projects/${encodeURIComponent(this.projectId)}/git`;
  }

  /** Current working-tree status. */
  status(): Promise<GitStatusResponse> {
    return apiRequest<GitStatusResponse>(
      `${this.base()}/status`,
      undefined,
      this.baseUrl,
    );
  }

  /** Local + remote branches and the current branch. */
  branches(): Promise<GitBranchesResponse> {
    return apiRequest<GitBranchesResponse>(
      `${this.base()}/branches`,
      undefined,
      this.baseUrl,
    );
  }

  /**
   * Read a diff byte window. `path` scopes to one file; omitting it returns the
   * whole working-tree (or staged) diff. `truncated` indicates more remains;
   * fetch the next window at `offset + patch.length`.
   */
  diff(
    mode: GitDiffMode,
    path?: string | null,
    offset = 0,
    limit = DEFAULT_DIFF_LIMIT,
  ): Promise<GitDiffResponse> {
    const query = new URLSearchParams({
      mode,
      offset: String(offset),
      limit: String(limit),
    });
    if (path) {
      query.set("path", path);
    }
    return apiRequest<GitDiffResponse>(
      `${this.base()}/diff?${query.toString()}`,
      undefined,
      this.baseUrl,
    );
  }

  /** Run a Git operation. Destructive ops require a derived `confirm_token`. */
  operation(body: GitOperationRequest): Promise<GitOperationResponse> {
    return apiRequest<GitOperationResponse>(
      `${this.base()}/operations`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      this.baseUrl,
    );
  }
}

/**
 * Derive the destructive `discard` confirmation token. The server requires it
 * to equal exactly `confirm:{projectId}:discard:{paths joined by ","}` (per the
 * Git API contract and `SPEC-shared-destructive-confirmation`).
 */
export function discardToken(projectId: string, paths: string[]): string {
  return `confirm:${projectId}:discard:${paths.join(",")}`;
}

/**
 * Derive the destructive `branch_checkout` confirmation token (required only
 * when the tree is dirty). Equals exactly
 * `confirm:{projectId}:branch_checkout:{branch}`.
 */
export function checkoutToken(projectId: string, branch: string): string {
  return `confirm:${projectId}:branch_checkout:${branch}`;
}
