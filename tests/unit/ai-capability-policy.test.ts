import { describe, expect, it } from "vitest";

import { evaluateGrowthAiCapability } from "@/lib/ai/capability-policy";

describe("Growth AI release policy", () => {
  it("is disabled unless explicitly enabled", () => {
    expect(evaluateGrowthAiCapability({}).reason).toBe("disabled_by_flag");
  });

  it("requires the approved provider, model, and credential", () => {
    expect(
      evaluateGrowthAiCapability({ GROWTH_AI_ENABLED: "true" }).reason,
    ).toBe("provider_disabled");
    expect(
      evaluateGrowthAiCapability({
        GROWTH_AI_ENABLED: "true",
        GROWTH_AI_PROVIDER: "openrouter",
      }).reason,
    ).toBe("missing_credentials");
    expect(
      evaluateGrowthAiCapability({
        GROWTH_AI_ENABLED: "true",
        GROWTH_AI_PROVIDER: "openrouter",
        OPENROUTER_API_KEY: "test-key",
        GROWTH_AI_MODEL: "unapproved/model",
      }).reason,
    ).toBe("model_not_allowed");
  });

  it("requires explicit cost and traffic controls in production", () => {
    const production = {
      NODE_ENV: "production",
      GROWTH_AI_ENABLED: "true",
      GROWTH_AI_PROVIDER: "openrouter",
      OPENROUTER_API_KEY: "test-key",
      GROWTH_AI_MODEL: "openai/gpt-5.6-sol",
    };
    expect(evaluateGrowthAiCapability(production).reason).toBe(
      "release_controls_missing",
    );
    expect(
      evaluateGrowthAiCapability({
        ...production,
        GROWTH_AI_RATE_LIMIT_CONFIRMED: "true",
        GROWTH_AI_SPEND_LIMIT_CONFIRMED: "true",
      }).available,
    ).toBe(true);
  });
});
