/**
 * AI Turn Observability Types
 *
 * Defines the event structure for logging AI turn lifecycle events
 * to Google Cloud Logging. Each turn emits multiple events (start, context, llm, end/error)
 * sharing a common traceId for correlation.
 *
 * These types mirror the JSON schema contract at schemas/ai-turn-event.schema.json
 * in the raggedy-graphy repo.
 */

export type AiTurnEventPhase = "start" | "context" | "llm" | "end" | "error";
export type AiTurnOutcome =
  | "success"
  | "empty"
  | "llm_error"
  | "timeout"
  | "aborted"
  | "context_overflow";

export interface AiTurnEventBase {
  /** Unique ID for this turn, shared across all phases */
  traceId: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Event phase in the turn lifecycle */
  eventPhase: AiTurnEventPhase;
  /** Source service emitting the event */
  source: "openclaw" | "raggedy-graphy";
  /** Session identifier */
  sessionId?: string;
  /** Channel ID (e.g., Slack channel) */
  channelId?: string;
  /** Thread ID within the channel */
  threadId?: string;
  /** User/sender ID */
  userId?: string;
  /** Agent profile name */
  profile?: string;
  /** Agent ID (for sub-agents) */
  agentId?: string;
}

export interface AiTurnStartEvent extends AiTurnEventBase {
  eventPhase: "start";
}

export interface AiTurnContextEvent extends AiTurnEventBase {
  eventPhase: "context";
  context: {
    /** Time to build context (ms) */
    buildMs: number;
    /** Total tokens used in context */
    tokensTotal?: number;
    /** Token breakdown by source */
    tokensBySource?: Record<string, number>;
    /** Sources used in context building */
    sourcesUsed?: string[];
    /** Whether fallback was used */
    fallbackUsed?: boolean;
  };
}

export interface AiTurnLlmEvent extends AiTurnEventBase {
  eventPhase: "llm";
  llm: {
    /** LLM provider (e.g., anthropic, google) */
    provider: string;
    /** Model name */
    model: string;
    /** LLM call latency (ms) */
    latencyMs: number;
    /** Token usage */
    usage: {
      input: number;
      output: number;
      cacheRead?: number;
      cacheWrite?: number;
      total: number;
    };
    /** Estimated cost in USD */
    costUsd?: number;
  };
}

export interface AiTurnEndEvent extends AiTurnEventBase {
  eventPhase: "end";
  turn: {
    /** Total turn duration (ms) */
    totalMs: number;
    /** Number of tool calls made during the turn */
    toolCallCount: number;
    /** Turn outcome */
    outcome: AiTurnOutcome;
  };
}

export interface AiTurnErrorEvent extends AiTurnEventBase {
  eventPhase: "error";
  error: {
    /** Error message */
    message: string;
    /** Error code/type */
    code?: string;
    /** Turn outcome */
    outcome: AiTurnOutcome;
    /** Total turn duration before error (ms) */
    totalMs: number;
  };
}

export type AiTurnEvent =
  | AiTurnStartEvent
  | AiTurnContextEvent
  | AiTurnLlmEvent
  | AiTurnEndEvent
  | AiTurnErrorEvent;
