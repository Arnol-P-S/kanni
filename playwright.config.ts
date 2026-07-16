import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 2 : 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "corepack pnpm start --hostname 127.0.0.1 --port 3173",
    url: "http://127.0.0.1:3173/api/health",
    env: {
      DEMO_SESSION_SECRET: "kanni-e2e-only-secret-with-at-least-32-characters",
      DEMO_SECURE_COOKIES: "false",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
