import { describe, expect, it } from "vitest";

import { ProductionEnvironmentSchema } from "@/lib/production-environment";

const validEnvironment = {
  POSTGRES_USER: "kanni",
  POSTGRES_PASSWORD: "correct-horse-battery-staple",
  POSTGRES_DB: "kanni",
  AUTH_SECRET: "an-authentication-secret-with-more-than-32-characters",
  AUTH_TRUST_PROXY: "false",
  APP_PORT: "3001",
  DATABASE_POOL_SIZE: "10",
  NEXT_PUBLIC_APP_URL: "https://kanni.example.org",
  REVIEW_ACCESS_VISIBLE: "false",
  KANNI_SEED_LOCAL_ACCOUNTS: "false",
  GROWTH_AI_PROVIDER: "disabled",
  GROWTH_AI_MODEL: "openai/gpt-5.6-sol",
  OPENROUTER_API_KEY: "",
  GROWTH_AI_ENABLED: "false",
  GROWTH_AI_RATE_LIMIT_CONFIRMED: "false",
  GROWTH_AI_SPEND_LIMIT_CONFIRMED: "false",
};

describe("ProductionEnvironmentSchema", () => {
  it("accepts an AI-disabled production environment", () => {
    expect(ProductionEnvironmentSchema.safeParse(validEnvironment).success).toBe(
      true,
    );
  });

  it("rejects example secrets and visible review credentials", () => {
    const result = ProductionEnvironmentSchema.safeParse({
      ...validEnvironment,
      POSTGRES_PASSWORD: "replace-this-password",
      REVIEW_ACCESS_VISIBLE: "true",
    });
    expect(result.success).toBe(false);
  });

  it("rejects database passwords that would break the connection URL", () => {
    const result = ProductionEnvironmentSchema.safeParse({
      ...validEnvironment,
      POSTGRES_PASSWORD: "unsafe:password@database",
    });
    expect(result.success).toBe(false);
  });

  it("requires provider controls whenever AI is enabled", () => {
    const result = ProductionEnvironmentSchema.safeParse({
      ...validEnvironment,
      GROWTH_AI_ENABLED: "true",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          "GROWTH_AI_PROVIDER",
          "OPENROUTER_API_KEY",
          "GROWTH_AI_RATE_LIMIT_CONFIRMED",
          "GROWTH_AI_SPEND_LIMIT_CONFIRMED",
        ]),
      );
    }
  });
});
