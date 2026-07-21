const DEFAULT_MODEL = "openai/gpt-5.6-luna";
const ALLOWED_MODELS = new Set([
  DEFAULT_MODEL,
  "openai/gpt-5.6-sol",
]);

export function providerAllowlistForGrowthModel(): string[] {
  return ["openai"];
}

export type GrowthAiEnvironment = Record<string, string | undefined>;

function hasUsableProviderKey(value: string | undefined): boolean {
  const key = value?.trim() ?? "";
  return (
    key.length >= 16 &&
    !/replace|change[-_ ]?me|placeholder|example|set[-_ ]?server[-_ ]?side/i.test(
      key,
    )
  );
}

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
    | "release_controls_missing"
    | "student_help_disabled"
    | "student_data_review_missing";
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
  if (!ALLOWED_MODELS.has(model)) {
    return {
      available: false,
      provider: "openrouter",
      model,
      reason: "model_not_allowed",
    };
  }
  if (!hasUsableProviderKey(environment.OPENROUTER_API_KEY)) {
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

export function evaluateStudentAiCapability(
  environment: GrowthAiEnvironment,
): GrowthAiCapability {
  const base = evaluateGrowthAiCapability(environment);
  if (!base.available) return base;
  if (environment.GROWTH_AI_STUDENT_HELP_ENABLED !== "true") {
    return { ...base, available: false, reason: "student_help_disabled" };
  }
  if (environment.GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED !== "true") {
    return { ...base, available: false, reason: "student_data_review_missing" };
  }
  return base;
}
