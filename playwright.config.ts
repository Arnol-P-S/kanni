import { defineConfig, devices } from "@playwright/test";

const testDatabase =
  process.env.TEST_DATABASE_URL ??
  "postgresql://kanni:kanni_local_only_change_me@127.0.0.1:5436/kanni_test?schema=public";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3174",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "corepack pnpm db:test:prepare && corepack pnpm db:seed && mkdir -p .next/standalone/.next/static .next/standalone/public && cp -R .next/static/. .next/standalone/.next/static/ && cp -R public/. .next/standalone/public/ && node .next/standalone/server.js",
    url: "http://127.0.0.1:3174/api/health",
    env: {
      DATABASE_URL: testDatabase,
      HOSTNAME: "127.0.0.1",
      PORT: "3174",
      AUTH_SECRET: "kanni-e2e-auth-secret-with-at-least-32-characters",
      KANNI_SEED_LOCAL_ACCOUNTS: "true",
      REVIEW_ACCESS_VISIBLE: "true",
      GROWTH_AI_ENABLED: "false",
      GROWTH_AI_PROVIDER: "disabled",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
