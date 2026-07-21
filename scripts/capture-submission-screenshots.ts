import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium, expect, type Page } from "@playwright/test";

const confirmation = "I_UNDERSTAND_THIS_IS_AN_ISOLATED_SCREENSHOT_DATABASE";
if (process.env.SCREENSHOT_ALLOW_DATABASE_MUTATION !== confirmation) {
  throw new Error(
    `Set SCREENSHOT_ALLOW_DATABASE_MUTATION=${confirmation} only for a clean, isolated screenshot database.`,
  );
}

const baseUrl = (process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3174").replace(
  /\/$/u,
  "",
);
const host = new URL(baseUrl).hostname;
if (host !== "127.0.0.1" && host !== "localhost") {
  throw new Error("Screenshot automation is restricted to localhost.");
}

const outputDirectory = resolve(process.cwd(), "submission/screenshots");
const accounts = {
  admin: { email: "admin@riverbank.example", password: "RiverbankAdmin2026" },
  teacher: { email: "teacher@riverbank.example", password: "TeacherStudio2026" },
  student: { email: "student@riverbank.example", password: "StudentAgency2026" },
  parent: { email: "parent@riverbank.example", password: "ParentCircle2026" },
} as const;

async function capture(page: Page, name: string) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.querySelectorAll<HTMLElement>(".skip-link").forEach((link) => {
      link.dataset.screenshotHidden = "true";
      link.hidden = true;
    });
  });
  await page.screenshot({
    path: resolve(outputDirectory, `${name}.png`),
    animations: "disabled",
  });
  await page.locator("[data-screenshot-hidden='true']").evaluateAll((nodes) => {
    nodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.hidden = false;
        delete node.dataset.screenshotHidden;
      }
    });
  });
  process.stdout.write(`Captured submission/screenshots/${name}.png\n`);
}

async function signIn(page: Page, account: { email: string; password: string }) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(page).toHaveURL(/\/portal\//u);
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login\?notice=signed-out/u);
}

