import { describe, expect, it } from "vitest";
import { buildSubagentSystemPrompt } from "./subagent-announce.js";

describe("buildSubagentSystemPrompt", () => {
  it("includes task description in the role section", () => {
    const prompt = buildSubagentSystemPrompt({
      childSessionKey: "agent:main:subagent:test-1",
      task: "Deploy the recording service to Cloud Run",
    });

    expect(prompt).toContain("Deploy the recording service to Cloud Run");
    expect(prompt).toContain("# Subagent Context");
    expect(prompt).toContain("## Your Role");
  });

  it("includes session metadata", () => {
    const prompt = buildSubagentSystemPrompt({
      requesterSessionKey: "agent:main:main",
      requesterOrigin: { channel: "slack" },
      childSessionKey: "agent:main:subagent:test-2",
      label: "deploy-task",
      task: "Deploy service",
    });

    expect(prompt).toContain("## Session Context");
    expect(prompt).toContain("Label: deploy-task");
    expect(prompt).toContain("Requester session: agent:main:main");
    expect(prompt).toContain("Requester channel: slack");
    expect(prompt).toContain("Your session: agent:main:subagent:test-2");
  });

  it("omits ragContext section when not provided", () => {
    const prompt = buildSubagentSystemPrompt({
      childSessionKey: "agent:main:subagent:test-3",
      task: "Run tests",
    });

    expect(prompt).not.toContain("## Project Context");
  });

  it("includes ragContext as Project Context when provided", () => {
    const ragContext = [
      "## Thread Context",
      "Recent discussion about Firebase auth migration.",
      "",
      "## Relevant Context",
      "PitchPen uses Express on Cloud Run with Firebase Auth.",
    ].join("\n");

    const prompt = buildSubagentSystemPrompt({
      childSessionKey: "agent:main:subagent:test-4",
      task: "Add structured logging",
      ragContext,
    });

    expect(prompt).toContain("## Project Context");
    expect(prompt).toContain("Firebase auth migration");
    expect(prompt).toContain("Express on Cloud Run");
  });

  it("places ragContext after rules but before session context", () => {
    const prompt = buildSubagentSystemPrompt({
      childSessionKey: "agent:main:subagent:test-5",
      task: "Add logging",
      ragContext: "Architecture: microservices on GCP",
    });

    const rulesIndex = prompt.indexOf("## Rules");
    const projectContextIndex = prompt.indexOf("## Project Context");
    const sessionContextIndex = prompt.indexOf("## Session Context");

    expect(rulesIndex).toBeGreaterThanOrEqual(0);
    expect(projectContextIndex).toBeGreaterThan(rulesIndex);
    expect(sessionContextIndex).toBeGreaterThan(projectContextIndex);
  });

  it("ignores ragContext that is only whitespace", () => {
    const prompt = buildSubagentSystemPrompt({
      childSessionKey: "agent:main:subagent:test-6",
      task: "Test task",
      ragContext: "   \n   ",
    });

    expect(prompt).not.toContain("## Project Context");
  });

  it("uses placeholder when task is empty", () => {
    const prompt = buildSubagentSystemPrompt({
      childSessionKey: "agent:main:subagent:test-7",
      task: "",
    });

    expect(prompt).toContain("{{TASK_DESCRIPTION}}");
  });

  it("collapses multi-line task text to single line", () => {
    const prompt = buildSubagentSystemPrompt({
      childSessionKey: "agent:main:subagent:test-8",
      task: "Add logging\nto the\nrecording service",
    });

    expect(prompt).toContain("Add logging to the recording service");
  });
});
