import { defineConfig, devices } from "@playwright/test";

const testDatabase =
  process.env.TEST_DATABASE_URL ??
  "postgresql://kanni:kanni_local_only_change_me@127.0.0.1:5436/kanni_test?schema=public";
const externalBaseUrl = process.env.PLAYWRIGHT_EXTERNAL_BASE_URL?.trim();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: "line",
  use: {
    baseURL: externalBaseUrl || "http://127.0.0.1:3174",
    actionTimeout: 10_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalBaseUrl
    ? undefined
    : {
        command:
          "corepack pnpm db:test:prepare && corepack pnpm build && mkdir -p .next/standalone/.next/static .next/standalone/public && cp -R .next/static/. .next/standalone/.next/static/ && cp -R public/. .next/standalone/public/ && node .next/standalone/server.js",
        url: "http://127.0.0.1:3174/api/health",
        env: {
          DATABASE_URL: testDatabase,
          HOSTNAME: "127.0.0.1",
          PORT: "3174",
          AUTH_SECRET: "kanni-e2e-auth-secret-with-at-least-32-characters",
          GROWTH_AI_ENABLED: "false",
          GROWTH_AI_PROVIDER: "disabled",
          GROWTH_AI_MODEL: "openai/gpt-5.6-luna",
          OPENROUTER_API_KEY: "",
          GROWTH_AI_STUDENT_HELP_ENABLED: "false",
          GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED: "false",
        },
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
