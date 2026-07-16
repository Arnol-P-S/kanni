import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  ClassElevenPage,
  ClassOnePage,
  ParentPage,
  TeacherPage,
} from "./pages";

test("Class 1 static flow works without the adult gate", async ({ page }) => {
  const learner = new ClassOnePage(page);
  await learner.open();
  await learner.completeAfterHint();
});

test("one record connects learner, teacher, parent, and the next activity", async ({
  page,
}) => {
  const learner = new ClassOnePage(page);
  const teacher = new TeacherPage(page);
  const parent = new ParentPage(page);

  await learner.open();
  await learner.completeAfterHint();
  await teacher.openAndChooseObjects();
  await parent.openAndVerifyObjectsPrompt();

  await page.getByRole("link", { name: /See the changed next activity/ }).click();
  await expect(page).toHaveURL(/\/learn\/class-1\/add-within-10$/);
  await expect(page.getByText(/next question starts with counters/i)).toBeVisible();
});

test("Class 11 custom answer shows source cards and a bounded Deep Check", async ({
  page,
}) => {
  await page.route("**/api/adult-gate", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.route("**/api/tutor", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "grounded",
        explanation: "Linear search checks items from the start until the target is found or the list ends.",
        steps: ["Start at index 0.", "Compare each value.", "Stop on a match."],
        hint: null,
        recommendedCheckId: "cs-check-trace-1",
        sourceSectionIds: ["cs-linear-definition"],
        possibleConfusionCode: null,
        trust: {
          sourceMatched: true,
          citationIdsValid: true,
          ageFormatChecked: true,
          safetyRoute: "clear",
          humanReview: "pending",
        },
        deepCheck: {
          sourceCritic: "pass",
          teachingCritic: "pass",
          issueCodes: [],
        },
      }),
    });
  });

  const learner = new ClassElevenPage(page);
  await learner.open();
  await learner.confirmAdultGate();
  await page
    .getByLabel("Custom lesson question")
    .fill("Why does linear search stop after a match?");
  await page.getByLabel("Run optional Deep Check").check();
  await page.getByRole("button", { name: "Ask within this lesson" }).click();

  await expect(page.getByRole("heading", { name: "Lesson answer" })).toBeVisible();
  await expect(page.getByText("cs-linear-definition")).toBeVisible();
  await expect(page.getByText(/Source critic:/)).toContainText("pass");
});

test("keyboard language flow, AI fallback, Trust page, and accessibility", async ({
  page,
}) => {
  await page.route("**/api/adult-gate", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.route("**/api/tutor", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "unavailable",
        explanation: "AI help is unavailable right now. The reviewed questions still work.",
        steps: [],
        hint: null,
        recommendedCheckId: null,
        sourceSectionIds: [],
        possibleConfusionCode: null,
        trust: {
          sourceMatched: false,
          citationIdsValid: false,
          ageFormatChecked: true,
          safetyRoute: "clear",
          humanReview: "completed",
        },
        deepCheck: null,
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "English" }).click();
  const classOneLink = page.getByRole("link", { name: /Try Class 1 Mathematics/ });
  await classOneLink.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Let’s add" })).toBeVisible();

  const classEleven = new ClassElevenPage(page);
  await classEleven.open();
  await classEleven.confirmAdultGate();
  await page.getByLabel("Custom lesson question").fill("What is linear search?");
  await page.getByRole("button", { name: "Ask within this lesson" }).click();
  await expect(page.getByText(/AI help is unavailable right now/)).toBeVisible();
  await expect(page.getByRole("button", { name: /What is linear search/ })).toBeVisible();

  await page.getByRole("link", { name: "Trust", exact: true }).click();
  await expect(page).toHaveURL(/\/trust$/);
  await expect(
    page.getByRole("heading", { name: /What Kanni uses/ }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const seriousFindings = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(seriousFindings).toEqual([]);
});

test("release layouts reflow, respect reduced motion, and label Malayalam", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [360, 720]) {
    await page.setViewportSize({ width, height: 900 });

    for (const route of [
      "/",
      "/learn/class-1/add-within-10",
      "/learn/class-11/linear-search",
      "/teacher",
      "/parent",
      "/trust",
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const hasDocumentOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasDocumentOverflow, `${route} overflowed at ${width}px`).toBe(false);
    }
  }

  await page.goto("/learn/class-1/add-within-10");
  await expect(page.getByRole("heading", { name: "കൂട്ടി നോക്കാം" })).toHaveAttribute(
    "lang",
    "ml",
  );
  const scrollBehavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(scrollBehavior).toBe("auto");

  await page.goto("/not-an-implemented-lesson");
  await expect(
    page.getByRole("heading", { name: /not part of the demo/ }),
  ).toBeVisible();

  const iconResponse = await page.request.get("/icon");
  expect(iconResponse.status()).toBe(200);
  expect(iconResponse.headers()["content-type"]).toContain("image/png");
});
