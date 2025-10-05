import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly usernameError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-cy="username"]');
    this.passwordInput = page.locator('[data-cy="password"]');
    this.submitButton = page.locator('[data-cy="submit"]');
    this.usernameError = page.locator(
      'label:has-text("Username") ~ p.text-danger-500',
    );
    this.passwordError = page.locator(
      'label:has-text("Password") ~ p.text-danger-500',
    );
  }

  async goto() {
    await this.page.goto("/login");
  }

  async typeUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async typePassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async login(username: string, password: string) {
    await this.typeUsername(username);
    await this.typePassword(password);
    await this.clickSubmit();
  }

  async verifyFormElements() {
    await this.usernameInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
    await this.submitButton.waitFor({ state: "visible" });
  }

  async verifyValidationErrors() {
    await this.usernameError.waitFor({ state: "visible" });
    await this.passwordError.waitFor({ state: "visible" });
  }
}
