import { describe, expect, it } from "vitest";
import type { ApiErrorResponse } from "../../src/api/contracts";
import { ApiClientError } from "../../src/api/http";
import {
  type ErrorView,
  isErrorKind,
  isRecoverable,
  toErrorView,
} from "../../src/features/feedback/error-view";

function envelope(
  overrides: Partial<ApiErrorResponse["error"]> = {},
  fieldErrors?: ApiErrorResponse["field_errors"],
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
    ...(fieldErrors ? { field_errors: fieldErrors } : {}),
  };
}

describe("toErrorView", () => {
  it("maps a typed ApiClientError envelope to the error-view contract", () => {
    const view = toErrorView(new ApiClientError(envelope(), 404));
    expect(view).toEqual<ErrorView>({
      kind: "not_found",
      message: "Workspace root not found",
      target: "workspace_root",
      recoverability: "user_action",
      nextAction: "Configure a valid workspace root and retry",
      logRef: "log_123",
    });
  });

  it("carries field_errors through as fieldErrors", () => {
    const view = toErrorView(
      new ApiClientError(
        envelope({ kind: "validation", recoverability: "user_action" }, [
          {
            field: "cwd",
            code: "out_of_bounds",
            message: "cwd escapes the workspace",
          },
          { field: "command", code: "required", message: "command required" },
        ]),
        400,
      ),
    );
    expect(view.kind).toBe("validation");
    expect(view.fieldErrors).toEqual([
      { field: "cwd", message: "cwd escapes the workspace" },
      { field: "command", message: "command required" },
    ]);
  });

  it("omits fieldErrors when the envelope has none", () => {
    const view = toErrorView(new ApiClientError(envelope(), 404));
    expect(view.fieldErrors).toBeUndefined();
  });

  it("reads a structurally-compatible envelope (cross-module throwable)", () => {
    const view = toErrorView({ response: envelope({ kind: "auth" }) });
    expect(view.kind).toBe("auth");
    expect(view.message).toBe("Workspace root not found");
  });

  it("preserves null next_action and log_ref", () => {
    const view = toErrorView(
      new ApiClientError(
        envelope({ next_action: null, log_ref: null, recoverability: "none" }),
        500,
      ),
    );
    expect(view.nextAction).toBeNull();
    expect(view.logRef).toBeNull();
  });

  it("falls back to unknown kind for a plain Error", () => {
    const view = toErrorView(new Error("boom"));
    expect(view.kind).toBe("unknown");
    expect(view.message).toBe("boom");
    expect(view.recoverability).toBe("none");
    expect(view.logRef).toBeNull();
  });

  it("uses the provided fallback message for a non-Error value", () => {
    const view = toErrorView("nope", "Failed to load");
    expect(view.kind).toBe("unknown");
    expect(view.message).toBe("Failed to load");
  });

  it("never leaks a raw stack trace into any field", () => {
    const err = new Error("kaboom");
    expect(err.stack).toBeDefined();
    const view = toErrorView(err);
    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain("kaboom\n");
    expect(serialized).not.toContain(".test.ts");
    expect(serialized).not.toContain("at ");
    // Only the message text is surfaced, not the stack.
    expect(view.message).toBe("kaboom");
  });
});

describe("isRecoverable", () => {
  it("is true when a next action is offered", () => {
    expect(
      isRecoverable(toErrorView(new ApiClientError(envelope(), 404))),
    ).toBe(true);
  });

  it("is false when recoverability is none", () => {
    const view = toErrorView(
      new ApiClientError(envelope({ recoverability: "none" }), 500),
    );
    expect(isRecoverable(view)).toBe(false);
  });
});

describe("isErrorKind", () => {
  it("matches the envelope kind", () => {
    expect(
      isErrorKind(
        new ApiClientError(envelope({ kind: "conflict" }), 409),
        "conflict",
      ),
    ).toBe(true);
    expect(
      isErrorKind(
        new ApiClientError(envelope({ kind: "conflict" }), 409),
        "auth",
      ),
    ).toBe(false);
  });

  it("is false for non-envelope throwables", () => {
    expect(isErrorKind(new Error("x"), "unknown")).toBe(false);
  });
});
