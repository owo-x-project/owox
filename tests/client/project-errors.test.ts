import { describe, expect, it } from "vitest";
import { ApiClientError } from "../../src/api/client";
import type { ApiErrorResponse } from "../../src/api/contracts";
import {
  isRecoverable,
  toProjectListError,
} from "../../src/features/projects/errors";

function envelope(
  overrides: Partial<ApiErrorResponse["error"]> = {},
): ApiErrorResponse {
  return {
    error: {
      kind: "not_found",
      message: "Workspace root not found",
      target: "workspace_root",
      recoverability: "user_action",
      next_action: "Configure a valid workspace root and retry",
      log_ref: "log_123",
      request_id: "req_1",
      ...overrides,
    },
  };
}

describe("toProjectListError", () => {
  it("maps a typed ApiClientError envelope to the error-display contract", () => {
    const mapped = toProjectListError(new ApiClientError(envelope(), 404));
    expect(mapped).toEqual({
      kind: "not_found",
      message: "Workspace root not found",
      target: "workspace_root",
      recoverability: "user_action",
      nextAction: "Configure a valid workspace root and retry",
      logRef: "log_123",
    });
  });

  it("preserves a null next_action and log_ref", () => {
    const mapped = toProjectListError(
      new ApiClientError(
        envelope({ next_action: null, log_ref: null, recoverability: "none" }),
        500,
      ),
    );
    expect(mapped.nextAction).toBeNull();
    expect(mapped.logRef).toBeNull();
  });

  it("falls back to unknown kind for a plain Error", () => {
    const mapped = toProjectListError(new Error("boom"));
    expect(mapped.kind).toBe("unknown");
    expect(mapped.message).toBe("boom");
    expect(mapped.recoverability).toBe("none");
  });

  it("falls back to unknown kind for a non-error value", () => {
    const mapped = toProjectListError("nope");
    expect(mapped.kind).toBe("unknown");
    expect(mapped.message).toBe("Failed to load project list");
  });
});

describe("isRecoverable", () => {
  it("is true when a next action is offered", () => {
    expect(
      isRecoverable(toProjectListError(new ApiClientError(envelope(), 404))),
    ).toBe(true);
  });

  it("is false when recoverability is none", () => {
    const mapped = toProjectListError(
      new ApiClientError(envelope({ recoverability: "none" }), 500),
    );
    expect(isRecoverable(mapped)).toBe(false);
  });
});
