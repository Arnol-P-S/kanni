import { expect, type Page } from "@playwright/test";

export const accounts = {
  admin: { email: "admin@riverbank.example", password: "RiverbankAdmin2026" },
  teacher: { email: "teacher@riverbank.example", password: "TeacherStudio2026" },
  student: { email: "student@riverbank.example", password: "StudentAgency2026" },
  parent: { email: "parent@riverbank.example", password: "ParentCircle2026" },
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
  }

  async signOut(): Promise<void> {
    await this.page.getByRole("button", { name: "Sign out" }).click();
    await expect(this.page).toHaveURL(/\/login\?notice=signed-out/);
  }
}
