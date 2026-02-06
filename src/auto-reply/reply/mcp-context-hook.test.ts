import { describe, expect, it } from "vitest";
import { buildContextHookPrompt, extractRecentHistory } from "./mcp-context-hook.js";

describe("extractRecentHistory", () => {
  const sampleBody = [
    "[Chat messages since your last reply - for context]",
    "[Slack #general 2026-02-06 14:00] Alice: First message",
    "[Slack #general 2026-02-06 14:01] Bob: Second message",
    "[Slack #general 2026-02-06 14:02] Alice: Third message",
    "[Slack #general 2026-02-06 14:03] Bob: Fourth message",
    "[Slack #general 2026-02-06 14:04] Alice: Fifth message",
    "[Slack #general 2026-02-06 14:05] Bob: Sixth message",
    "[Current message] Alice: The actual question",
  ].join("\n");

  it("extracts the last N messages from history", () => {
    const result = extractRecentHistory(sampleBody, 3);
    expect(result).toBeDefined();
    expect(result).toContain("Fourth message");
    expect(result).toContain("Fifth message");
    expect(result).toContain("Sixth message");
    expect(result).not.toContain("Third message");
  });

  it("returns undefined when no history marker is present", () => {
    const result = extractRecentHistory("Just a plain message", 5);
    expect(result).toBeUndefined();
  });

  it("returns undefined when no current message marker is present", () => {
    const body = "[Chat messages since your last reply - for context]\nSome message";
    const result = extractRecentHistory(body, 5);
    expect(result).toBeUndefined();
  });

  it("prefixes each line with [recent]", () => {
    const result = extractRecentHistory(sampleBody, 2);
    expect(result).toBeDefined();
    const lines = result!.split("\n");
    for (const line of lines) {
      expect(line).toMatch(/^\[recent\] /);
    }
  });

  it("returns all messages when count exceeds available", () => {
    const result = extractRecentHistory(sampleBody, 100);
    expect(result).toBeDefined();
    expect(result).toContain("First message");
    expect(result).toContain("Sixth message");
  });
});

describe("buildContextHookPrompt", () => {
  it("returns empty string for null result", () => {
    expect(buildContextHookPrompt(null)).toBe("");
  });

  it("returns empty string for empty context block", () => {
    expect(buildContextHookPrompt({ contextBlock: "" })).toBe("");
    expect(buildContextHookPrompt({ contextBlock: "   " })).toBe("");
  });

  it("returns the context block as-is when present", () => {
    const result = buildContextHookPrompt({
      contextBlock: "## Relevant Context\nSome knowledge here.",
      metadata: { latencyMs: 150 },
    });
    expect(result).toBe("## Relevant Context\nSome knowledge here.");
  });
});
