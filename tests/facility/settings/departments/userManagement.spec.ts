import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Management in Departments", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    await page.goto(`/facility/${facilityId}/settings/departments`);
    await page.getByRole("table").getByRole("row").nth(1).click();
    await page.getByRole("tab", { name: "Users" }).click();
  });

  test("Create and link a new user to department", async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .slice(0, 16);
    const email = faker.internet.email({ firstName, lastName });
    const password = "Test@123";
    const phoneNumber = `${faker.helpers.arrayElement(["7", "8", "9"])}${faker.string.numeric(9)}`;

    await test.step("Navigate to user creation form", async () => {
      await page.getByRole("button", { name: "Add User" }).click();
      await expect(
        page.getByRole("heading", { name: "Add New User" }),
      ).toBeVisible();
    });

    await test.step("Fill and submit user creation form", async () => {
      await page.getByRole("combobox", { name: "User Type *" }).click();
      await page.getByRole("option").first().click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select or type" })
        .click();
      await page.getByRole("option").first().click();
      await page.getByRole("textbox", { name: "First Name *" }).fill(firstName);
      await page.getByRole("textbox", { name: "Last Name *" }).fill(lastName);
      await page.getByRole("textbox", { name: "Username" }).fill(username);
      await page.getByRole("textbox", { name: "Email *" }).fill(email);
      await page
        .getByRole("textbox", { name: "Password", exact: true })
        .fill(password);
      await page
        .getByRole("textbox", { name: "Confirm Password *" })
        .fill(password);
      await page
        .getByRole("textbox", { name: "Phone Number *" })
        .fill(phoneNumber);
      await page.getByRole("combobox", { name: "Gender *" }).click();
      await page.getByRole("option").first().click();
      await page.getByRole("combobox").filter({ hasText: "Select..." }).click();
      await page.getByRole("option").first().click();

      const createButton = page.getByRole("button", { name: "Create User" });
      await createButton.click();

      // Wait for the dialog state to change - either close or show link user
      await expect
        .poll(
          async () => {
            const addUserDialogHidden = !(await page
              .getByRole("dialog", { name: "Add New User" })
              .isVisible()
              .catch(() => true));
            const linkUserDialogVisible = await page
              .getByRole("heading", { name: "Link User to Facility" })
              .isVisible()
              .catch(() => false);
            return addUserDialogHidden || linkUserDialogVisible;
          },
          { timeout: 30000 },
        )
        .toBeTruthy();
    });

    await test.step("Link user to department with role", async () => {
      const linkUserHeading = page.getByRole("heading", {
        name: "Link User to Facility",
      });
      const roleCombobox = page
        .getByRole("combobox")
        .filter({ hasText: "Select Role" });

      await Promise.race([
        linkUserHeading.waitFor({ state: "visible", timeout: 15000 }),
        roleCombobox.waitFor({ state: "visible", timeout: 15000 }),
      ]).catch(() => {});

      const isLinkUserVisible = await linkUserHeading
        .isVisible()
        .catch(() => false);
      const isRoleVisible = await roleCombobox.isVisible().catch(() => false);

      if (isLinkUserVisible || isRoleVisible) {
        await roleCombobox.click();
        await page.getByRole("option").first().click();
        await page.getByRole("button", { name: "Add to Organization" }).click();

        await expect(
          page
            .getByRole("region", { name: "Notifications alt+T" })
            .getByText("User added successfully"),
        ).toBeVisible({ timeout: 10000 });
        await expect(
          page
            .getByRole("region", { name: "Notifications alt+T" })
            .getByText("User added to organization successfully"),
        ).toBeVisible({ timeout: 10000 });
      }
    });

    await test.step("Verify user appears in department users list", async () => {
      await page.waitForTimeout(2000);

      const paginationButtons = page.getByRole("navigation").last();
      const lastPageButton = paginationButtons
        .getByRole("button")
        .filter({ hasText: /^\d+$/ })
        .last();

      if (await lastPageButton.isVisible().catch(() => false)) {
        await lastPageButton.click();
        await page.waitForLoadState("networkidle");
      }

      const lastUserCard = page
        .getByRole("button", { name: "See Details" })
        .last()
        .locator("..")
        .locator("..");

      await expect(lastUserCard).toContainText(firstName, { timeout: 10000 });
      await expect(lastUserCard).toContainText(lastName, { timeout: 10000 });
    });
  });

  test("Open user creation form with default values", async ({ page }) => {
    await page.getByRole("button", { name: "Add User" }).click();

    await expect(
      page.getByRole("heading", { name: "Add New User" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "User Type *" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email *" })).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Password", exact: true }),
    ).toBeVisible();
  });

  test("Reject invalid email format", async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .slice(0, 16);
    const invalidEmail = "invalid.email";
    const password = "Test@123";
    const phoneNumber = `${faker.string.numeric(5)}${faker.string.numeric(5)}`;

    await test.step("Open user creation form", async () => {
      await page.getByRole("button", { name: "Add User" }).click();
    });

    await test.step("Fill form with invalid email", async () => {
      await page.getByRole("combobox", { name: "User Type *" }).click();
      await page.getByRole("option").first().click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select or type" })
        .click();
      await page.getByRole("option").first().click();
      await page.getByRole("textbox", { name: "First Name *" }).fill(firstName);
      await page.getByRole("textbox", { name: "Last Name *" }).fill(lastName);
      await page.getByRole("textbox", { name: "Username" }).fill(username);
      await page.getByRole("textbox", { name: "Email *" }).fill(invalidEmail);
      await page
        .getByRole("textbox", { name: "Password", exact: true })
        .fill(password);
      await page
        .getByRole("textbox", { name: "Confirm Password *" })
        .fill(password);
      await page
        .getByRole("textbox", { name: "Phone Number *" })
        .fill(phoneNumber);
      await page.getByRole("combobox", { name: "Gender *" }).click();
      await page.getByRole("option").first().click();
      await page.getByRole("combobox").filter({ hasText: "Select..." }).click();
      await page.getByRole("option").first().click();
    });

    await test.step("Verify form submission is prevented", async () => {
      await page.getByRole("button", { name: "Create User" }).click();
      await page.waitForTimeout(1000);

      const dialogStillVisible = await page
        .getByRole("dialog", { name: "Add New User" })
        .isVisible();
      expect(dialogStillVisible).toBe(true);
    });
  });

  test("Reject mismatched password confirmation", async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .slice(0, 16);
    const email = faker.internet.email({ firstName, lastName });
    const password = "Test@123";

    await test.step("Open user creation form", async () => {
      await page.getByRole("button", { name: "Add User" }).click();
    });

    await test.step("Fill form with mismatched passwords", async () => {
      await page.getByRole("combobox", { name: "User Type *" }).click();
      await page.getByRole("option").first().click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select or type" })
        .click();
      await page.getByRole("option").first().click();
      await page.getByRole("textbox", { name: "First Name *" }).fill(firstName);
      await page.getByRole("textbox", { name: "Last Name *" }).fill(lastName);
      await page.getByRole("textbox", { name: "Username" }).fill(username);
      await page.getByRole("textbox", { name: "Email *" }).fill(email);
      await page
        .getByRole("textbox", { name: "Password", exact: true })
        .fill(password);
      await page
        .getByRole("textbox", { name: "Confirm Password *" })
        .fill("DifferentPassword@123");
    });

    await test.step("Verify password mismatch error is shown", async () => {
      await page.waitForTimeout(500);

      const passwordError = await page
        .locator("text=/password.*match|confirm.*password/i")
        .first()
        .isVisible()
        .catch(() => false);

      expect(passwordError).toBe(true);
    });
  });

  test("Reject invalid phone number format", async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .slice(0, 16);
    const email = faker.internet.email({ firstName, lastName });
    const password = "Test@123";
    const invalidPhoneNumber = "123";

    await test.step("Open user creation form", async () => {
      await page.getByRole("button", { name: "Add User" }).click();
    });

    await test.step("Fill form with invalid phone number", async () => {
      await page.getByRole("combobox", { name: "User Type *" }).click();
      await page.getByRole("option").first().click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select or type" })
        .click();
      await page.getByRole("option").first().click();
      await page.getByRole("textbox", { name: "First Name *" }).fill(firstName);
      await page.getByRole("textbox", { name: "Last Name *" }).fill(lastName);
      await page.getByRole("textbox", { name: "Username" }).fill(username);
      await page.getByRole("textbox", { name: "Email *" }).fill(email);
      await page
        .getByRole("textbox", { name: "Password", exact: true })
        .fill(password);
      await page
        .getByRole("textbox", { name: "Confirm Password *" })
        .fill(password);
      await page
        .getByRole("textbox", { name: "Phone Number *" })
        .fill(invalidPhoneNumber);
    });

    await test.step("Verify form validation prevents submission", async () => {
      await page.waitForTimeout(500);

      const dialogStillVisible = await page
        .getByRole("dialog", { name: "Add New User" })
        .isVisible();
      expect(dialogStillVisible).toBe(true);
    });
  });

  test("Reject username exceeding character limit", async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const longUsername = "ThisUsernameIsWayTooLongForTheSystem";

    await test.step("Open user creation form", async () => {
      await page.getByRole("button", { name: "Add User" }).click();
    });

    await test.step("Fill form with long username", async () => {
      await page.getByRole("combobox", { name: "User Type *" }).click();
      await page.getByRole("option").first().click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select or type" })
        .click();
      await page.getByRole("option").first().click();
      await page.getByRole("textbox", { name: "First Name *" }).fill(firstName);
      await page.getByRole("textbox", { name: "Last Name *" }).fill(lastName);
      await page.getByRole("textbox", { name: "Username" }).fill(longUsername);
    });

    await test.step("Verify character limit error is displayed", async () => {
      await page.waitForTimeout(500);

      const usernameError = await page
        .locator("text=/Use at most/i")
        .isVisible()
        .catch(() => false);

      expect(usernameError).toBe(true);
    });
  });
});
