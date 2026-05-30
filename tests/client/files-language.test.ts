import { describe, expect, it } from "vitest";
import { deleteConfirmToken } from "../../src/features/files/api";
import { detectLanguage, extensionOf } from "../../src/features/files/language";

describe("extensionOf", () => {
  it("returns the lower-cased extension", () => {
    expect(extensionOf("src/Main.RS")).toBe("rs");
    expect(extensionOf("a/b/style.CSS")).toBe("css");
  });

  it("returns empty for extension-less or dotfile paths", () => {
    expect(extensionOf("Makefile")).toBe("");
    expect(extensionOf("src/.gitignore")).toBe("");
    expect(extensionOf("dir/")).toBe("");
  });
});

describe("detectLanguage", () => {
  const cases: Array<[string, string, string]> = [
    ["main.rs", "rust", "Rust"],
    ["app.js", "javascript", "JavaScript"],
    ["app.jsx", "javascript", "JavaScript"],
    ["mod.ts", "typescript", "TypeScript"],
    ["view.tsx", "typescript", "TypeScript"],
    ["data.json", "json", "JSON"],
    ["README.md", "markdown", "Markdown"],
    ["index.html", "html", "HTML"],
    ["theme.css", "css", "CSS"],
    ["script.py", "python", "Python"],
  ];

  for (const [path, id, name] of cases) {
    it(`detects ${path} as ${id}`, () => {
      const detected = detectLanguage(path);
      expect(detected.id).toBe(id);
      expect(detected.name).toBe(name);
    });
  }

  it("falls back to plain for unknown extensions", () => {
    expect(detectLanguage("data.bin").id).toBe("plain");
    expect(detectLanguage("Makefile").id).toBe("plain");
    expect(detectLanguage("data.bin").name).toBe("Plain Text");
  });
});

describe("deleteConfirmToken", () => {
  it("derives the exact server-required token", () => {
    expect(deleteConfirmToken("prj_1", "src/main.rs")).toBe(
      "confirm:prj_1:src/main.rs",
    );
  });
});
