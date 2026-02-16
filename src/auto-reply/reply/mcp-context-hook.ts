/**
 * MCP Context Hook for OpenClaw
 *
 * Generic hook that calls any MCP tool to build context for agent turns.
 * Configurable via agents.defaults.contextHook in openclaw.json.
 *
 * Example config:
 * {
 *   "agents": {
 *     "defaults": {
 *       "contextHook": {
 *         "enabled": true,
 *         "mcpServer": "my-rag-server",
 *         "mcpTool": "build_context",
 *         "timeoutMs": 10000,
 *         "budgetTokens": 60000,
 *         "profile": "jeeves"
 *       }
 *     }
 *   }
 * }
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logVerbose } from "../../globals.js";

const execAsync = promisify(exec);

const TAG = "[mcp-context-hook]";

export interface ContextHookConfig {
  enabled?: boolean;
  /** MCP server name (e.g., "my-rag-server") */
  mcpServer?: string;
  /** MCP tool name to call (default: "build_agent_context") */
  mcpTool?: string;
  /** Timeout in milliseconds (default: 10000) */
  timeoutMs?: number;
  /** Token budget for context (default: 60000) */
  budgetTokens?: number;
  /** RG profile name for context resolution (e.g., "jeeves"). Falls back to agentId. */
  profile?: string;
}

export interface ContextHookResult {
  contextBlock: string;
  /** Soul + protocol content for system prompt identity placement (first in prompt). */
  identityBlock?: string;
  metadata?: {
    tokensUsed?: number;
    latencyMs?: number;
    /** Model recommended by the context hook's complexity classifier (e.g. "anthropic/claude-sonnet-4-5"). */
    recommended_model?: string;
    /** Complexity level from the classifier: "low" | "medium" | "high". */
    rewriter_complexity?: string;
    [key: string]: unknown;
  };
}

export interface ContextHookParams {
  messageText: string;
  /** Recent messages for query context (helps RG understand short/contextual messages). */
  recentMessages?: string;
  senderName?: string;
  threadId?: string;
  channelId?: string;
  sessionKey?: string;
  /** Agent ID for profile resolution (e.g., sub-agent agentId → profile mapping). */
  agentId?: string;
}

/**
 * Call configured MCP tool to build context for an agent turn.
 * Returns null if disabled, not configured, or on failure (graceful degradation).
 */
