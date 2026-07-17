import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium, expect, type Page } from "@playwright/test";

const baseUrl = (process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3001").replace(
  /\/$/,
  "",
);
const outputDirectory = resolve(process.cwd(), "submission/screenshots");
const accounts = {
  admin: { email: "admin@kanni.local", password: "Admin@Kanni2026" },
  teacher: { email: "teacher@kanni.local", password: "Teacher@Kanni2026" },
  student: { email: "student@kanni.local", password: "Student@Kanni2026" },
  parent: { email: "parent@kanni.local", password: "Parent@Kanni2026" },
} as const;

async function capture(page: Page, name: string) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Screenshot automation can leave the first keyboard target focused after
    // navigation. Keep the real skip link unchanged, but capture the ordinary
    // pointer-view state shown before a keyboard user presses Tab.
    document.querySelectorAll<HTMLElement>(".skip-link").forEach((link) => {
      link.dataset.screenshotHidden = "true";
      link.hidden = true;
    });
  });
  await page.screenshot({
    path: resolve(outputDirectory, `${name}.png`),
    animations: "disabled",
  });
  await page
    .locator("[data-screenshot-hidden='true']")
    .evaluateAll((nodes) => {
      nodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          node.hidden = false;
          delete node.dataset.screenshotHidden;
        }
      });
    });
  process.stdout.write(`Captured submission/screenshots/${name}.png\n`);
}

async function signIn(
  page: Page,
  account: { email: string; password: string },
) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(page).toHaveURL(/\/portal\//);
  const english = page.getByRole("button", { name: "English" });
  if ((await english.getAttribute("aria-pressed")) === "false") {
    await english.click();
    await expect(english).toHaveAttribute("aria-pressed", "true");
  }
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login\?notice=signed-out/);
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
    await page
      .getByRole("heading", {
        name: "Help every learner take the next useful step.",
      })
      .waitFor();
    await capture(page, "01-home-connected-school");

    await page.goto(`${baseUrl}/login`);
    await page.getByRole("heading", { name: "Sign in", exact: true }).waitFor();
    await capture(page, "02-four-role-credential-signin");

    await signIn(page, accounts.admin);
    await page.getByRole("button", { name: "Start fresh cycle" }).click();
    await page.getByText("Teacher planning", { exact: true }).waitFor();
    await capture(page, "03-admin-connected-school");
    await signOut(page);

    await signIn(page, accounts.teacher);
    await page.getByRole("heading", { name: "Plan for understanding" }).waitFor();
    await capture(page, "04-teacher-plan-and-support");
    await page.getByLabel("Use fraction strips").check();
    await page.getByRole("button", { name: "Publish student activity" }).click();
    await signOut(page);

    await signIn(page, accounts.student);
    await page.getByRole("button", { name: /1\/4\s*One quarter/ }).click();
    await page.getByRole("button", { name: "Open support" }).click();
    await page.getByRole("heading", { name: "Compare equal wholes" }).waitFor();
    await capture(page, "05-student-teacher-selected-support");
    await page.getByLabel(/1\/2\s*One half/).check();
    await page
      .getByLabel(
        "When the whole is the same size, more equal parts make each part smaller.",
      )
      .check();
    await page.getByRole("button", { name: "Send to teacher" }).click();
    await signOut(page);

    await signIn(page, accounts.teacher);
    await page
      .getByRole("heading", { name: "What happened in this activity" })
      .waitFor();
    await capture(page, "06-teacher-evidence-review");
    await page.getByLabel(/Ask guided questions/).check();
    await page.getByRole("button", { name: "Approve family activity" }).click();
    await signOut(page);

    await signIn(page, accounts.parent);
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("heading", { name: "Ask three short questions." })
      .waitFor();
    await capture(page, "07-parent-reviewed-activity-mobile");
    await signOut(page);

    await page.setViewportSize({ width: 1440, height: 960 });
    await signIn(page, accounts.student);
    await page
      .getByRole("heading", { name: "Use three comparison questions" })
      .waitFor();
    await capture(page, "08-student-changed-next-activity");
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown screenshot failure.";
  process.stderr.write(`Screenshot capture stopped: ${message}\n`);
  process.exitCode = 1;
});
