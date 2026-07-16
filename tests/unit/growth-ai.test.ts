import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalEnvironment = { ...process.env };

describe("optional GrowthCycle AI", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.AI_DEMO_ENABLED;
    delete process.env.GROWTH_AI_PROVIDER;
    delete process.env.GROWTH_AI_MODEL;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROWTH_AI_RATE_LIMIT_CONFIRMED;
    delete process.env.GROWTH_AI_SPEND_LIMIT_CONFIRMED;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...originalEnvironment };
  });

  it("fails closed by default and names the configured model without exposing a key", async () => {
    const { getGrowthAiCapability } = await import("@/lib/ai/growth-ai");
    expect(getGrowthAiCapability()).toEqual({
      available: false,
      provider: "disabled",
      model: "openai/gpt-5.6-sol",
      reason: "disabled_by_flag",
    });
  });

  it("requires both the OpenRouter provider selection and a credential", async () => {
    process.env.AI_DEMO_ENABLED = "true";
    process.env.GROWTH_AI_PROVIDER = "openrouter";
    const { getGrowthAiCapability } = await import("@/lib/ai/growth-ai");
    expect(getGrowthAiCapability()).toMatchObject({
      available: false,
      provider: "openrouter",
      reason: "missing_credentials",
    });
  });

  it("reports the exact model when all activation gates are present", async () => {
    process.env.AI_DEMO_ENABLED = "true";
    process.env.GROWTH_AI_PROVIDER = "openrouter";
    process.env.GROWTH_AI_MODEL = "openai/gpt-5.6-sol";
    process.env.OPENROUTER_API_KEY = "test-key-not-a-real-secret";
    const { getGrowthAiCapability } = await import("@/lib/ai/growth-ai");
    expect(getGrowthAiCapability()).toEqual({
      available: true,
      provider: "openrouter",
      model: "openai/gpt-5.6-sol",
      reason: "available",
    });
  });

  it("rejects an unapproved model and requires release controls in production", async () => {
    process.env.AI_DEMO_ENABLED = "true";
    process.env.GROWTH_AI_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "test-key-not-a-real-secret";
    process.env.GROWTH_AI_MODEL = "another/model";
    let growthAiModule = await import("@/lib/ai/growth-ai");
    expect(growthAiModule.getGrowthAiCapability().reason).toBe(
      "model_not_allowed",
    );

    vi.resetModules();
    process.env.GROWTH_AI_MODEL = "openai/gpt-5.6-sol";
    vi.stubEnv("NODE_ENV", "production");
    growthAiModule = await import("@/lib/ai/growth-ai");
    expect(growthAiModule.getGrowthAiCapability().reason).toBe(
      "release_controls_missing",
    );

    process.env.GROWTH_AI_RATE_LIMIT_CONFIRMED = "true";
    process.env.GROWTH_AI_SPEND_LIMIT_CONFIRMED = "true";
    expect(growthAiModule.getGrowthAiCapability().available).toBe(true);
  });

  it("returns the reviewed plan and support without constructing a provider", async () => {
    const {
      generateStudentSupportDraft,
      generateTeacherPlanDraft,
    } = await import("@/lib/ai/growth-ai");
    const plan = await generateTeacherPlanDraft();
    const support = await generateStudentSupportDraft();
    expect(plan.origin).toBe("project_authored");
    expect(plan.draft.sourceSectionIds).toEqual(
      expect.arrayContaining(["fractions-goal"]),
    );
    expect(support.origin).toBe("project_authored");
    expect(support.support.sourceSectionIds).toEqual(["fractions-visual"]);
  });

  it("uses a strategy-specific reviewed fallback", async () => {
    const { generateStudentSupportDraft } = await import(
      "@/lib/ai/growth-ai"
    );
    const support = await generateStudentSupportDraft("guided_questions");
    expect(support.origin).toBe("project_authored");
    expect(support.support.explanation).toMatch(/three things/i);
  });
});
