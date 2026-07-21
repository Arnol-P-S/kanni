import { describe, expect, it } from "vitest";

import { ProductionEnvironmentSchema } from "@/lib/production-environment";

const validEnvironment = {
  POSTGRES_USER: "kanni",
  POSTGRES_PASSWORD: "correct-horse-battery-staple",
  POSTGRES_DB: "kanni",
  AUTH_SECRET: "an-authentication-secret-with-more-than-32-characters",
  AUTH_TRUST_PROXY: "false",
  APP_HOST: "127.0.0.1",
  APP_PORT: "3001",
  DATABASE_POOL_SIZE: "10",
  NEXT_PUBLIC_APP_URL: "https://kanni.example.org",
  GROWTH_AI_PROVIDER: "disabled",
  GROWTH_AI_MODEL: "openai/gpt-5.6-sol",
  OPENROUTER_API_KEY: "",
  GROWTH_AI_ENABLED: "false",
  GROWTH_AI_RATE_LIMIT_CONFIRMED: "false",
  GROWTH_AI_SPEND_LIMIT_CONFIRMED: "false",
  GROWTH_AI_STUDENT_HELP_ENABLED: "false",
  GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED: "false",
};

describe("ProductionEnvironmentSchema", () => {
  it("accepts an AI-disabled production environment", () => {
    expect(ProductionEnvironmentSchema.safeParse(validEnvironment).success).toBe(
      true,
    );
  });

  it("rejects example secrets", () => {
    const result = ProductionEnvironmentSchema.safeParse({
      ...validEnvironment,
      POSTGRES_PASSWORD: "replace-this-password",
    });
    expect(result.success).toBe(false);
  });

  it("accepts only explicit loopback or all-interface host bindings", () => {
    expect(
      ProductionEnvironmentSchema.safeParse({
        ...validEnvironment,
        APP_HOST: "localhost",
      }).success,
    ).toBe(false);
    expect(
      ProductionEnvironmentSchema.safeParse({
        ...validEnvironment,
        APP_HOST: "0.0.0.0",
      }).success,
    ).toBe(true);
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

  it("rejects a placeholder provider key when AI is enabled", () => {
    const result = ProductionEnvironmentSchema.safeParse({
      ...validEnvironment,
      GROWTH_AI_PROVIDER: "openrouter",
      OPENROUTER_API_KEY: "set_server_side_only",
      GROWTH_AI_ENABLED: "true",
      GROWTH_AI_RATE_LIMIT_CONFIRMED: "true",
      GROWTH_AI_SPEND_LIMIT_CONFIRMED: "true",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toContain(
        "OPENROUTER_API_KEY",
      );
    }
  });

  it("rejects student help until AI and student-data review are both confirmed", () => {
    const result = ProductionEnvironmentSchema.safeParse({
      ...validEnvironment,
      GROWTH_AI_STUDENT_HELP_ENABLED: "true",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          "GROWTH_AI_STUDENT_HELP_ENABLED",
          "GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED",
        ]),
      );
    }
  });

  it("accepts student help after all provider and data controls are confirmed", () => {
    const result = ProductionEnvironmentSchema.safeParse({
      ...validEnvironment,
      GROWTH_AI_PROVIDER: "openrouter",
      OPENROUTER_API_KEY: "provider-issued-key-long-enough",
      GROWTH_AI_ENABLED: "true",
      GROWTH_AI_RATE_LIMIT_CONFIRMED: "true",
      GROWTH_AI_SPEND_LIMIT_CONFIRMED: "true",
      GROWTH_AI_STUDENT_HELP_ENABLED: "true",
      GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED: "true",
    });
    expect(result.success).toBe(true);
  });
});
