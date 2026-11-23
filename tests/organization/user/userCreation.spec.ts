import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { openGovernmentOrganizationTab } from "tests/helper/facility";
import {
  createUserViaUi,
  linkUserToOrganizationViaUi,
} from "tests/helper/user";

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
    await openGovernmentOrganizationTab(page, "Users");
  });

  test(
    "Verify validation errors in user creation form",
    { tag: ["@atomic", "@cap:user.create"] },
    async ({ page }) => {
      const email = faker.internet.email();

      await page.getByRole("button", { name: "Add User" }).click();
      await page.getByRole("textbox", { name: "Email" }).fill(email);
      await page.getByRole("button", { name: "Create User" }).click();

      await validateFieldError(page, "First Name", "This field is required");
      await validateFieldError(page, "Last Name", "This field is required");
      await validateFieldError(page, "Username", "This field is required");
      await validateFieldError(page, "Phone Number", "This field is required");
      await validateFieldError(page, "Gender", "Gender is required");
    },
  );

  test(
    "Keep focus in the mobile language list when adding and removing cards",
    { tag: ["@atomic", "@cap:user.create"] },
    async ({ page }) => {
      await page.getByRole("button", { name: "Add User" }).click();
      await page.setViewportSize({ width: 390, height: 844 });
      const sheet = page.getByRole("dialog");
      const add = sheet.getByRole("button", { name: "Add language" });
      const card = (number: number) =>
        sheet.getByRole("group", { name: `Language ${number}`, exact: true });

      await add.click();
      await expect(card(1).getByRole("combobox").first()).toBeFocused();
      await add.click();
      await expect(card(2).getByRole("combobox").first()).toBeFocused();
      await card(1).getByRole("button", { name: "Remove language 1" }).click();
      await expect(card(1).getByRole("combobox").first()).toBeFocused();
      await card(1).getByRole("button", { name: "Remove language 1" }).click();
      await expect(add).toBeFocused();
    },
  );

  test(
    "should reject whitespace-only input in required text fields",
    { tag: ["@atomic", "@cap:user.create"] },
    async ({ page }) => {
      await page.getByRole("button", { name: "Add User" }).click();

      const whitespace = "   ";
      const fields = ["First Name", "Last Name"];

      for (const field of fields) {
        await page.getByRole("textbox", { name: field }).fill(whitespace);
      }

      await page.getByRole("button", { name: "Create User" }).click();

      for (const field of fields) {
        const errorMessage = getFieldErrorMessage(
          page.getByRole("textbox", { name: field }),
        );
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toHaveText("This field is required");
      }
    },
  );

  test(
    "Create a new user and link to organization",
    { tag: ["@atomic", "@cap:user.create"] },
    async ({ page }) => {
      const { username } = await createUserViaUi(page, {
        password: "Test@123",
      });

      await linkUserToOrganizationViaUi(page, { role: "Nurse" });

      await test.step("Verify user in organization user list", async () => {
        await page
          .getByRole("textbox", { name: "Search by username" })
          .fill(username);
        await expect(page.getByText(username)).toBeVisible();
      });
    },
  );
});
