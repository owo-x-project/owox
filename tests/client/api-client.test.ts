import { describe, expect, it, vi } from "vitest";
import { ApiClient, ApiClientError } from "../../src/api/client";

describe("ApiClient", () => {
  it("reads project list contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          projects: [
            {
              id: "prj_repo",
              name: "repo",
              repo_kind: "git",
              git_branch: "main",
              status: "available",
              last_opened_at: null,
              warnings: [],
            },
          ],
        }),
      }),
    );

    const projects = await new ApiClient().listProjects();

    expect(projects.projects[0].id).toBe("prj_repo");
  });

  it("throws typed error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            kind: "validation",
            message: "Invalid request",
            target: "request",
            recoverability: "user_action",
            next_action: "Fix the highlighted fields and retry",
            log_ref: null,
            request_id: "req_1",
          },
        }),
      }),
    );

    await expect(new ApiClient().listProjects()).rejects.toBeInstanceOf(
      ApiClientError,
    );
  });
});
