import { decode, encode } from "@msgpack/msgpack";
import type { ApiError, WsEnvelope, WsEventType } from "../../api/contracts";
import type { SessionState } from "./api";

/** Subset of the DOM `WebSocket` API the transport relies on. */
export interface SocketLike {
  binaryType: BinaryType;
  send(data: ArrayBufferLike | ArrayBufferView): void;
  close(): void;
  onopen: ((this: unknown, ev: unknown) => unknown) | null;
  onclose: ((this: unknown, ev: unknown) => unknown) | null;
  onerror: ((this: unknown, ev: unknown) => unknown) | null;
  onmessage: ((this: unknown, ev: { data: unknown }) => unknown) | null;
}

/** Factory used to construct the socket. Overridable for unit tests. */
export type SocketFactory = (url: string) => SocketLike;

/** Decoded `sub.ack` payload. */
export interface SubAck {
  subscription_id: string;
  scope: string;
  session_id: string | null;
  status: "connected" | "rejected";
}

/** Decoded `term.state` payload mapped onto the 5-state machine. */
export interface TermStateInfo {
  state: SessionState;
  exit_code: number | null;
  started_at: number | null;
  ended_at: number | null;
  reason: string | null;
}

/** Callbacks fired as frames arrive. All optional. */
export interface TerminalSocketHandlers {
  /** A `term.output` frame: ordered PTY bytes/text plus its stream seq. */
  onOutput?: (seq: number, data: string, redacted: boolean) => void;
  /** A `term.state` transition. */
  onState?: (info: TermStateInfo) => void;
  /** A `sub.ack` (subscription accepted / rejected). */
  onAck?: (ack: SubAck) => void;
  /** An `err.show` event carried over the socket. */
  onError?: (error: ApiError) => void;
  /** The socket closed (clean or not). `error` is true for transport errors. */
  onClose?: (info: { error: boolean }) => void;
  /** The socket finished opening (before any subscription ack). */
  onOpen?: () => void;
}

const SCHEMA_VERSION = 1;

/** Build the events WebSocket URL from the current location (http→ws swap). */
export function eventsSocketUrl(
  projectId: string,
  sessionId: string,
  location?: { protocol: string; host: string },
): string {
  const loc =
    location ??
    (typeof window !== "undefined"
      ? window.location
      : { protocol: "http:", host: "localhost" });
  const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
  const query = new URLSearchParams({
    project_id: projectId,
    session_id: sessionId,
  });
  return `${wsProtocol}//${loc.host}/api/events?${query.toString()}`;
}

