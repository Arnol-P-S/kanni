import { expect, type Page } from "@playwright/test";

export const accounts = {
  admin: { email: "admin@kanni.local", password: "Admin@Kanni2026" },
  teacher: { email: "teacher@kanni.local", password: "Teacher@Kanni2026" },
  student: { email: "student@kanni.local", password: "Student@Kanni2026" },
  parent: { email: "parent@kanni.local", password: "Parent@Kanni2026" },
} as const;

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto("/login");
    await expect(this.page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  }

  async signIn(account: { email: string; password: string }): Promise<void> {
    await this.open();
    await this.page.getByLabel("Email").fill(account.email);
    await this.page.getByLabel("Password").fill(account.password);
    await this.page.getByRole("button", { name: "Open workspace" }).click();
    await expect(this.page).toHaveURL(/\/portal\//);
    const english = this.page.getByRole("button", { name: "English" });
    if ((await english.getAttribute("aria-pressed")) === "false") {
      await english.click();
      await expect(english).toHaveAttribute("aria-pressed", "true");
    }
  }

  async signOut(): Promise<void> {
    await this.page.getByRole("button", { name: "Sign out" }).click();
    await expect(this.page).toHaveURL(/\/login\?notice=signed-out/);
  }
}

export class WorkspacePage {
  constructor(private readonly page: Page) {}

  async expectHandoff(name: string): Promise<void> {
    await expect(
      this.page.getByText("Current handoff").locator("..").getByText(name),
    ).toBeVisible();
  }
}