export async function fetchMcpContext(
  config: ContextHookConfig | undefined,
  params: ContextHookParams,
): Promise<ContextHookResult | null> {
  // Check if enabled and configured
  if (!config?.enabled || !config.mcpServer) {
    return null;
  }

  const {
    mcpServer,
    mcpTool = "build_agent_context",
    timeoutMs = 10000,
    budgetTokens = 60000,
    profile,
  } = config;

  const { messageText, recentMessages, senderName, threadId, channelId, agentId } = params;

  // Skip if message is too short
  if (messageText.trim().length < 10) {
    return null;
  }

  try {
    const startTime = Date.now();

    // Combine current message with recent context for better semantic search.
    // Recent messages help RG understand short/contextual messages like "yes do it".
    const queryText = recentMessages ? `${recentMessages}\n[current] ${messageText}` : messageText;

    // Build mcporter command with generic parameters
    const args: string[] = [`message_text="${escapeForShell(queryText)}"`];

    if (senderName) {
      args.push(`sender_name="${escapeForShell(senderName)}"`);
    }
    if (threadId) {
      // str: prefix forces mcporter to treat numeric-looking thread_ts as a string
      args.push(`thread_ts=str:${threadId}`);
    }
    if (channelId) {
      args.push(`channel_id="${channelId}"`);
    }

    // Profile resolution: explicit profile > agentId > nothing
    // This is CRITICAL — without a profile, RG cannot resolve context sources.
    const resolvedProfile = profile || agentId;
    if (resolvedProfile) {
      args.push(`profile="${escapeForShell(resolvedProfile)}"`);
    }
    if (agentId) {
      args.push(`agent_id="${escapeForShell(agentId)}"`);
    }

    if (budgetTokens) {
      args.push(`context_budget_tokens=${budgetTokens}`);
    }

    const command = `mcporter call ${mcpServer}.${mcpTool} ${args.join(" ")}`;

    // Always log the call — this is the primary context pipeline, not optional debug info
    console.log(
      `${TAG} calling ${mcpServer}.${mcpTool} profile=${resolvedProfile || "NONE"} agent=${agentId || "NONE"} channel=${channelId || "?"} msgLen=${messageText.length}`,
    );

    const { stdout, stderr } = await execAsync(command, {
      timeout: timeoutMs,
      maxBuffer: 2 * 1024 * 1024, // 2MB buffer to handle large context responses
    });

    if (stderr && !stdout) {
      console.error(`${TAG} call failed (stderr only): ${stderr.substring(0, 500)}`);
      return null;
    }

    const result = JSON.parse(stdout.trim());
    const latencyMs = Date.now() - startTime;

    // Detect RG-level errors (e.g., "No context profile resolved")
    if (result.error) {
      console.error(
        `${TAG} RG returned error: ${result.error} | resolution=${JSON.stringify(result.resolution_attempted || {})} | profile=${resolvedProfile || "NONE"} agent=${agentId || "NONE"}`,
      );
      return null;
    }

    // Handle both snake_case and camelCase response formats
    const contextBlock = result.context_block ?? result.contextBlock ?? "";
    const identityBlock = result.identity_block ?? result.identityBlock ?? "";
    const metadata = result.metadata ?? {};

    // Log success with key metrics — always visible
    console.log(
      `${TAG} OK ${latencyMs}ms | context=${contextBlock.length}c identity=${identityBlock.length}c | profile=${resolvedProfile || "?"} | stdout=${stdout.length}b | complexity=${metadata.rewriter_complexity || "?"} model_hint=${metadata.recommended_model || "none"}`,
    );

    // Warn if we got a response but no content — something is wrong
    if (!contextBlock && !identityBlock) {
      console.warn(
        `${TAG} WARNING: RG returned success but EMPTY context and identity blocks. Profile may be misconfigured. raw_keys=${Object.keys(result).join(",")}`,
      );
    }

    return {
      contextBlock,
      identityBlock: identityBlock || undefined,
      metadata: {
        ...metadata,
        latencyMs,
      },
    };
  } catch (error) {
    // Always log failures — this is critical infrastructure
    console.error(`${TAG} FAILED: ${String(error)}`);
    return null;
  }
}

/**
 * Build system prompt section from context hook result.
 */
const CONTEXT_AUTHORITY_PREFIX =
  "⚠️ AUTHORITATIVE CONTEXT (from knowledge system — takes precedence over conversation history below):\n" +
  "When any information here conflicts with conversation history, ALWAYS use this section as the source of truth.\n";

export function buildContextHookPrompt(result: ContextHookResult | null): string {
  if (!result || !result.contextBlock?.trim()) {
    return "";
  }
  return CONTEXT_AUTHORITY_PREFIX + result.contextBlock;
}

/**
 * Extract the last N messages from a combined history body.
 * The body format uses "[Chat messages since your last reply - for context]" as a marker,
 * followed by formatted message entries, then "[Current message]".
 * Returns a compact string of recent messages for query context.
 */
export function extractRecentHistory(body: string, count: number): string | undefined {
  const markerIndex = body.indexOf("[Chat messages since your last reply");
  if (markerIndex === -1) return undefined;

  const currentIndex = body.indexOf("[Current message]");
  if (currentIndex === -1) return undefined;

  const historySection = body.substring(markerIndex, currentIndex).trim();
  const lines = historySection.split("\n").filter((l) => l.trim());

  // Take last N lines (each formatted message entry is roughly one line)
  // Filter out the marker line itself
  const messageLines = lines.filter((l) => !l.startsWith("[Chat messages"));
  const recent = messageLines.slice(-count);

  if (recent.length === 0) return undefined;
  return recent.map((l) => `[recent] ${l}`).join("\n");
}

/**
 * Escape string for shell command arguments.
 */
function escapeForShell(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\$/g, "\\$")
    .replace(/`/g, "\\`")
    .replace(/\n/g, "\\n");
}
