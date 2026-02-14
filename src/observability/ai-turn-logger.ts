/**
 * AI Turn Logger — writes turn lifecycle events to Google Cloud Logging.
 *
 * Uses direct HTTP to the GCL REST API with GCE metadata server auth.
 * No npm dependencies beyond Node builtins — avoids pnpm workspace conflicts.
 *
 * Log name: projects/{PROJECT}/logs/ai_turns
 * Resource: global (same as RG's ai_turn_logger.py)
 *
 * Falls back to logVerbose if GCL write fails (graceful degradation).
 */

import crypto from "node:crypto";
import type {
  AiTurnContextEvent,
  AiTurnEndEvent,
  AiTurnErrorEvent,
  AiTurnEventBase,
  AiTurnLlmEvent,
  AiTurnStartEvent,
} from "./ai-turn-types.js";
import { logVerbose } from "../globals.js";

// GCP project for log writes
const GCP_PROJECT = process.env.GCP_PROJECT ?? process.env.GCLOUD_PROJECT ?? "jeeves-486102";
const LOG_NAME = `projects/${GCP_PROJECT}/logs/ai_turns`;
const GCL_ENTRIES_URL = `https://logging.googleapis.com/v2/entries:write`;

// GCE metadata server for access tokens (works on any GCP VM)
const METADATA_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

// Cache the access token (they last ~3600s, refresh at 3000s)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Generate a new trace ID for a turn.
 */
export function generateTraceId(): string {
  return crypto.randomUUID();
}

/**
 * Get an access token from the GCE metadata server.
 * Caches the token and refreshes before expiry.
 */
async function getAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  try {
    const resp = await fetch(METADATA_TOKEN_URL, {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(3000),
    });

    if (!resp.ok) {
      logVerbose(`ai-turn-logger: metadata token fetch failed: ${resp.status}`);
      return null;
    }

    const data = (await resp.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      token: data.access_token,
      // Refresh 10 minutes before expiry
      expiresAt: now + (data.expires_in - 600) * 1000,
    };
    return cachedToken.token;
  } catch (err) {
    logVerbose(`ai-turn-logger: metadata token error: ${String(err)}`);
    return null;
  }
}

/**
 * Write a single log entry to GCL. Fire-and-forget (non-blocking).
 */
async function writeToGcl(event: Record<string, unknown>): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    logVerbose(`ai-turn-logger: no token, logging locally: ${JSON.stringify(event)}`);
    return;
  }

  try {
    const body = JSON.stringify({
      logName: LOG_NAME,
      resource: { type: "global" },
      entries: [
        {
          jsonPayload: event,
          severity: event.eventPhase === "error" ? "ERROR" : "INFO",
          timestamp: event.timestamp,
        },
      ],
    });

    const resp = await fetch(GCL_ENTRIES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(5000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      logVerbose(`ai-turn-logger: GCL write failed ${resp.status}: ${text.substring(0, 200)}`);
    }
  } catch (err) {
    logVerbose(`ai-turn-logger: GCL write error: ${String(err)}`);
  }
}

/**
 * Build the base fields for an event.
 */
function makeBase(
  traceId: string,
  phase: AiTurnEventBase["eventPhase"],
  params: {
    sessionId?: string;
    channelId?: string;
    threadId?: string;
    userId?: string;
    profile?: string;
    agentId?: string;
  },
): AiTurnEventBase {
  return {
    traceId,
    timestamp: new Date().toISOString(),
    eventPhase: phase,
    source: "openclaw",
    ...params,
  };
}

// ─── Public API ───────────────────────────────────────────────

export interface TurnIdentifiers {
  sessionId?: string;
  channelId?: string;
  threadId?: string;
  userId?: string;
  profile?: string;
  agentId?: string;
}

/**
 * Log the start of a turn.
 */
export function logAiTurnStart(traceId: string, ids: TurnIdentifiers): void {
  const event: AiTurnStartEvent = {
    ...makeBase(traceId, "start", ids),
    eventPhase: "start",
  };
  writeToGcl(event as unknown as Record<string, unknown>).catch(() => {});
}

/**
 * Log context building completion.
 */
export function logAiTurnContext(
  traceId: string,
  ids: TurnIdentifiers,
  context: AiTurnContextEvent["context"],
): void {
  const event: AiTurnContextEvent = {
    ...makeBase(traceId, "context", ids),
    eventPhase: "context",
    context,
  };
  writeToGcl(event as unknown as Record<string, unknown>).catch(() => {});
}

/**
 * Log LLM call completion.
 */
export function logAiTurnLlm(
  traceId: string,
  ids: TurnIdentifiers,
  llm: AiTurnLlmEvent["llm"],
): void {
  const event: AiTurnLlmEvent = {
    ...makeBase(traceId, "llm", ids),
    eventPhase: "llm",
    llm,
  };
  writeToGcl(event as unknown as Record<string, unknown>).catch(() => {});
}

/**
 * Log successful turn completion.
 */
export function logAiTurnEnd(
  traceId: string,
  ids: TurnIdentifiers,
  turn: AiTurnEndEvent["turn"],
): void {
  const event: AiTurnEndEvent = {
    ...makeBase(traceId, "end", ids),
    eventPhase: "end",
    turn,
  };
  writeToGcl(event as unknown as Record<string, unknown>).catch(() => {});
}

/**
 * Log a turn error/failure.
 */
export function logAiTurnError(
  traceId: string,
  ids: TurnIdentifiers,
  error: AiTurnErrorEvent["error"],
): void {
  const event: AiTurnErrorEvent = {
    ...makeBase(traceId, "error", ids),
    eventPhase: "error",
    error,
  };
  writeToGcl(event as unknown as Record<string, unknown>).catch(() => {});
}