async function createMember(
  page: Page,
  input: { name: string; role: "teacher" | "student" | "parent"; email: string; password: string },
) {
  const region = page.getByRole("region", { name: "Create a role account" });
  await region.getByLabel("Full name", { exact: true }).fill(input.name);
  await region.getByLabel("Role", { exact: true }).selectOption(input.role);
  await region.getByLabel("Sign-in email", { exact: true }).fill(input.email);
  await region.getByLabel("Temporary password", { exact: true }).fill(input.password);
  await region.getByRole("button", { name: "Create account" }).click();
  await expect(region.getByRole("status")).toContainText(`${input.name} can now sign in`);
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
    await page.getByRole("heading", { name: "Teachers prepare the ground. Learners do the thinking." }).waitFor();
    await capture(page, "01-home-teacher-first");

    await page.getByRole("link", { name: "Set up your school" }).click();
    await page.getByRole("heading", { name: "Create your school" }).waitFor();
    await capture(page, "02-clean-school-setup");
    await page.getByLabel("School name").fill("Riverbank Learning School");
    await page.getByLabel("Full name").fill("Anjali Menon");
    await page.getByLabel("Email").fill(accounts.admin.email);
    await page.getByLabel("Password", { exact: true }).fill(accounts.admin.password);
    await page.getByLabel("Confirm password").fill(accounts.admin.password);
    await page.getByRole("button", { name: "Create school and continue" }).click();
    await expect(page).toHaveURL(/\/portal\/admin/u);

    await createMember(page, { name: "Meera Krishnan", role: "teacher", ...accounts.teacher });
    await createMember(page, { name: "Diya Nair", role: "student", ...accounts.student });
    await createMember(page, { name: "Arun Nair", role: "parent", ...accounts.parent });
    const mapping = page.getByRole("region", { name: "Connect a support circle" });
    await mapping.getByRole("combobox", { name: "Teacher", exact: true }).selectOption({ label: "Meera Krishnan" });
    await mapping.getByRole("combobox", { name: "Student", exact: true }).selectOption({ label: "Diya Nair" });
    await mapping.getByRole("combobox", { name: "Parent", exact: true }).selectOption({ label: "Arun Nair" });
    await mapping.getByRole("button", { name: "Connect support circle" }).click();
    await expect(mapping.getByRole("status")).toContainText("connected");
    await page.getByRole("region", { name: "Support circles" }).scrollIntoViewIfNeeded();
    await capture(page, "03-admin-support-circle");
    await signOut(page);

    await signIn(page, accounts.teacher);
    await page.getByLabel("Learner", { exact: true }).selectOption({ label: "Diya Nair · family: Arun Nair" });
    await page.getByLabel("Studio title", { exact: true }).fill("Ratio choices in a community kitchen");
    await page.getByLabel("Subject", { exact: true }).fill("Mathematics");
    await page.getByLabel("Learning goal", { exact: true }).fill("Compare equivalent ratios and justify why two relationships are or are not equivalent.");
    await page.getByLabel("Driving question", { exact: true }).fill("How can we prove that two recipes keep the same relationship between ingredients and people?");
    await page.getByRole("button", { name: "Continue to source" }).click();
    await page.getByLabel("Source title", { exact: true }).fill("Teacher-authored notes on equivalent ratios");
    await page.getByLabel("Version", { exact: true }).fill("2026.1");
    await page.getByLabel("Curriculum text", { exact: true }).fill([
      "Equivalent ratios",
      "A ratio compares two quantities in a fixed order. Two ratios are equivalent when both quantities are multiplied or divided by the same non-zero number. A table can show corresponding pairs and helps a learner check whether the relationship stays constant.",
      "Testing a claim",
      "A claim about equivalent ratios needs evidence. Learners can build a ratio table, draw a double number line, or use repeated groups. Checking only one quantity is not enough because the two quantities must change together.",
      "Reasoning and revision",
      "A strong explanation names the two quantities, shows the same scale factor on both, and states why that evidence supports equivalence. If a first model changes only one quantity, the learner should revise the model and explain the change.",
    ].join("\n\n"));
    await page.getByRole("button", { name: "Review studio" }).click();
    await page.getByLabel("I am allowed to copy this source into Kanni.").check();
    await page.getByRole("button", { name: "Create planning studio" }).click();
    await page.getByRole("heading", { name: "Keep the goal, change the route" }).scrollIntoViewIfNeeded();
    await capture(page, "04-teacher-grounded-toolkit");
    await page.getByLabel("I reviewed the plan against the curriculum sections.").check();
    const publish = page.getByRole("button", { name: "Publish to Diya Nair" });
    await publish.focus();
    await publish.press("Enter");
    await expect(page).toHaveURL(/notice=studio-published/u);
    await signOut(page);

    await signIn(page, accounts.student);
    await page.getByRole("group", { name: "Choose an interest route" }).getByRole("radio").first().check();
    await page.getByRole("group", { name: "Choose what you want to make" }).getByRole("radio").first().check();
    await page.getByLabel("What do you predict before you begin?", { exact: true }).fill("I predict both recipes are equivalent when every ingredient and serving count changes by the same factor.");
    await capture(page, "05-student-choice-and-prediction");
    await page.getByRole("button", { name: "Start making" }).click();
    await page.getByLabel("My first version", { exact: true }).fill("My first table used 2 cups of rice for 3 people and 4 cups for 5 people. I thought doubling the rice alone was enough, but the serving count did not follow the same factor.");
    await page.getByRole("button", { name: "Open thinking support" }).click();
    await capture(page, "06-student-first-version-support");
    await page.getByRole("button", { name: "Critique my version" }).click();
    await page.getByLabel("My critique", { exact: true }).fill("My first table is weak because I doubled the rice but did not double the number of people, so the two quantities do not change together.");
    await page.getByRole("button", { name: "Revise it" }).click();
    await page.getByLabel("My revised version", { exact: true }).fill("I rebuilt the table with 2 cups for 3 people and 4 cups for 6 people. Both columns double together, so the relationship stays equivalent.");
    await page.getByLabel("Why is this version stronger?", { exact: true }).fill("I changed 5 people to 6 people because both quantities need the same scale factor. The new table doubles both values.");
    await page.getByRole("button", { name: "Reflect on my process" }).click();
    await page.getByLabel("My reflection", { exact: true }).fill("I can now test both quantities before deciding. Next time I will build the table first and open fewer prompts.");
    await page.getByRole("button", { name: "Send my work to the teacher" }).click();
    await signOut(page);

    await signIn(page, accounts.teacher);
    await page.getByRole("heading", { name: "Review the thinking process, not just the final version" }).waitFor();
    await capture(page, "07-teacher-evidence-sequence");
    await page.getByLabel("What did the work show the learner doing well?", { exact: true }).fill("In this activity, the learner found that both quantities must change together and used that evidence to repair the model.");
    await page.getByLabel("Feedback the learner will receive", { exact: true }).fill("Your revision became stronger because you tested the same relationship with two linked quantities and explained what stayed constant.");
    await page.getByRole("radio", { name: /light/iu }).check();
    await page.getByLabel("I read the prediction, first version, critique, revision, and reflection.").check();
    await page.getByRole("button", { name: "Send feedback and open family activity" }).click();
    await signOut(page);

    await signIn(page, accounts.parent);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("heading", { name: "One activity for home" }).scrollIntoViewIfNeeded();
    await capture(page, "08-parent-reviewed-activity-mobile");
    await page.getByRole("radio", { name: /We tried it/iu }).check();
    await page.getByRole("button", { name: "Send response to teacher" }).click();
    await signOut(page);

    await page.setViewportSize({ width: 1440, height: 960 });
    await signIn(page, accounts.admin);
    await page.getByRole("region", { name: "Studio handoffs" }).scrollIntoViewIfNeeded();
    await capture(page, "09-admin-complete-private-handoff");
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown screenshot failure.";
  process.stderr.write(`Screenshot capture stopped: ${message}\n`);
  process.exitCode = 1;
});
