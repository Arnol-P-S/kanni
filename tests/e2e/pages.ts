import { expect, type Page } from "@playwright/test";

export class ClassOnePage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto("/learn/class-1/add-within-10");
    await expect(
      this.page.getByRole("heading", { name: "കൂട്ടി നോക്കാം" }),
    ).toBeVisible();
  }

  async completeAfterHint() {
    await this.page.getByRole("button", { name: "Answer 4" }).click();
    await expect(
      this.page.getByRole("heading", {
        name: /ആദ്യം രണ്ട് വൃത്തങ്ങൾ എണ്ണൂ/,
      }),
    ).toBeVisible();
    await this.page.getByRole("button", { name: /അടുത്ത ചോദ്യം/ }).click();
    await this.page.getByRole("button", { name: "Answer 6" }).click();
    await expect(
      this.page.getByRole("heading", { name: /തുടർ ഉത്തരം ശരിയാണ്/ }),
    ).toBeVisible();
  }
}

export class TeacherPage {
  constructor(private readonly page: Page) {}

  async openAndChooseObjects() {
    await this.page.goto("/teacher");
    await expect(
      this.page.getByRole("heading", {
        name: /Review one activity/,
      }),
    ).toBeVisible();
    await expect(this.page.getByText(/initial answer was incorrect/i)).toBeVisible();
    await this.page.getByRole("button", { name: /Use objects/ }).click();
    await expect(this.page.getByText("approved", { exact: true })).toBeVisible();
  }

  async chooseStrategy(name: RegExp) {
    await this.page.goto("/teacher");
    await this.page.getByRole("button", { name }).click();
    await expect(this.page.getByText("approved", { exact: true })).toBeVisible();
  }
}

export class ParentPage {
  constructor(private readonly page: Page) {}

  async openAndVerifyObjectsPrompt() {
    await this.page.goto("/parent");
    await expect(
      this.page.getByRole("heading", {
        name: /One clear update/,
      }),
    ).toBeVisible();
    await expect(this.page.getByText(/Place two spoons beside three spoons/)).toBeVisible();
    await expect(this.page.getByText(/custom learner question/i)).toBeVisible();
  }
}

export class ClassElevenPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto("/learn/class-11/linear-search");
    await expect(
      this.page.getByRole("heading", { name: /Trace linear search/ }),
    ).toBeVisible();
  }

  async confirmAdultGate() {
    await this.page
      .getByLabel(/I am 18 or older and I am testing this prototype/)
      .check();
    await this.page
      .getByRole("button", { name: "Confirm adult supervision" })
      .click();
    await expect(this.page.getByLabel("Custom lesson question")).toBeVisible();
  }
}
