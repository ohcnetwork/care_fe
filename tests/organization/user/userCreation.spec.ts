import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Creation", () => {
  const validateFieldError = async (
    page: Page,
    label: string,
    errorMessage: string,
  ) => {
    const formItem = page
      .locator('div[data-slot="form-item"]')
      .filter({ hasText: label });
    await expect(formItem.locator('p[data-slot="form-message"]')).toContainText(
      errorMessage,
    );
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Governance" }).click();
    await page
      .getByRole("link", { name: /Government$/ })
      .first()
      .click();
    await page.getByRole("menuitem", { name: "Users" }).click();
  });

  test("Verify validation errors in user creation form", async ({ page }) => {
    const email = faker.internet.email();

    await page.getByRole("button", { name: "Add User" }).click();
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("button", { name: "Create User" }).click();

    await validateFieldError(page, "First Name", "This field is required");
    await validateFieldError(page, "Last Name", "This field is required");
    await validateFieldError(page, "Username", "This field is required");
    await validateFieldError(page, "Phone Number", "This field is required");
    await validateFieldError(page, "Gender", "Gender is required");
  });

  test("Create a new user and link to organization", async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = `${firstName.toLowerCase()}${faker.string.numeric(4)}`;
    const email = faker.internet.email({ firstName, lastName });
    const phoneNumber = `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`;
    const password = "Test@123";
    const gender = faker.helpers.arrayElement([
      "Male",
      "Female",
      "Non Binary",
      "Transgender",
    ]);

    await test.step("Open add user form", async () => {
      await page.getByRole("button", { name: "Add User" }).click();
    });

    await test.step("Fill user details", async () => {
      await page.getByRole("combobox", { name: "User Type" }).click();
      await page.getByRole("option", { name: "Doctor" }).click();
      await page.getByRole("textbox", { name: "First Name" }).fill(firstName);
      await page.getByRole("textbox", { name: "Last Name" }).fill(lastName);
      await page.getByRole("textbox", { name: "Username" }).fill(username);
      await page.locator('input[name="password"]').fill(password);
      await page.locator('input[name="c_password"]').fill(password);
      await page.getByRole("textbox", { name: "Email" }).fill(email);
      await page
        .getByRole("textbox", { name: "Phone Number" })
        .fill(phoneNumber);
      await page.getByRole("combobox", { name: "Gender" }).click();
      await page.getByRole("option", { name: gender, exact: true }).click();
    });

    await test.step("Submit user creation", async () => {
      const createUserResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/users/") &&
          response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Create User" }).click();
      const response = await createUserResponse;
      expect(response.status()).toBe(200);
    });

    await test.step("Link user to organization", async () => {
      const linkUserResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/organization/") &&
          response.url().includes("/users/") &&
          response.request().method() === "POST",
      );
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Role" })
        .click();
      await page.getByPlaceholder("Search Roles").fill("Nurse");
      await page.getByRole("option", { name: "Nurse" }).click();
      await page.getByRole("button", { name: "Link to Organization" }).click();
      const response = await linkUserResponse;
      expect(response.status()).toBe(200);
    });

    await test.step("Verify user in organization user list", async () => {
      await page
        .getByRole("textbox", { name: "Search by username" })
        .fill(username);
      await expect(page.getByText(username)).toBeVisible();
    });
  });
});
