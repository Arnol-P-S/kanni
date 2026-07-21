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
const ProviderSecret = z
  .string()
  .min(16)
  .max(512)
  .refine(
    (value) =>
      !/replace|change[-_ ]?me|placeholder|example|set[-_ ]?server[-_ ]?side/i.test(
        value,
      ),
    "must be replaced with a provider-issued value",
  );
export const ProductionEnvironmentSchema = z
  .object({
    POSTGRES_USER: z.string().trim().min(1).max(63),
    POSTGRES_PASSWORD: DatabasePassword,
    POSTGRES_DB: z.string().trim().min(1).max(63),
    AUTH_SECRET: SecretValue.min(32),
    AUTH_TRUST_PROXY: BooleanFlag,
    APP_HOST: z.enum(["127.0.0.1", "0.0.0.0"]).default("127.0.0.1"),
    APP_PORT: z.coerce.number().int().min(1).max(65_535),
    DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(50),
    NEXT_PUBLIC_APP_URL: z
      .url()
      .refine((value) => new URL(value).protocol === "https:", "must use HTTPS"),
    GROWTH_AI_PROVIDER: z.enum(["disabled", "openrouter"]),
    GROWTH_AI_MODEL: z.enum([
      "openai/gpt-5.6-luna",
      "openai/gpt-5.6-sol",
    ]),
    OPENROUTER_API_KEY: z.string().max(512),
    GROWTH_AI_ENABLED: BooleanFlag,
    GROWTH_AI_RATE_LIMIT_CONFIRMED: BooleanFlag,
    GROWTH_AI_SPEND_LIMIT_CONFIRMED: BooleanFlag,
    GROWTH_AI_STUDENT_HELP_ENABLED: BooleanFlag.default("false"),
    GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED: BooleanFlag.default("false"),
  })
  .passthrough()
  .superRefine((environment, context) => {
    if (environment.GROWTH_AI_ENABLED === "true") {
      if (environment.GROWTH_AI_PROVIDER !== "openrouter") {
        context.addIssue({
          code: "custom",
          path: ["GROWTH_AI_PROVIDER"],
          message: "must be openrouter when AI is enabled",
        });
      }
      if (!ProviderSecret.safeParse(environment.OPENROUTER_API_KEY.trim()).success) {
        context.addIssue({
          code: "custom",
          path: ["OPENROUTER_API_KEY"],
          message: "must be a provider-issued value when AI is enabled",
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
    }
    if (environment.GROWTH_AI_STUDENT_HELP_ENABLED === "true") {
      if (environment.GROWTH_AI_ENABLED !== "true") {
        context.addIssue({
          code: "custom",
          path: ["GROWTH_AI_STUDENT_HELP_ENABLED"],
          message: "requires the bounded AI capability to be enabled",
        });
      }
      if (environment.GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED !== "true") {
        context.addIssue({
          code: "custom",
          path: ["GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED"],
          message: "must be true after reviewing student-data processing",
        });
      }
    }
  });
