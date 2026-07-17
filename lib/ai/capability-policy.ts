const DEFAULT_MODEL = "openai/gpt-5.6-sol";

export type GrowthAiEnvironment = Record<string, string | undefined>;

export type GrowthAiCapability = {
  available: boolean;
  provider: "openrouter" | "disabled";
  model: string;
  reason:
    | "available"
    | "disabled_by_flag"
    | "provider_disabled"
    | "missing_credentials"
    | "model_not_allowed"
    | "release_controls_missing";
};

export function evaluateGrowthAiCapability(
  environment: GrowthAiEnvironment,
): GrowthAiCapability {
  const model = environment.GROWTH_AI_MODEL?.trim() || DEFAULT_MODEL;
  if (environment.GROWTH_AI_ENABLED !== "true") {
    return {
      available: false,
      provider: "disabled",
      model,
      reason: "disabled_by_flag",
    };
  }
  if ((environment.GROWTH_AI_PROVIDER?.trim() || "disabled") !== "openrouter") {
    return {
      available: false,
      provider: "disabled",
      model,
      reason: "provider_disabled",
    };
  }
  if (model !== DEFAULT_MODEL) {
    return {
      available: false,
      provider: "openrouter",
      model,
      reason: "model_not_allowed",
    };
  }
  if (!environment.OPENROUTER_API_KEY?.trim()) {
    return {
      available: false,
      provider: "openrouter",
      model,
      reason: "missing_credentials",
    };
  }
  if (
    environment.NODE_ENV === "production" &&
    (environment.GROWTH_AI_RATE_LIMIT_CONFIRMED !== "true" ||
      environment.GROWTH_AI_SPEND_LIMIT_CONFIRMED !== "true")
  ) {
    return {
      available: false,
      provider: "openrouter",
      model,
      reason: "release_controls_missing",
    };
  }
  return { available: true, provider: "openrouter", model, reason: "available" };
}
