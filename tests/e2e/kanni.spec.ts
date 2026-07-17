import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { accounts, LoginPage, WorkspacePage } from "./pages";

test("connected school learning cycle persists across four real accounts", async ({ page }) => {
  const login = new LoginPage(page);
  const workspace = new WorkspacePage(page);

  await login.signIn(accounts.admin);
  await expect(page.getByRole("heading", { name: "Keep every learning handoff moving" })).toBeVisible();
  await expect(page.getByRole("table", { name: "School accounts" })).toContainText("teacher@kanni.local");
  await expect(page.getByRole("heading", { name: "Bounded by the learning cycle" })).toBeVisible();
  await page.getByRole("button", { name: "Start fresh cycle" }).click();
  await workspace.expectHandoff("Teacher planning");
  await login.signOut();

  await login.signIn(accounts.teacher);
  await expect(page.getByRole("heading", { name: "Plan for understanding" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Protect learner agency" })).toBeVisible();
  await page.getByLabel("Use fraction strips").check();
  await page.getByRole("button", { name: "Publish student activity" }).click();
  await workspace.expectHandoff("Student activity");
  await login.signOut();

  await login.signIn(accounts.student);
  await page.getByRole("button", { name: /1\/4\s*One quarter/ }).click();
  await page.getByRole("button", { name: "Open my scaffold" }).click();
  await expect(page.getByRole("heading", { name: "AI asks. You decide." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pause and think" })).toBeVisible();
  await expect(page.getByText("What do you notice about the space one part takes?")).toBeVisible();
  await page.getByLabel(/Plan a fair share/).check();
  await page.getByLabel(/Describe your first design/).fill(
    "I used two same-sized paper snacks and divided them into halves and quarters for a fair sharing plan.",
  );
  await page
    .getByLabel(/I did not clearly show that the wholes are the same size/)
    .check();
  await page.getByLabel(/Revise it and explain what changed/).fill(
    "I marked both paper snacks as the same size, labelled every equal part, and added a second example.",
  );
  await page.getByLabel(/1\/2\s*One half/).check();
  await page.getByLabel("When the whole is the same size, more equal parts make each part smaller.").check();
  await page.getByRole("button", { name: "Send my work to the teacher" }).click();
  await workspace.expectHandoff("Teacher review");
  await login.signOut();

  await login.signIn(accounts.teacher);
  await expect(page.getByRole("heading", { name: "What happened in this activity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Plan a fair share" })).toBeVisible();
  await expect(page.getByText("I marked both paper snacks as the same size, labelled every equal part, and added a second example.")).toBeVisible();
  await page.getByLabel(/Ask guided questions/).check();
  await page.getByLabel(/Light/).check();
  await page.getByRole("button", { name: "Approve family activity and next scaffold" }).click();
  await workspace.expectHandoff("Family activity");
  await login.signOut();

  await login.signIn(accounts.parent);
  await expect(page.getByRole("heading", { name: "Ask three short questions." })).toBeVisible();
  await expect(page.getByText(/They also created a fair-sharing plan/)).toBeVisible();
  await expect(page.getByText("I marked both paper snacks as the same size, labelled every equal part, and added a second example.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Support without surveillance" })).toBeVisible();
  await page.getByRole("button", { name: "We tried it" }).click();
  await workspace.expectHandoff("Cycle complete");
  await login.signOut();

  await login.signIn(accounts.student);
  await expect(page.getByRole("heading", { name: "Start with one comparison question" })).toBeVisible();
  await expect(page.getByText("Light", { exact: true })).toBeVisible();
  await expect(page.locator(".support-step-list li")).toHaveCount(1);
  await expect(page.getByText("This changed because your teacher reviewed the previous activity.")).toBeVisible();
  await login.signOut();

  await login.signIn(accounts.admin);
  await expect(page.getByText("Teacher-controlled fading")).toBeVisible();
  await expect(page.getByText("I marked both paper snacks as the same size, labelled every equal part, and added a second example.")).toHaveCount(0);
  await page.getByRole("button", { name: "Start fresh cycle" }).click();
  await workspace.expectHandoff("Teacher planning");
  await expect(page.getByText("1 previous cycles preserved")).toBeVisible();
  await login.signOut();

  await login.signIn(accounts.teacher);
  await expect(page.getByText(/Current scaffold level: Light/)).toBeVisible();
  await page.getByLabel(/Ask guided questions/).check();
  await page.getByRole("button", { name: "Publish student activity" }).click();
  await login.signOut();

  await login.signIn(accounts.student);
  await page.getByRole("button", { name: /1\/4\s*One quarter/ }).click();
  await page.getByRole("button", { name: "Open my scaffold" }).click();
  await expect(page.getByText("Both strips show the same-sized whole.")).toHaveCount(0);
  await expect(page.locator(".socratic-prompt-panel li")).toHaveCount(1);
  await expect(page.getByText("Which single part appears to take more space, and what makes you think that?")).toBeVisible();
});

test("student cannot enter the school administrator workspace", async ({ page }) => {
  const login = new LoginPage(page);
  await login.signIn(accounts.student);
  await page.goto("/portal/admin");
  await expect(page).toHaveURL(/\/portal\/student/);
  await expect(page.getByRole("heading", { name: "Think, make, test, and revise" })).toBeVisible();
});

test("invalid credentials fail without revealing which field was wrong", async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await page.getByLabel("Email").fill("teacher@kanni.local");
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "The email or password is incorrect." }),
  ).toHaveText("The email or password is incorrect.");
  await expect(page).toHaveURL(/\/login/);
});

test("landing and login have no serious accessibility findings", async ({ page }) => {
  for (const route of ["/", "/login"]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = result.violations.filter((item) =>
      item.impact === "serious" || item.impact === "critical"
    );
    expect(serious).toEqual([]);
  }
});

test("mobile language switch changes visible product copy", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Help every learner take the next useful step." })).toBeVisible();
  await page.getByRole("button", { name: "മലയാളം" }).click();
  await expect(page.getByRole("heading", { name: "ഓരോ പഠിതാവിനും അടുത്ത ഉപകാരപ്രദമായ ചുവടുവെയ്പ്പ് നടത്താൻ സഹായിക്കുക." })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ml");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Help every learner take the next useful step." })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
