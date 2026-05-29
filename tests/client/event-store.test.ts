import { describe, expect, it } from "vitest";
import type { WsEnvelope } from "../../src/api/contracts";
import {
  initialEventStoreState,
  reduceEventStore,
} from "../../src/events/store";

describe("event store", () => {
  it("stores command result payloads", () => {
    const event: WsEnvelope = [
      1,
      "cmd.result",
      "evt_1",
      "prj_repo",
      null,
      1,
      1,
      {
        command_id: "cmd_1",
        status: "succeeded",
        exit_code: 0,
        stdout_ref: "log://cmd_1/stdout",
        stderr_ref: null,
        started_at: 1,
        ended_at: 2,
        error_kind: null,
      },
    ];

    const state = reduceEventStore(initialEventStoreState, event);

    expect(state.commandResults.cmd_1.status).toBe("succeeded");
  });

  it("keeps unknown events from breaking UI state", () => {
    const event: WsEnvelope = [
      1,
      "git.status",
      "evt_1",
      null,
      null,
      1,
      null,
      {},
    ];

    const state = reduceEventStore(initialEventStoreState, event);

    expect(state.unknownEvents).toEqual(["git.status"]);
  });
});
