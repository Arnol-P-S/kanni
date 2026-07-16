import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium, type Page } from "@playwright/test";

const baseUrl = (process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3173").replace(
  /\/$/,
  "",
);
const outputDirectory = resolve(process.cwd(), "submission/screenshots");

async function capture(page: Page, name: string) {
  await page.screenshot({
    path: resolve(outputDirectory, `${name}.png`),
    animations: "disabled",
  });
  process.stdout.write(`Captured submission/screenshots/${name}.png\n`);
}

async function enterProfile(
  page: Page,
  name: "Asha" | "Meera" | "Diya" | "Arun",
) {
  await page.getByRole("radio", { name: new RegExp(name) }).check();
  await page.getByRole("checkbox", { name: /I am 18 or older/ }).check();
  await page.getByRole("button", { name: "Enter synthetic workspace" }).click();
}

async function switchProfile(
  page: Page,
  name: "Asha" | "Meera" | "Diya" | "Arun",
) {
  await page.getByRole("button", { name: "Switch demo account" }).click();
  await enterProfile(page, name);
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    colorScheme: "light",
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/`);
    await page.getByRole("heading", { name: /One learning goal/ }).waitFor();
    await capture(page, "01-home-four-role-pitch");

    await page.goto(`${baseUrl}/login`);
    await page.getByRole("heading", { name: /Choose a synthetic Kanni perspective/ }).waitFor();
    await capture(page, "02-synthetic-role-login");

    await enterProfile(page, "Asha");
    await page.getByRole("button", { name: "Confirm support circle" }).click();
    await page.getByRole("heading", { name: "Support circle mapped" }).waitFor();
    await capture(page, "03-admin-support-circle");

    await switchProfile(page, "Meera");
    await page.getByRole("heading", { name: "Compare one half and one quarter" }).waitFor();
    await capture(page, "04-teacher-reviewed-plan");
    await page.getByRole("button", { name: "Review and publish plan" }).click();

    await switchProfile(page, "Diya");
    await page.getByRole("button", { name: "One quarter" }).click();
    await page.getByRole("button", { name: "Show me another way" }).click();
    await page.getByRole("img", { name: /One half and one quarter fraction strips/ }).waitFor();
    await capture(page, "05-student-visual-support");
    await page.getByRole("radio", { name: "One half is larger" }).check();
    await page.getByRole("radio", { name: /more equal parts make each part smaller/ }).check();
    await page.getByRole("button", { name: "Send my explanation to the teacher" }).click();

    await switchProfile(page, "Meera");
    await page.getByRole("button", { name: "Approve next step and family brief" }).click();
    await switchProfile(page, "Arun");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("heading", { name: /The learner compared/ }).waitFor();
    await page.getByText("Try this once at home").scrollIntoViewIfNeeded();
    await capture(page, "06-parent-reviewed-activity-mobile");

    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(`${baseUrl}/trust#evals`);
    await page.getByRole("heading", { name: /32 release cases/ }).waitFor();
    await page.getByRole("heading", { name: /32 release cases/ }).scrollIntoViewIfNeeded();
    await capture(page, "07-trust-eval-evidence");
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown screenshot failure.";
  process.stderr.write(`Screenshot capture stopped: ${message}\n`);
  process.exitCode = 1;
});
