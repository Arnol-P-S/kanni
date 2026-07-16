import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  ClassElevenPage,
  ClassOnePage,
  ParentPage,
  TeacherPage,
} from "./pages";

async function mockAiCapability(
  page: import("@playwright/test").Page,
  deepCheckAvailable = false,
) {
  await page.route("**/api/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        application: "kanni",
        ai: {
          available: true,
          deepCheckAvailable,
          provider: "vercel_gateway",
          reason: "available",
        },
      }),
    });
  });
}

async function expectNoSeriousAxeFindings(
  page: import("@playwright/test").Page,
) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const seriousFindings = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(seriousFindings).toEqual([]);
}

async function enterSyntheticProfile(
  page: import("@playwright/test").Page,
  name: "Asha" | "Meera" | "Diya" | "Arun",
) {
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("radio", { name: new RegExp(name) }).check();
  await page.getByRole("checkbox", { name: /I am 18 or older/ }).check();
  await page.getByRole("button", { name: "Enter synthetic workspace" }).click();
}

async function switchSyntheticProfile(
  page: import("@playwright/test").Page,
  name: "Asha" | "Meera" | "Diya" | "Arun",
) {
  await page.getByRole("button", { name: "Switch demo account" }).click();
  await enterSyntheticProfile(page, name);
}

test("four authorized roles complete one connected GrowthCycle", async ({
  page,
}) => {
  await page.goto("/login");
  await enterSyntheticProfile(page, "Asha");
  await expect(page).toHaveURL(/\/portal\/admin/);
  await page.getByLabel("Family update language").selectOption("en");
  await page.getByRole("button", { name: "Confirm support circle" }).click();
  await expect(page.getByRole("heading", { name: "Support circle mapped" })).toBeVisible();
  await expect(page).toHaveTitle(/Admin portal/);
  await expectNoSeriousAxeFindings(page);

  await switchSyntheticProfile(page, "Meera");
  await expect(page).toHaveURL(/\/portal\/teacher/);
  await expect(page).toHaveTitle(/Teacher portal/);
  await expectNoSeriousAxeFindings(page);
  await page.getByRole("radio", { name: "Ask guided comparison questions" }).check();
  await page.getByRole("button", { name: "Review and publish plan" }).click();
  await expect(page.getByText(/Published with/)).toBeVisible();

  await switchSyntheticProfile(page, "Diya");
  await expect(page).toHaveURL(/\/portal\/student/);
  await page.getByRole("button", { name: "One quarter" }).click();
  await page.getByRole("button", { name: "Show me another way" }).click();
  await expect(page.getByRole("heading", { name: "Use three comparison questions" })).toBeVisible();
  await expect(page.getByRole("img", { name: /fraction strips/ })).toHaveCount(0);
  await page.getByRole("radio", { name: "One half is larger" }).check();
  await page.getByRole("radio", { name: /more equal parts make each part smaller/ }).check();
  await page.getByRole("button", { name: "Send my explanation to the teacher" }).click();
  await expect(page.getByText(/You revised your choice to one half/)).toBeVisible();
  await expect(page).toHaveTitle(/Student portal/);
  await expectNoSeriousAxeFindings(page);

  await page.goto("/portal/teacher");
  await expect(page).toHaveURL(/\/portal\/student\?notice=role-denied/);
  await expect(page.getByRole("button", { name: "Reset cycle" })).toHaveCount(0);
  await switchSyntheticProfile(page, "Meera");
  await page.getByRole("radio", { name: /Ask the learner to explain to someone/ }).check();
  await page.getByRole("button", { name: "Approve next step and family brief" }).click();
  await expect(page.getByText(/Next step approved/)).toBeVisible();

  await switchSyntheticProfile(page, "Arun");
  await expect(page).toHaveURL(/\/portal\/parent/);
  await expect(page.getByText(/The first choice was one quarter/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ask the learner to teach the idea to you." })).toBeVisible();
  await expect(page.getByText("Raw student prompts")).toBeVisible();
  await expect(page.getByText(/Four is a bigger number than two/)).toHaveCount(0);
  await expect(page).toHaveTitle(/Parent portal/);
  await expectNoSeriousAxeFindings(page);
  await page.getByRole("button", { name: "Tried it" }).click();
  await expect(page.getByText(/Response sent: tried/)).toBeVisible();

  await switchSyntheticProfile(page, "Meera");
  await expect(page.getByRole("heading", { name: "tried" })).toBeVisible();
  await expect(page).toHaveTitle(/Teacher portal/);
  await expectNoSeriousAxeFindings(page);
});

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

  await page
    .getByRole("link", { name: /See the teacher-selected next activity/ })
    .click();
  await expect(page).toHaveURL(/\/learn\/class-1\/add-within-10$/);
  await expect(page.getByText(/next question starts with counters/i)).toBeVisible();
  await expect(
    page.getByRole("img", { name: "3 plus 1 counters" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /മൂന്ന് വൃത്തങ്ങളും ഒരു വൃത്തവും/ }),
  ).toBeVisible();
});

