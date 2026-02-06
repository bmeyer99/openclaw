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
 *         "budgetTokens": 60000
 *       }
 *     }
 *   }
 * }
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logVerbose } from "../../globals.js";

const execAsync = promisify(exec);

export interface ContextHookConfig {
  enabled?: boolean;
  /** MCP server name (e.g., "raggedy-graphy", "my-rag") */
  mcpServer?: string;
  /** MCP tool name to call (default: "build_agent_context") */
  mcpTool?: string;
  /** Timeout in milliseconds (default: 10000) */
  timeoutMs?: number;
  /** Token budget for context (default: 60000) */
  budgetTokens?: number;
}

export interface ContextHookResult {
  contextBlock: string;
  metadata?: {
    tokensUsed?: number;
    latencyMs?: number;
    [key: string]: unknown;
  };
}

export interface ContextHookParams {
  messageText: string;
  senderName?: string;
  threadId?: string;
  channelId?: string;
  sessionKey?: string;
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
  } = config;

  const { messageText, senderName, threadId, channelId } = params;

  // Skip if message is too short
  if (messageText.trim().length < 10) {
    return null;
  }

  try {
    const startTime = Date.now();

    // Build mcporter command with generic parameters
    const args: string[] = [`message_text="${escapeForShell(messageText)}"`];

    if (senderName) {
      args.push(`sender_name="${escapeForShell(senderName)}"`);
    }
    if (threadId) {
      args.push(`thread_ts="${threadId}"`);
    }
    if (channelId) {
      args.push(`channel_id="${channelId}"`);
    }
    if (budgetTokens) {
      args.push(`context_budget_tokens=${budgetTokens}`);
    }

    const command = `mcporter call ${mcpServer}.${mcpTool} ${args.join(" ")}`;

    logVerbose(`mcp-context-hook: calling ${mcpServer}.${mcpTool}`);

    const { stdout, stderr } = await execAsync(command, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
    });

    if (stderr && !stdout) {
      logVerbose(`mcp-context-hook: call failed: ${stderr}`);
      return null;
    }

    const result = JSON.parse(stdout.trim());
    const latencyMs = Date.now() - startTime;

    logVerbose(`mcp-context-hook: fetched in ${latencyMs}ms`);

    // Handle both snake_case and camelCase response formats
    const contextBlock = result.context_block ?? result.contextBlock ?? "";
    const metadata = result.metadata ?? {};

    return {
      contextBlock,
      metadata: {
        ...metadata,
        latencyMs,
      },
    };
  } catch (error) {
    logVerbose(`mcp-context-hook: failed: ${String(error)}`);
    return null;
  }
}

/**
 * Build system prompt section from context hook result.
 */
export function buildContextHookPrompt(result: ContextHookResult | null): string {
  if (!result || !result.contextBlock?.trim()) {
    return "";
  }
  return result.contextBlock;
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
