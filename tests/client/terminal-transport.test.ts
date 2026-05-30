import { decode, encode } from "@msgpack/msgpack";
import { describe, expect, it, vi } from "vitest";
import type { WsEnvelope } from "../../src/api/contracts";
import type { SocketLike } from "../../src/features/terminal/transport";
import {
  eventsSocketUrl,
  TerminalSocket,
} from "../../src/features/terminal/transport";

/** A minimal in-memory WebSocket stand-in for unit testing the transport. */
class FakeSocket implements SocketLike {
  binaryType: BinaryType = "blob";
  sent: Uint8Array[] = [];
  closed = false;
  onopen: ((this: unknown, ev: unknown) => unknown) | null = null;
  onclose: ((this: unknown, ev: unknown) => unknown) | null = null;
  onerror: ((this: unknown, ev: unknown) => unknown) | null = null;
  onmessage: ((this: unknown, ev: { data: unknown }) => unknown) | null = null;

  constructor(readonly url: string) {}

  send(data: ArrayBufferLike | ArrayBufferView): void {
    if (data instanceof Uint8Array) {
      this.sent.push(data);
    } else if (data instanceof ArrayBuffer) {
      this.sent.push(new Uint8Array(data));
    } else {
      const view = data as ArrayBufferView;
      this.sent.push(
        new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
      );
    }
  }

  close(): void {
    this.closed = true;
  }

  /** Test helper: deliver a server frame as an ArrayBuffer. */
  deliver(envelope: WsEnvelope): void {
    const bytes = encode(envelope);
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );
    this.onmessage?.({ data: buffer });
  }
}

function makeSocket(handlers = {}) {
  let fake!: FakeSocket;
  const socket = new TerminalSocket("prj_1", "ses_1", handlers, (url) => {
    fake = new FakeSocket(url);
    return fake;
  });
  return { socket, fake };
}

describe("eventsSocketUrl", () => {
  it("swaps http→ws and carries project + session query", () => {
    const url = eventsSocketUrl("prj_1", "ses_1", {
      protocol: "http:",
      host: "localhost:5173",
    });
    expect(url).toBe(
      "ws://localhost:5173/api/events?project_id=prj_1&session_id=ses_1",
    );
  });

  it("swaps https→wss", () => {
    const url = eventsSocketUrl("p", "s", {
      protocol: "https:",
      host: "example.com",
    });
    expect(url.startsWith("wss://example.com")).toBe(true);
  });
});

describe("TerminalSocket incoming frames", () => {
  it("sets arraybuffer binary type", () => {
    const { fake } = makeSocket();
    expect(fake.binaryType).toBe("arraybuffer");
  });

  it("fires onOutput for term.output", () => {
    const onOutput = vi.fn();
    const { fake } = makeSocket({ onOutput });
    fake.deliver([
      1,
      "term.output",
      "evt_1",
      "prj_1",
      "ses_1",
      1000,
      7,
      { seq: 7, data: "hello", redacted: false },
    ]);
    expect(onOutput).toHaveBeenCalledWith(7, "hello", false);
  });

  it("fires onState for term.state", () => {
    const onState = vi.fn();
    const { fake } = makeSocket({ onState });
    fake.deliver([
      1,
      "term.state",
      "evt_2",
      "prj_1",
      "ses_1",
      1000,
      null,
      { state: "exited", exit_code: 0, started_at: 1, ended_at: 2 },
    ]);
    expect(onState).toHaveBeenCalledWith({
      state: "exited",
      exit_code: 0,
      started_at: 1,
      ended_at: 2,
      reason: null,
    });
  });

  it("fires onAck for sub.ack", () => {
    const onAck = vi.fn();
    const { fake } = makeSocket({ onAck });
    fake.deliver([
      1,
      "sub.ack",
      "evt_3",
      "prj_1",
      "ses_1",
      1000,
      null,
      {
        subscription_id: "sub_1",
        scope: "session",
        session_id: "ses_1",
        status: "connected",
      },
    ]);
    expect(onAck).toHaveBeenCalledWith({
      subscription_id: "sub_1",
      scope: "session",
      session_id: "ses_1",
      status: "connected",
    });
  });

  it("fires onError for err.show and on a bad frame (protocol)", () => {
    const onError = vi.fn();
    const { fake } = makeSocket({ onError });
    fake.deliver([
      1,
      "err.show",
      "evt_4",
      "prj_1",
      "ses_1",
      1000,
      null,
      { kind: "permission", message: "nope" },
    ]);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "permission" }),
    );

    // Garbage bytes must not throw; reported as a protocol error.
    fake.onmessage?.({ data: new Uint8Array([0xc1]).buffer });
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "protocol" }),
    );
  });

  it("reports a transport close through onClose", () => {
    const onClose = vi.fn();
    const { fake } = makeSocket({ onClose });
    fake.onerror?.({});
    expect(onClose).toHaveBeenCalledWith({ error: true });
  });
});

describe("TerminalSocket outgoing frames", () => {
  it("encodes a term.input envelope", () => {
    const { socket, fake } = makeSocket();
    socket.sendInput("ls\n");
    expect(fake.sent).toHaveLength(0);

    fake.onopen?.({});
    expect(fake.sent).toHaveLength(1);
    const env = decode(fake.sent[0]) as WsEnvelope;
    expect(env[0]).toBe(1);
    expect(env[1]).toBe("term.input");
    expect(env[3]).toBe("prj_1");
    expect(env[4]).toBe("ses_1");
    expect(env[7]).toEqual({ data: "ls\n", mode: "text", encoding: "utf-8" });
  });

  it("encodes a term.resize envelope", () => {
    const { socket, fake } = makeSocket();
    socket.sendResize(80, 24);
    fake.onopen?.({});

    const env = decode(fake.sent[0]) as WsEnvelope;
    expect(env[1]).toBe("term.resize");
    expect(env[7]).toEqual({ cols: 80, rows: 24 });
  });

  it("queues outgoing frames until the socket opens", () => {
    const { socket, fake } = makeSocket();
    socket.sendResize(80, 24);
    socket.sendInput("pwd\n");

    expect(fake.sent).toHaveLength(0);
    fake.onopen?.({});
    expect(fake.sent).toHaveLength(2);
    expect((decode(fake.sent[0]) as WsEnvelope)[1]).toBe("term.resize");
    expect((decode(fake.sent[1]) as WsEnvelope)[1]).toBe("term.input");
  });

  it("sends a term.close then stops sending after close", () => {
    const { socket, fake } = makeSocket();
    fake.onopen?.({});

    socket.close();
    const env = decode(fake.sent[0]) as WsEnvelope;
    expect(env[1]).toBe("term.close");
    expect(fake.closed).toBe(true);

    socket.sendInput("ignored");
    expect(fake.sent).toHaveLength(1);
  });
});