test("teacher strategies change the rendered next activity in both lessons", async ({
  page,
}) => {
  const learner = new ClassOnePage(page);
  const teacher = new TeacherPage(page);

  await learner.open();
  await learner.completeAfterHint();

  await teacher.chooseStrategy(/Use a number line/);
  await page.goto("/learn/class-1/add-within-10");
  await expect(
    page.getByRole("img", { name: /Number line from 0 to 10/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /സംഖ്യാരേഖയിൽ രണ്ട് ചാട്ടം/ }),
  ).toBeVisible();

  await teacher.chooseStrategy(/Try smaller numbers/);
  await page.goto("/learn/class-1/add-within-10");
  await expect(
    page.getByRole("img", { name: "1 plus 2 counters" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /ഒരു വൃത്തവും രണ്ട് വൃത്തങ്ങളും/ }),
  ).toBeVisible();

  await page.goto("/learn/class-11/linear-search");
  await page.getByRole("button", { name: /What is linear search/ }).click();

  await teacher.chooseStrategy(/Use a trace table/);
  await page.goto("/learn/class-11/linear-search");
  await expect(page.getByText(/next search will show each comparison/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Find 5 in [3, 8, 5]" }),
  ).toBeVisible();

  await teacher.chooseStrategy(/Show a worked example/);
  await page.goto("/learn/class-11/linear-search");
  await expect(
    page.getByRole("heading", { name: "Find 2 in [6, 2, 9]" }),
  ).toBeVisible();
  await expect(page.getByText(/Complete example:/)).toBeVisible();

  await teacher.chooseStrategy(/Ask the learner to explain/);
  await page.goto("/learn/class-11/linear-search");
  await expect(page.getByText(/Why is index 2 not checked/)).toBeVisible();
});

test("Class 11 custom answer shows source cards and a bounded Deep Check", async ({
  page,
}) => {
  await mockAiCapability(page, true);
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
          sourceMatched: false,
          citationIdsValid: true,
          ageFormatChecked: true,
          safetyRoute: "clear",
          contentOrigin: "model_generated",
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

test("keyboard flow, AI fallback, Trust page, and accessibility", async ({
  page,
}) => {
  await mockAiCapability(page);
  await page.route("**/api/adult-gate", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.route("**/api/tutor", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "unavailable",
        explanation: "AI help is unavailable right now. The project-authored questions still work.",
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
          contentOrigin: "project_authored",
        },
        deepCheck: null,
      }),
    });
  });

  await page.goto("/learn/class-1/add-within-10");
  await expect(page.getByRole("heading", { name: "കൂട്ടി നോക്കാം" })).toBeVisible();

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

  await expectNoSeriousAxeFindings(page);
});

test("the connected Class 1 loop can be completed with the keyboard", async ({
  page,
}) => {
  await page.goto("/learn/class-1/add-within-10");
  const firstAnswer = page.getByRole("button", { name: "Answer 4" });
  await firstAnswer.focus();
  await page.keyboard.press("Enter");
  const nextQuestion = page.getByRole("button", { name: /അടുത്ത ചോദ്യം/ });
  await nextQuestion.focus();
  await page.keyboard.press("Enter");
  const followUpAnswer = page.getByRole("button", { name: "Answer 6" });
  await followUpAnswer.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: /തുടർ ഉത്തരം ശരിയാണ്/ }),
  ).toBeVisible();

  const teacherLink = page.getByRole("link", { name: /Open teacher view/ });
  await teacherLink.focus();
  await page.keyboard.press("Enter");
  const strategy = page.getByRole("button", { name: /Use objects/ });
  await strategy.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("approved", { exact: true })).toBeVisible();
});

test("static release clearly disables model-backed controls", async ({ page }) => {
  await page.goto("/learn/class-11/linear-search");
  await expect(
    page.getByRole("heading", { name: "Supervised AI is off in this release" }),
  ).toBeVisible();
  await expect(page.getByLabel("Custom lesson question")).toHaveCount(0);
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
      "/privacy",
      "/terms",
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const hasDocumentOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasDocumentOverflow, `${route} overflowed at ${width}px`).toBe(false);
      await expectNoSeriousAxeFindings(page);
    }
  }

  await page.setViewportSize({ width: 720, height: 900 });
  await page.goto("/learn/class-1/add-within-10");
  await page.locator("html").evaluate((html) => {
    html.style.fontSize = "200%";
  });
  await expect(page.getByRole("heading", { name: "കൂട്ടി നോക്കാം" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Answer 4" })).toBeVisible();
  const overflowsWithTwoHundredPercentText = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflowsWithTwoHundredPercentText).toBe(false);

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

  const homeResponse = await page.request.get("/");
  expect(homeResponse.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(homeResponse.headers()["content-security-policy"]).toContain(
    "object-src 'none'",
  );
  expect(homeResponse.headers()["x-content-type-options"]).toBe("nosniff");
  expect(homeResponse.headers()["x-frame-options"]).toBe("DENY");
  expect(homeResponse.headers()["referrer-policy"]).toBe("no-referrer");
  expect(homeResponse.headers()["cross-origin-opener-policy"]).toBe(
    "same-origin",
  );
  expect(homeResponse.headers()["cross-origin-resource-policy"]).toBe(
    "same-origin",
  );
  expect(homeResponse.headers()["permissions-policy"]).toContain("camera=()");
  expect(homeResponse.headers()["permissions-policy"]).toContain(
    "microphone=()",
  );
  expect(homeResponse.headers()["permissions-policy"]).toContain(
    "geolocation=()",
  );
});