/** Generate a client-side event id for outgoing frames. */
function newEventId(): string {
  return `evt_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Thin, transport-only wrapper over the events WebSocket for one
 * (projectId, sessionId). It encodes outgoing `term.*` envelopes and decodes
 * incoming binary MessagePack frames into typed callbacks. It holds no UI
 * state and never throws on a bad frame — a decode failure is reported through
 * `onError` as a protocol error so a single malformed frame cannot crash the
 * surface.
 *
 * Frame wire format is the fixed envelope tuple
 * `[v, t, id, projectId, sessionId, serverEpochMs, seq, payload]`
 * (`SPEC-shared-websocket-events`). Client→server frames set `seq`/timestamp to
 * `0`/`null` since only the server numbers a stream.
 */
export class TerminalSocket {
  private socket: SocketLike;
  private closed = false;
  private opened = false;
  private pending: Uint8Array[] = [];

  constructor(
    private readonly projectId: string,
    private readonly sessionId: string,
    private readonly handlers: TerminalSocketHandlers,
    factory: SocketFactory = defaultFactory,
  ) {
    this.socket = factory(eventsSocketUrl(projectId, sessionId));
    this.socket.binaryType = "arraybuffer";
    this.socket.onopen = () => {
      this.opened = true;
      this.flushPending();
      this.handlers.onOpen?.();
    };
    this.socket.onmessage = (ev) => this.receive(ev.data);
    this.socket.onerror = () => this.finish(true);
    this.socket.onclose = () => this.finish(false);
  }

  /** Send a keystroke / paste as a `term.input` event. */
  sendInput(data: string): void {
    this.send("term.input", { data, mode: "text", encoding: "utf-8" });
  }

  /** Report a renderer resize as a `term.resize` event. */
  sendResize(cols: number, rows: number): void {
    this.send("term.resize", { cols, rows });
  }

  /** Ask the server to end the session, then close the socket. */
  close(reason = "client_close"): void {
    if (!this.closed) {
      this.send("term.close", { reason });
    }
    this.dispose();
  }

  /** Tear down the socket without sending a close event. */
  dispose(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.socket.onopen = null;
    this.socket.onmessage = null;
    this.socket.onerror = null;
    this.socket.onclose = null;
    try {
      this.socket.close();
    } catch {
      // Closing an already-closed / connecting socket can throw; ignore.
    }
  }

  private send(type: WsEventType, payload: unknown): void {
    if (this.closed) {
      return;
    }
    const envelope: WsEnvelope = [
      SCHEMA_VERSION,
      type,
      newEventId(),
      this.projectId,
      this.sessionId,
      0,
      null,
      payload,
    ];
    const bytes = encode(envelope);
    if (!this.opened) {
      this.pending.push(bytes);
      return;
    }
    this.sendBytes(bytes);
  }

  private flushPending(): void {
    while (!this.closed && this.pending.length > 0) {
      const bytes = this.pending.shift();
      if (bytes) {
        this.sendBytes(bytes);
      }
    }
  }

  private sendBytes(bytes: Uint8Array): void {
    try {
      this.socket.send(bytes);
    } catch {
      this.finish(true);
    }
  }

  private receive(raw: unknown): void {
    let envelope: WsEnvelope;
    try {
      envelope = decode(toBytes(raw)) as WsEnvelope;
    } catch {
      this.handlers.onError?.(protocolError("Failed to decode event frame"));
      return;
    }
    if (!Array.isArray(envelope) || envelope.length < 8) {
      this.handlers.onError?.(protocolError("Malformed event envelope"));
      return;
    }

    const eventType = envelope[1];
    const payload = envelope[7];
    switch (eventType) {
      case "term.output": {
        const p = payload as {
          seq?: number;
          data?: string;
          redacted?: boolean;
        };
        this.handlers.onOutput?.(p.seq ?? 0, p.data ?? "", p.redacted ?? false);
        return;
      }
      case "term.state": {
        const p = payload as Partial<TermStateInfo>;
        this.handlers.onState?.({
          state: (p.state ?? "creating") as SessionState,
          exit_code: p.exit_code ?? null,
          started_at: p.started_at ?? null,
          ended_at: p.ended_at ?? null,
          reason: p.reason ?? null,
        });
        return;
      }
      case "sub.ack": {
        const p = payload as Partial<SubAck>;
        this.handlers.onAck?.({
          subscription_id: p.subscription_id ?? "",
          scope: p.scope ?? "",
          session_id: p.session_id ?? null,
          status: p.status ?? "rejected",
        });
        return;
      }
      case "err.show": {
        this.handlers.onError?.(payload as ApiError);
        return;
      }
      default:
        // Unrelated event for this socket; ignore so the surface never breaks.
        return;
    }
  }

  private finish(error: boolean): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.handlers.onClose?.({ error });
  }
}

function defaultFactory(url: string): SocketLike {
  return new WebSocket(url) as unknown as SocketLike;
}

/** Normalise an incoming frame (ArrayBuffer / view / bytes) into a Uint8Array. */
function toBytes(raw: unknown): Uint8Array {
  if (raw instanceof Uint8Array) {
    return raw;
  }
  if (raw instanceof ArrayBuffer) {
    return new Uint8Array(raw);
  }
  if (ArrayBuffer.isView(raw)) {
    return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
  }
  throw new TypeError("Unsupported frame payload type");
}

function protocolError(message: string): ApiError {
  return {
    kind: "protocol",
    message,
    target: "event",
    recoverability: "reconnect",
    next_action: "Reconnect to the terminal session",
    log_ref: null,
    request_id: "req_client",
  };
}
