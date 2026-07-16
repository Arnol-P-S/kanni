import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium, type Page } from "@playwright/test";

const baseUrl = (process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3173").replace(
  /\/$/,
  "",
);
const outputDirectory = resolve(process.cwd(), "submission/screenshots");

const connectedRecord = {
  attemptId: "demo-submission-connected-loop",
  profileId: "demo-class-1",
  lessonId: "math-add-within-10",
  attempts: [
    {
      questionId: "math-pre-1",
      selectedOptionId: "pre-4",
      correct: false,
    },
    {
      questionId: "math-post-1",
      selectedOptionId: "post-6",
      correct: true,
    },
  ],
  observation: "correct_after_hint",
  hintUsed: true,
  possibleConfusionCode: "needs_counting_support",
  reviewState: "approved",
  teacherStrategy: "use_objects",
  updatedAt: "2026-07-16T08:00:00.000Z",
};

async function setConnectedRecord(page: Page) {
  await page.goto(`${baseUrl}/`);
  await page.evaluate((record) => {
    window.localStorage.setItem("kanni.learning-record.v1", JSON.stringify(record));
    window.localStorage.setItem("kanni.language.v1", "ml");
  }, connectedRecord);
}

async function capture(page: Page, name: string) {
  await page.screenshot({
    path: resolve(outputDirectory, `${name}.png`),
    animations: "disabled",
  });
  process.stdout.write(`Captured submission/screenshots/${name}.png\n`);
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
    await page.getByRole("heading", { name: /One learning moment/ }).waitFor();
    await capture(page, "01-home-connected-pitch");

    await page.goto(`${baseUrl}/learn/class-1/add-within-10`);
    await page.getByRole("button", { name: "Answer 4" }).click();
    await page.getByRole("heading", { name: /ആദ്യം രണ്ട് വൃത്തങ്ങൾ എണ്ണൂ/ }).waitFor();
    await capture(page, "02-class-1-reviewed-hint");

    await setConnectedRecord(page);
    await page.goto(`${baseUrl}/teacher`);
    await page.getByText(/initial answer was incorrect/i).waitFor();
    await capture(page, "03-teacher-activity-review");

    await page.setViewportSize({ width: 390, height: 844 });
    await setConnectedRecord(page);
    await page.goto(`${baseUrl}/parent`);
    await page.getByText(/Place two spoons beside three spoons/).waitFor();
    await page.getByRole("heading", { name: /teacher-informed prompt/ }).scrollIntoViewIfNeeded();
    await capture(page, "04-parent-home-prompt-mobile");

    await page.setViewportSize({ width: 1440, height: 960 });
    await setConnectedRecord(page);
    await page.goto(`${baseUrl}/learn/class-1/add-within-10`);
    await page.getByText(/next question starts with counters/i).waitFor();
    await capture(page, "05-teacher-choice-next-activity");

    await page.goto(`${baseUrl}/learn/class-11/linear-search`);
    await page.getByRole("button", { name: /What is linear search/ }).click();
    await page.getByRole("heading", { name: "Lesson answer" }).waitFor();
    await page.getByRole("heading", { name: "Lesson answer" }).scrollIntoViewIfNeeded();
    await capture(page, "06-class-11-grounded-static-answer");

    await page.goto(`${baseUrl}/trust#evals`);
    await page.getByRole("heading", { name: /32 cases defined/ }).waitFor();
    await page.getByRole("heading", { name: /32 cases defined/ }).scrollIntoViewIfNeeded();
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
