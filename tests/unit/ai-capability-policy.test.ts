import { describe, expect, it } from "vitest";

import {
  evaluateGrowthAiCapability,
  evaluateStudentAiCapability,
  providerAllowlistForGrowthModel,
} from "@/lib/ai/capability-policy";

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
      OPENROUTER_API_KEY: "sk-or-test-provider-key",
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

  it("rejects short and placeholder provider credentials", () => {
    const base = {
      GROWTH_AI_ENABLED: "true",
      GROWTH_AI_PROVIDER: "openrouter",
      GROWTH_AI_MODEL: "openai/gpt-5.6-luna",
    };
    expect(
      evaluateGrowthAiCapability({
        ...base,
        OPENROUTER_API_KEY: "short-key",
      }).reason,
    ).toBe("missing_credentials");
    expect(
      evaluateGrowthAiCapability({
        ...base,
        OPENROUTER_API_KEY: "replace-with-real-key",
      }).reason,
    ).toBe("missing_credentials");
  });

  it("uses a provider route that exists for each allowed GPT-5.6 model", () => {
    expect(providerAllowlistForGrowthModel()).toEqual(["openai"]);
  });

  it("keeps student AI behind separate enablement and data-review controls", () => {
    const enabled = {
      GROWTH_AI_ENABLED: "true",
      GROWTH_AI_PROVIDER: "openrouter",
      GROWTH_AI_MODEL: "openai/gpt-5.6-luna",
      OPENROUTER_API_KEY: "test-provider-key-long-enough",
    };

    expect(evaluateGrowthAiCapability(enabled).available).toBe(true);
    expect(evaluateStudentAiCapability(enabled).reason).toBe(
      "student_help_disabled",
    );
    expect(
      evaluateStudentAiCapability({
        ...enabled,
        GROWTH_AI_STUDENT_HELP_ENABLED: "true",
      }).reason,
    ).toBe("student_data_review_missing");
    expect(
      evaluateStudentAiCapability({
        ...enabled,
        GROWTH_AI_STUDENT_HELP_ENABLED: "true",
        GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED: "true",
      }).available,
    ).toBe(true);
  });
});
