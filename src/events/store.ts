import type {
  ApiError,
  CommandResult,
  WsEnvelope,
  WsEventType,
} from "../api/contracts";

/** Terminal session lifecycle, mirrored from the runtime session spec. */
export type TerminalSessionState =
  | "creating"
  | "running"
  | "exited"
  | "failed"
  | "terminated";

/** Latest known state of a terminal session, tracked off the WS stream. */
export interface TerminalSessionStatus {
  state: TerminalSessionState;
  exitCode: number | null;
  /** Highest `term.output` stream seq observed for this session. */
  lastOutputSeq: number;
}

export interface EventStoreState {
  subscriptions: Record<string, "connected" | "rejected">;
  commandResults: Record<string, CommandResult>;
  /** sessionId → latest terminal state + last output seq. */
  terminalSessions: Record<string, TerminalSessionStatus>;
  errors: ApiError[];
  unknownEvents: WsEventType[];
}

export const initialEventStoreState: EventStoreState = {
  subscriptions: {},
  commandResults: {},
  terminalSessions: {},
  errors: [],
  unknownEvents: [],
};

export function reduceEventStore(
  state: EventStoreState,
  envelope: WsEnvelope,
): EventStoreState {
  const [, eventType, , , sessionId, , , payload] = envelope;

  switch (eventType) {
    case "term.state": {
      if (sessionId === null) {
        return state;
      }
      const p = payload as {
        state?: TerminalSessionState;
        exit_code?: number | null;
      };
      const prev = state.terminalSessions[sessionId];
      return {
        ...state,
        terminalSessions: {
          ...state.terminalSessions,
          [sessionId]: {
            state: p.state ?? prev?.state ?? "creating",
            exitCode: p.exit_code ?? prev?.exitCode ?? null,
            lastOutputSeq: prev?.lastOutputSeq ?? 0,
          },
        },
      };
    }
    case "term.output": {
      if (sessionId === null) {
        return state;
      }
      const p = payload as { seq?: number };
      const seq = p.seq ?? 0;
      const prev = state.terminalSessions[sessionId];
      // Track only the highest seq so out-of-order replays never regress.
      if (prev && seq <= prev.lastOutputSeq) {
        return state;
      }
      return {
        ...state,
        terminalSessions: {
          ...state.terminalSessions,
          [sessionId]: {
            state: prev?.state ?? "running",
            exitCode: prev?.exitCode ?? null,
            lastOutputSeq: seq,
          },
        },
      };
    }
    case "sub.ack": {
      const ack = payload as {
        subscription_id: string;
        status: "connected" | "rejected";
      };
      return {
        ...state,
        subscriptions: {
          ...state.subscriptions,
          [ack.subscription_id]: ack.status,
        },
      };
    }
    case "cmd.result": {
      const result = payload as CommandResult;
      return {
        ...state,
        commandResults: {
          ...state.commandResults,
          [result.command_id]: result,
        },
      };
    }
    case "err.show": {
      return {
        ...state,
        errors: [...state.errors, payload as ApiError],
      };
    }
    default:
      return {
        ...state,
        unknownEvents: [...state.unknownEvents, eventType],
      };
  }
}
