import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { accounts, LoginPage } from "./pages";

const studentRawRevision =
  "I rebuilt the snack table with 2 cups of rice for 3 people and 4 cups for 6 people. Both columns double together, so the relationship stays equivalent.";
const teacherFeedback =
  "Your revision became stronger because you tested the same relationship with two linked quantities and explained what stayed constant.";
const curriculumSource = [
  "Equivalent ratios",
  "A ratio compares two quantities in a fixed order. Two ratios are equivalent when both quantities are multiplied or divided by the same non-zero number. A table can show corresponding pairs and helps a learner check whether the relationship stays constant.",
  "Testing a claim",
  "A claim about equivalent ratios needs evidence. Learners can build a ratio table, draw a double number line, or use repeated groups. Checking only one quantity is not enough because the two quantities must change together.",
  "Reasoning and revision",
  "A strong explanation names the two quantities, shows the same scale factor on both, and states why that evidence supports equivalence. If a first model changes only one quantity, the learner should revise the model and explain the change.",
].join("\n\n");

async function expectNoSeriousAxeFindings(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    result.violations.filter(
      (item) => item.impact === "serious" || item.impact === "critical",
    ),
  ).toEqual([]);
}

async function createMember(
  page: Page,
  member: { name: string; role: "teacher" | "student" | "parent"; email: string; password: string },
) {
  const form = page.getByRole("region", { name: "Create a role account" });
  await form.getByLabel("Full name", { exact: true }).fill(member.name);
  await form.getByLabel("Role", { exact: true }).selectOption(member.role);
  await form.getByLabel("Sign-in email", { exact: true }).fill(member.email);
  await form.getByLabel("Preferred language", { exact: true }).selectOption("en");
  await form.getByLabel("Temporary password", { exact: true }).fill(member.password);
  await form.getByRole("button", { name: "Create account" }).click();
  await expect(form.getByRole("status")).toContainText(`${member.name} can now sign in`);
}

test.describe.configure({ mode: "serial" });

