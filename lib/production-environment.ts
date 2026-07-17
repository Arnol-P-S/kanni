import { z } from "zod";

const BooleanFlag = z.enum(["true", "false"]);
const SecretValue = z
  .string()
  .min(16)
  .max(256)
  .refine(
    (value) => !/replace|change[-_ ]?me|local[-_ ]?only/i.test(value),
    "must be replaced with a deployment-specific value",
  );
const DatabasePassword = SecretValue.regex(
  /^[A-Za-z0-9_-]+$/u,
  "must use URL-safe letters, numbers, underscores, or hyphens",
);

export const ProductionEnvironmentSchema = z
  .object({
    POSTGRES_USER: z.string().trim().min(1).max(63),
    POSTGRES_PASSWORD: DatabasePassword,
    POSTGRES_DB: z.string().trim().min(1).max(63),
    AUTH_SECRET: SecretValue.min(32),
    AUTH_TRUST_PROXY: BooleanFlag,
    APP_PORT: z.coerce.number().int().min(1).max(65_535),
    DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(50),
    NEXT_PUBLIC_APP_URL: z
      .url()
      .refine((value) => new URL(value).protocol === "https:", "must use HTTPS"),
    REVIEW_ACCESS_VISIBLE: z.literal("false"),
    KANNI_SEED_LOCAL_ACCOUNTS: z.literal("false"),
    GROWTH_AI_PROVIDER: z.enum(["disabled", "openrouter"]),
    GROWTH_AI_MODEL: z.enum([
      "openai/gpt-5.6-luna",
      "openai/gpt-5.6-sol",
    ]),
    OPENROUTER_API_KEY: z.string().max(512),
    GROWTH_AI_ENABLED: BooleanFlag,
    GROWTH_AI_RATE_LIMIT_CONFIRMED: BooleanFlag,
    GROWTH_AI_SPEND_LIMIT_CONFIRMED: BooleanFlag,
  })
  .passthrough()
  .superRefine((environment, context) => {
    if (environment.GROWTH_AI_ENABLED !== "true") return;
    if (environment.GROWTH_AI_PROVIDER !== "openrouter") {
      context.addIssue({
        code: "custom",
        path: ["GROWTH_AI_PROVIDER"],
        message: "must be openrouter when AI is enabled",
      });
    }
    if (environment.OPENROUTER_API_KEY.trim().length < 16) {
      context.addIssue({
        code: "custom",
        path: ["OPENROUTER_API_KEY"],
        message: "is required when AI is enabled",
      });
    }
    for (const key of [
      "GROWTH_AI_RATE_LIMIT_CONFIRMED",
      "GROWTH_AI_SPEND_LIMIT_CONFIRMED",
    ] as const) {
      if (environment[key] !== "true") {
        context.addIssue({
          code: "custom",
          path: [key],
          message: "must be true when AI is enabled",
        });
      }
    }
  });
