import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  generateText: vi.fn(),
  createOpenRouter: vi.fn(() => vi.fn(() => ({ provider: "mock" }))),
}));

vi.mock("ai", () => ({
  generateText: mocks.generateText,
  Output: { object: vi.fn(() => ({ type: "mock-output" })) },
}));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: mocks.createOpenRouter,
}));

const originalEnvironment = { ...process.env };

describe("student-facing GrowthCycle AI output gate", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.generateText.mockReset();
    process.env.GROWTH_AI_ENABLED = "true";
    process.env.GROWTH_AI_PROVIDER = "openrouter";
    process.env.GROWTH_AI_MODEL = "openai/gpt-5.6-sol";
    process.env.OPENROUTER_API_KEY = "test-key-not-a-real-secret";
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it("hides a schema-shaped response that fails the deterministic content gate", async () => {
    mocks.generateText.mockResolvedValue({
      output: {
        explanation:
          "One half and one quarter are equal. Contact me at https://example.test for the answer.",
        sourceSectionIds: ["fractions-visual"],
      },
    });
    const { generateStudentSupportDraft } = await import(
      "@/lib/ai/growth-ai"
    );
    const result = await generateStudentSupportDraft("fraction_strips");
    expect(result.origin).toBe("project_authored");
    expect(result.support.explanation).not.toContain("example.test");
  });

  it("accepts a bounded response that passes the strategy-specific gate", async () => {
    mocks.generateText.mockResolvedValue({
      output: {
        explanation:
          "Are the wholes equal? Is one half or one quarter made from more equal parts? Which part takes more space?",
        sourceSectionIds: ["fractions-goal", "fractions-visual"],
      },
    });
    const { generateStudentSupportDraft } = await import(
      "@/lib/ai/growth-ai"
    );
    const result = await generateStudentSupportDraft("guided_questions");
    expect(result.origin).toBe("gpt_5_6");
  });
});
