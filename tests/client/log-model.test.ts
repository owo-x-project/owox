import { describe, expect, it } from "vitest";
import type { LogRangeResponse } from "../../src/features/log/api";
import {
  appendRange,
  emptyLogModel,
  isComplete,
  nextOffset,
  remainingBytes,
} from "../../src/features/log/log-model";

function response(overrides: Partial<LogRangeResponse> = {}): LogRangeResponse {
  return {
    log_id: "log_1",
    offset: 0,
    limit: 4,
    total: 12,
    chunks: [{ offset: 0, data: "abcd" }],
    truncated: true,
    ...overrides,
  };
}

describe("emptyLogModel", () => {
  it("starts empty and not complete-by-default once a total is known", () => {
    const model = emptyLogModel();
    expect(model.text).toBe("");
    expect(model.loadedBytes).toBe(0);
    expect(model.totalBytes).toBe(0);
    expect(model.truncated).toBe(false);
    // total 0 / loaded 0 -> already complete (empty log).
    expect(isComplete(model)).toBe(true);
  });
});

describe("appendRange — sequential accumulation", () => {
  it("folds the first truncated range and advances the offset by limit", () => {
    const model = appendRange(emptyLogModel(), response());
    expect(model.text).toBe("abcd");
    expect(model.loadedBytes).toBe(4);
    expect(model.totalBytes).toBe(12);
    expect(model.truncated).toBe(true);
    expect(nextOffset(model)).toBe(4);
    expect(remainingBytes(model)).toBe(8);
    expect(isComplete(model)).toBe(false);
  });

  it("accumulates successive ranges into one buffer", () => {
    let model = appendRange(emptyLogModel(), response());
    model = appendRange(
      model,
      response({ offset: 4, chunks: [{ offset: 4, data: "efgh" }] }),
    );
    expect(model.text).toBe("abcdefgh");
    expect(model.loadedBytes).toBe(8);
    expect(nextOffset(model)).toBe(8);
    expect(remainingBytes(model)).toBe(4);
    expect(isComplete(model)).toBe(false);
  });

  it("completes when the final non-truncated range arrives", () => {
    let model = appendRange(emptyLogModel(), response());
    model = appendRange(
      model,
      response({ offset: 4, chunks: [{ offset: 4, data: "efgh" }] }),
    );
    model = appendRange(
      model,
      response({
        offset: 8,
        chunks: [{ offset: 8, data: "ijkl" }],
        truncated: false,
      }),
    );
    expect(model.text).toBe("abcdefghijkl");
    expect(model.loadedBytes).toBe(12);
    expect(model.totalBytes).toBe(12);
    expect(remainingBytes(model)).toBe(0);
    expect(isComplete(model)).toBe(true);
  });
});

describe("appendRange — non-truncated covered-byte math", () => {
  it("uses (total - offset) for the covered span when not truncated", () => {
    // A single read that returns the whole 7-byte log in one shot.
    const model = appendRange(
      emptyLogModel(),
      response({
        offset: 0,
        limit: 65536,
        total: 7,
        chunks: [{ offset: 0, data: "abcdefg" }],
        truncated: false,
      }),
    );
    expect(model.loadedBytes).toBe(7);
    expect(remainingBytes(model)).toBe(0);
    expect(isComplete(model)).toBe(true);
  });
});

describe("appendRange — idempotent re-append", () => {
  it("ignores text from a re-fetched range at the same offset", () => {
    const first = appendRange(emptyLogModel(), response());
    const again = appendRange(first, response());
    expect(again.text).toBe("abcd");
    expect(again.loadedBytes).toBe(4);
  });

  it("ignores an overlapping range that does not start at the frontier", () => {
    let model = appendRange(emptyLogModel(), response());
    model = appendRange(
      model,
      response({ offset: 4, chunks: [{ offset: 4, data: "efgh" }] }),
    );
    // Re-deliver the first range (offset 0) while frontier is at 8.
    const after = appendRange(model, response());
    expect(after.text).toBe("abcdefgh");
    expect(after.loadedBytes).toBe(8);
    // Re-delivery keeps totals/truncated coherent without rewinding.
    expect(after.totalBytes).toBe(12);
    expect(after.truncated).toBe(true);
  });
});

describe("appendRange — multi-chunk ranges", () => {
  it("concatenates chunks in offset order", () => {
    const model = appendRange(
      emptyLogModel(),
      response({
        offset: 0,
        limit: 6,
        total: 6,
        truncated: false,
        chunks: [
          { offset: 3, data: "def" },
          { offset: 0, data: "abc" },
        ],
      }),
    );
    expect(model.text).toBe("abcdef");
    expect(isComplete(model)).toBe(true);
  });
});

describe("nextOffset / remainingBytes / isComplete", () => {
  it("next offset equals loaded bytes", () => {
    const model = appendRange(emptyLogModel(), response());
    expect(nextOffset(model)).toBe(model.loadedBytes);
  });

  it("remaining never goes negative", () => {
    const model = appendRange(
      emptyLogModel(),
      response({ total: 4, truncated: false }),
    );
    expect(remainingBytes(model)).toBe(0);
  });

  it("is not complete while truncated even if bytes look full", () => {
    const model = appendRange(
      emptyLogModel(),
      response({ offset: 0, limit: 12, total: 12, truncated: true }),
    );
    expect(isComplete(model)).toBe(false);
  });
});