test("a clean school completes the teacher-led agency loop across all four roles", async ({ page }) => {
  const login = new LoginPage(page);

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Set up your school" })).toBeVisible();
  await page.getByRole("link", { name: "Set up your school" }).click();
  await expect(page.getByRole("heading", { name: "Create your school" })).toBeVisible();
  await expect(page.getByText("No sample people are created.")).toBeVisible();

  await page.getByLabel("School name").fill("Riverbank Learning School");
  await page.getByLabel("Full name").fill("Anjali Menon");
  await page.getByLabel("Workspace language").selectOption("en");
  await page.getByLabel("Email").fill(accounts.admin.email);
  await page.getByLabel("Password", { exact: true }).fill(accounts.admin.password);
  await page.getByLabel("Confirm password").fill(accounts.admin.password);
  await page.getByRole("button", { name: "Create school and continue" }).click();
  await expect(page).toHaveURL(/\/portal\/admin/);
  await expect(page.getByRole("heading", { name: "Build the support circle, then let teachers lead" })).toBeVisible();
  await expect(page.getByText("0 of 4 ready")).toBeVisible();

  await createMember(page, {
    name: "Meera Krishnan",
    role: "teacher",
    email: accounts.teacher.email,
    password: accounts.teacher.password,
  });
  await createMember(page, {
    name: "Diya Nair",
    role: "student",
    email: accounts.student.email,
    password: accounts.student.password,
  });
  await createMember(page, {
    name: "Arun Nair",
    role: "parent",
    email: accounts.parent.email,
    password: accounts.parent.password,
  });
  const mapping = page.getByRole("region", { name: "Connect a support circle" });
  await mapping.getByRole("combobox", { name: "Teacher", exact: true }).selectOption({ label: "Meera Krishnan" });
  await mapping.getByRole("combobox", { name: "Student", exact: true }).selectOption({ label: "Diya Nair" });
  await mapping.getByRole("combobox", { name: "Parent", exact: true }).selectOption({ label: "Arun Nair" });
  await mapping.getByRole("button", { name: "Connect support circle" }).click();
  await expect(mapping.getByRole("status")).toContainText("The support circle is connected.");
  await expect(page.getByRole("region", { name: "Support circles" }))
    .toContainText("Meera Krishnan");
  const curriculum = page.getByRole("region", { name: "Manage the school curriculum library" });
  await curriculum.getByLabel("Pack title", { exact: true }).fill("School-authored notes on equivalent ratios");
  await curriculum.getByLabel("Subject", { exact: true }).fill("Mathematics");
  await curriculum.getByLabel("Class", { exact: true }).selectOption("Class 7");
  await curriculum.getByLabel("Version", { exact: true }).fill("2026.1");
  await curriculum.getByLabel("Permission basis", { exact: true }).selectOption("original");
  await curriculum.getByLabel("Content language", { exact: true }).selectOption("en");
  await curriculum.getByLabel("Curriculum text", { exact: true }).fill(curriculumSource);
  await curriculum.getByLabel("The school may copy and use this content.").check();
  await curriculum.getByRole("button", { name: "Add active curriculum pack" }).click();
  await expect(curriculum.getByRole("status")).toContainText("is active in the school library");
  await expect(curriculum).toContainText("3 checksummed sections");
  await login.signOut();

  await login.signIn(accounts.teacher);
  await expect(page.getByRole("heading", { name: "Plan once, create several ways to think" })).toBeVisible();
  await expect(page.getByText("Creating the studio stores the source and builds a teacher-owned starting plan. It does not call OpenRouter.")).toBeVisible();
  await page.getByLabel("Learner", { exact: true }).selectOption({ label: "Diya Nair · family: Arun Nair" });
  await page.getByLabel("Studio title", { exact: true }).fill("Ratio choices in a community kitchen");
  await page.getByLabel("Subject", { exact: true }).fill("Mathematics");
  await page.getByLabel("Class", { exact: true }).selectOption("Class 7");
  await page.getByLabel("Family activity language", { exact: true }).selectOption("en");
  await page.getByLabel("Learning goal", { exact: true }).fill(
    "Compare equivalent ratios and justify why two relationships are or are not equivalent.",
  );
  await page.getByLabel("Driving question", { exact: true }).fill(
    "How can we prove that two recipes keep the same relationship between ingredients and people?",
  );
  await page.getByRole("button", { name: "Continue to source" }).click();
  await page.getByLabel("Active curriculum pack", { exact: true }).selectOption({ label: "School-authored notes on equivalent ratios · Mathematics · Class 7 · 2026.1" });
  await page.getByRole("button", { name: "Review studio" }).click();
  await expect(page.getByText("None yet. Creating a studio does not call OpenRouter.")).toBeVisible();
  await expect(page.getByText("The selected pack is managed by the school.")).toBeVisible();
  await page.getByRole("button", { name: "Create planning studio" }).click();
  await expect(page).toHaveURL(/notice=studio-created/);
  await expect(page.getByRole("status")).toContainText("No AI request was made");
  await expect(page.getByRole("button", { name: "Use one AI request to draft the plan" })).toBeDisabled();
  await expect(page.getByText("0 AI planning requests")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Keep the goal, change the route" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ideas to check before they become conclusions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choice, making, critique, revision, and reflection" })).toBeVisible();
  await page.getByLabel("Interest route").first().fill("Build a fair kitchen plan");
  await page.getByLabel("I reviewed the plan against the curriculum sections.").check();
  const publishButton = page.getByRole("button", { name: "Publish to Diya Nair" });
  await publishButton.focus();
  await publishButton.press("Enter");
  await expect(page).toHaveURL(/notice=studio-published/);
  await expect(page.getByRole("status")).toContainText("now open to the learner");
  await expect(page.getByRole("heading", { name: "The student is choosing, making, critiquing, and revising" })).toBeVisible();
  await login.signOut();

  await login.signIn(accounts.student);
  await expect(page.getByRole("heading", { name: "Think, make, test, and revise" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /How can we prove that two recipes/ })).toBeVisible();
  await expect(page.getByText("Build a fair kitchen plan")).toBeVisible();
  await page.getByRole("group", { name: "Choose an interest route" }).getByRole("radio").first().check();
  await page.getByRole("group", { name: "Choose what you want to make" }).getByRole("radio").first().check();
  await page.getByLabel("What do you predict before you begin?", { exact: true }).fill(
    "I predict both recipes are equivalent when every ingredient and serving count changes by the same factor.",
  );
  await page.getByRole("button", { name: "Start making" }).click();
  await expect(page.getByRole("heading", { name: "Make a first version before opening support" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Open thinking support" })).toBeDisabled();
  await page.getByLabel("My first version", { exact: true }).fill(
    "My first table used 2 cups of rice for 3 people and 4 cups for 5 people. I thought doubling the rice alone was enough, but the serving count did not follow the same factor.",
  );
  await expect(page.getByRole("button", { name: "Open thinking support" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Give me creative next steps" })).toBeDisabled();
  await expect(page.getByText("AI is off. The teacher-reviewed prompts above still work.")).toBeVisible();
  await page.getByRole("button", { name: "Open thinking support" }).click();
  await expect(page.locator(".socratic-support-list li")).toHaveCount(3);
  await page.getByRole("button", { name: "Critique my version" }).click();
  await expect(page.getByRole("heading", { name: "Find the weakness yourself" })).toBeFocused();
  await page.getByLabel("My critique", { exact: true }).fill(
    "My first table is weak because I doubled the rice but did not double the number of people, so the two quantities do not change together.",
  );
  await page.getByRole("button", { name: "Revise it" }).click();
  await expect(page.getByRole("heading", { name: "Revise, then explain the reason" })).toBeFocused();
  await page.getByLabel("My revised version", { exact: true }).fill(studentRawRevision);
  await page.getByLabel("Why is this version stronger?", { exact: true }).fill(
    "I changed 5 people to 6 people because the source says both quantities must use the same scale factor. The new table doubles both values.",
  );
  await page.getByRole("button", { name: "Reflect on my process" }).click();
  await expect(page.getByRole("heading", { name: "Name what you can now do yourself" })).toBeFocused();
  await page.getByLabel("My reflection", { exact: true }).fill(
    "I can now test both quantities before deciding. Next time I will build the table first and open fewer prompts.",
  );
  await page.getByRole("button", { name: "Send my work to the teacher" }).click();
  await expect(page.getByRole("status")).toContainText("full thinking process is with your teacher");
  await expect(page.getByRole("heading", { name: "Your teacher is reviewing how your thinking changed" })).toBeVisible();
  await login.signOut();

  await login.signIn(accounts.teacher);
  await expect(page.getByRole("heading", { name: "Review the thinking process, not just the final version" })).toBeVisible();
  await expect(page.getByText(studentRawRevision)).toBeVisible();
  await page.getByLabel("What did the work show the learner doing well?", { exact: true }).fill(
    "In this activity, the learner found that both quantities must change together and used that evidence to repair the model.",
  );
  await page.getByLabel("Feedback the learner will receive", { exact: true }).fill(teacherFeedback);
  await page.getByRole("radio", { name: /light/i }).check();
  await page.getByLabel("I read the prediction, first version, critique, revision, and reflection.").check();
  await page.getByRole("button", { name: "Send feedback and open family activity" }).click();
  await expect(page.getByRole("status")).toContainText("family activity are ready");
  await expect(page.getByRole("heading", { name: "The reviewed family activity is open" })).toBeVisible();
  await login.signOut();

  await login.signIn(accounts.parent);
  await expect(page.getByRole("heading", { name: "Continue one useful idea at home" })).toBeVisible();
  await expect(page.getByText(studentRawRevision)).toHaveCount(0);
  await expect(page.getByText("This page does not contain the learner's prediction, draft, critique, revision, model transcript, rank, score, or diagnosis.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "One activity for home" })).toBeVisible();
  await page.getByRole("radio", { name: /We tried it/ }).check();
  await page.getByLabel(/^Short note/).fill("We used a rice and water example, and Diya explained why both amounts had to change together.");
  await page.getByRole("button", { name: "Send response to teacher" }).click();
  await expect(page.getByRole("status")).toContainText("returned to the teacher");
  await expect(page.getByRole("heading", { name: "The teacher has your update" })).toBeVisible();
  await login.signOut();

  await login.signIn(accounts.student);
  await expect(page.getByText(teacherFeedback)).toBeVisible();
  await expect(page.getByText(/next studio will begin with/i)).toContainText("light");
  await login.signOut();

  await login.signIn(accounts.admin);
  await expect(page.getByText(studentRawRevision)).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Studio handoffs" }))
    .toContainText("Learning loop complete");
  await expect(page.getByRole("region", { name: "Explicit teacher plans and student thinking help" }))
    .toContainText("0Recorded AI requests");
  await expectNoSeriousAxeFindings(page);
});

test("role authorization, generic login errors, language, and mobile layout hold", async ({ page }) => {
  const login = new LoginPage(page);

  await login.signIn(accounts.student);
  await page.goto("/portal/admin");
  await expect(page).toHaveURL(/\/portal\/student/);
  await expect(page.getByRole("heading", { name: "Think, make, test, and revise" })).toBeVisible();
  await login.signOut();

  await login.open();
  await page.getByLabel("Email").fill(accounts.teacher.email);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "The email or password is incorrect." }),
  ).toHaveText("The email or password is incorrect.");
  await expect(page).toHaveURL(/\/login/);

  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "മലയാളം" }).click();
  await expect(page.getByRole("heading", { name: "അധ്യാപകർ പഠനത്തിന് വഴിയൊരുക്കുന്നു. ചിന്തിക്കുന്നത് പഠിതാക്കളാണ്." })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ml");
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expectNoSeriousAxeFindings(page);
});
