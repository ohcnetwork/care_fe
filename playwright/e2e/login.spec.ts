import { test } from "@playwright/test";
import { LoginPage } from "../pageobjects/LoginPage";

test.describe("Login Page", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display login form elements", async () => {
    await loginPage.verifyFormElements();
  });

  test("should show validation errors when submitting empty form", async () => {
    await loginPage.clickSubmit();
    await loginPage.verifyValidationErrors();
  });
});
