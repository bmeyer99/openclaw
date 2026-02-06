/**
 * RAG Context Injection for OpenClaw
 *
 * Calls the raggedy-graphy MCP tool to build rich context
 * for agent turns based on message content and thread context.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logVerbose } from "../../globals.js";

const execAsync = promisify(exec);

export interface RagContextResult {
  contextBlock: string;
  metadata: {
    tokensUsed: number;
    entitiesDetected: string[];
    latencyMs: number;
  };
}

export interface RagContextParams {
  messageText: string;
  senderName?: string;
  threadTs?: string;
  channelId?: string;
  contextBudgetTokens?: number;
}

/**
 * Fetch RAG context from raggedy-graphy MCP tool.
 * Returns empty context if the call fails (graceful degradation).
 */
export async function fetchRagContext(params: RagContextParams): Promise<RagContextResult | null> {
  const {
    messageText,
    senderName = "unknown",
    threadTs,
    channelId,
    contextBudgetTokens = 120000,
  } = params;

  // Skip if message is too short to benefit from context
  if (messageText.trim().length < 10) {
    return null;
  }

  try {
    const startTime = Date.now();

    // Build mcporter command
    const args = [
      `message_text="${escapeForShell(messageText)}"`,
      `sender_name="${escapeForShell(senderName)}"`,
      `context_budget_tokens=${contextBudgetTokens}`,
    ];

    if (threadTs) {
      args.push(`thread_ts="${threadTs}"`);
    }
    if (channelId) {
      args.push(`channel_id="${channelId}"`);
    }

    const command = `mcporter call raggedy-graphy.build_agent_context ${args.join(" ")}`;

    logVerbose(`rag-context: calling MCP tool`);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000, // 10 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    if (stderr && !stdout) {
      logVerbose(`rag-context: MCP call failed: ${stderr}`);
      return null;
    }

    const result = JSON.parse(stdout.trim());
    const latencyMs = Date.now() - startTime;

    logVerbose(
      `rag-context: fetched in ${latencyMs}ms, ${result.metadata?.tokens_used ?? 0} tokens`,
    );

    return {
      contextBlock: result.context_block || "",
      metadata: {
        tokensUsed: result.metadata?.tokens_used ?? 0,
        entitiesDetected: result.metadata?.entities_detected ?? [],
        latencyMs,
      },
    };
  } catch (error) {
    logVerbose(`rag-context: failed to fetch context: ${String(error)}`);
    return null;
  }
}

/**
 * Build the system prompt injection from RAG context.
 */
export function buildRagContextPrompt(context: RagContextResult | null): string {
  if (!context || !context.contextBlock.trim()) {
    return "";
  }

  // The context block is already formatted as markdown by the MCP tool
  return context.contextBlock;
}

/**
 * Escape string for shell command arguments.
 */
function escapeForShell(str: string): string {
  // Replace problematic characters
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\$/g, "\\$")
    .replace(/`/g, "\\`")
    .replace(/\n/g, "\\n");
}
