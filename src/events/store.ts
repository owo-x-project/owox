import type {
  ApiError,
  CommandResult,
  WsEnvelope,
  WsEventType,
} from "../api/contracts";

export interface EventStoreState {
  subscriptions: Record<string, "connected" | "rejected">;
  commandResults: Record<string, CommandResult>;
  errors: ApiError[];
  unknownEvents: WsEventType[];
}

export const initialEventStoreState: EventStoreState = {
  subscriptions: {},
  commandResults: {},
  errors: [],
  unknownEvents: [],
};

export function reduceEventStore(
  state: EventStoreState,
  envelope: WsEnvelope,
): EventStoreState {
  const [, eventType, , , , , , payload] = envelope;

  switch (eventType) {
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
