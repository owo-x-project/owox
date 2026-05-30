import { describe, expect, it } from "vitest";
import { checkoutToken, discardToken } from "../../src/features/git/api";

describe("discardToken", () => {
  it("derives confirm:{pid}:discard:{single path}", () => {
    expect(discardToken("proj_1", ["src/a.ts"])).toBe(
      "confirm:proj_1:discard:src/a.ts",
    );
  });

  it("joins multiple paths with a comma", () => {
    expect(discardToken("proj_1", ["src/a.ts", "src/b.ts"])).toBe(
      "confirm:proj_1:discard:src/a.ts,src/b.ts",
    );
  });

  it("handles an empty path list", () => {
    expect(discardToken("proj_1", [])).toBe("confirm:proj_1:discard:");
  });
});

describe("checkoutToken", () => {
  it("derives confirm:{pid}:branch_checkout:{branch}", () => {
    expect(checkoutToken("proj_1", "feature/x")).toBe(
      "confirm:proj_1:branch_checkout:feature/x",
    );
  });

  it("is project-scoped", () => {
    expect(checkoutToken("other", "main")).toBe(
      "confirm:other:branch_checkout:main",
    );
  });
});
