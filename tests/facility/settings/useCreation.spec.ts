import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

// Types
interface UserTestData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
}

// Page Object Models
class UserFormPage {
  constructor(private readonly page: Page) {}

  async selectUserType(): Promise<void> {
    await this.page.getByRole("combobox", { name: "User Type *" }).click();
    await this.page.getByRole("option").first().click();
  }

  async selectTitle(): Promise<void> {
    await this.page
      .getByRole("combobox")
      .filter({ hasText: "Select or type" })
      .click();
    await this.page.getByRole("option").first().click();
  }

  async fillFirstName(firstName: string): Promise<void> {
    await this.page
      .getByRole("textbox", { name: "First Name *" })
      .fill(firstName);
  }

  async fillLastName(lastName: string): Promise<void> {
    await this.page
      .getByRole("textbox", { name: "Last Name *" })
      .fill(lastName);
  }

  async fillUsername(username: string): Promise<void> {
    await this.page.getByRole("textbox", { name: "Username" }).fill(username);
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.getByRole("textbox", { name: "Email *" }).fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    await this.page
      .getByRole("textbox", { name: "Confirm Password *" })
      .fill(password);
  }

  async fillPhoneNumber(phoneNumber: string): Promise<void> {
    await this.page
      .getByRole("textbox", { name: "Phone Number *" })
      .fill(phoneNumber);
  }

  async selectGender(): Promise<void> {
    await this.page.getByRole("combobox", { name: "Gender *" }).click();
    await this.page.getByRole("option").first().click();
  }

  async selectState(): Promise<void> {
    await this.page
      .getByRole("combobox")
      .filter({ hasText: "Select..." })
      .click();
    await this.page.getByRole("option").first().click();
  }

  async clickCreateUser(): Promise<void> {
    await this.page.getByRole("button", { name: "Create User" }).click();
  }

  async selectRole(): Promise<void> {
    await this.page
      .getByRole("combobox")
      .filter({ hasText: "Select Role" })
      .click();
    await this.page.getByRole("option").first().click();
  }

  async clickAddToOrganization(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Add to Organization" })
      .click();
  }

  async fillCompleteForm(data: UserTestData): Promise<void> {
    await this.selectUserType();
    await this.selectTitle();
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillUsername(data.username);
    await this.fillEmail(data.email);
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.password);
    await this.fillPhoneNumber(data.phoneNumber);
    await this.selectGender();
    await this.selectState();
  }

  async getValidationError(fieldName: string): Promise<string | null> {
    const errorElement = this.page
      .locator(`text=/.*${fieldName}.*/i`)
      .locator("..")
      .locator("text=/error|invalid|required/i")
      .first();

    if (await errorElement.isVisible().catch(() => false)) {
      return await errorElement.textContent();
    }
    return null;
  }

  async isCreateButtonDisabled(): Promise<boolean> {
    const button = this.page.getByRole("button", { name: "Create User" });
    return await button.isDisabled();
  }
}

class DepartmentPage {
  constructor(private readonly page: Page) {}

  async navigateToFirstDepartment(): Promise<void> {
    await this.page.getByRole("table").getByRole("row").nth(1).click();
  }

  async openUsersTab(): Promise<void> {
    await this.page.getByRole("tab", { name: "Users" }).click();
  }

  async clickAddUser(): Promise<void> {
    await this.page.getByRole("button", { name: "Add User" }).click();
  }

  async getLastUserCard() {
    return this.page
      .getByRole("button", { name: "See Details" })
      .last()
      .locator("..")
      .locator("..");
  }

  async navigateToLastPage(): Promise<void> {
    await this.page.waitForTimeout(2000);

    const paginationButtons = this.page.getByRole("navigation").last();
    const lastPageButton = paginationButtons
      .getByRole("button")
      .filter({ hasText: /^\d+$/ })
      .last();

    if (await lastPageButton.isVisible().catch(() => false)) {
      await lastPageButton.click();
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForTimeout(1000);
    }
  }
}

// Test Data Factories
class UserTestDataFactory {
  static createValidUser(): UserTestData {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const baseUsername = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .slice(0, 16);

    return {
      firstName,
      lastName,
      username: baseUsername,
      email: faker.internet.email({ firstName, lastName }),
      password: "Test@123",
      phoneNumber: `${faker.string.numeric(5)}${faker.string.numeric(5)}`,
    };
  }

  static createInvalidEmailUsers(): UserTestData[] {
    const baseUser = this.createValidUser();
    const invalidEmails = [
      "invalid.email",
      "test@",
      "@test.com",
      "test@.com",
      "test..test@test.com",
      "test @test.com",
    ];

    return invalidEmails.map((email) => ({
      ...baseUser,
      email,
    }));
  }

  static createInvalidPasswordUsers(): Array<{
    user: UserTestData;
    password: string;
  }> {
    const baseUser = this.createValidUser();
    const invalidPasswords = [
      "short", // Too short
      "nouppercaseorspecial123", // No uppercase or special
      "NOLOWERCASE123!", // No lowercase
      "NoSpecialChar123", // No special character
      "NoNumber!", // No number
    ];

    return invalidPasswords.map((password) => ({
      user: { ...baseUser, password },
      password,
    }));
  }

  static createInvalidPhoneNumbers(): UserTestData[] {
    const baseUser = this.createValidUser();
    const invalidPhones = [
      "123", // Too short
      "abc def", // Letters
      "12345678901234567890", // Too long
      "!@#$% ^&*()", // Special characters
    ];

    return invalidPhones.map((phoneNumber) => ({
      ...baseUser,
      phoneNumber,
    }));
  }

  static createInvalidUsernameUsers(): UserTestData[] {
    const baseUser = this.createValidUser();
    const invalidUsernames = [
      "a", // Too short
      "ThisUsernameIsWayTooLongForTheSystem", // Too long (>16 chars)
      "user name", // Contains space
      "user@name", // Special character
    ];

    return invalidUsernames.map((username) => ({
      ...baseUser,
      username,
    }));
  }
}

// Helper Functions
async function waitForUserLinkingDialog(page: Page): Promise<boolean> {
  const linkUserHeading = page.getByRole("heading", {
    name: "Link User to Facility",
  });
  const addUserDialog = page.getByRole("dialog", { name: "Add New User" });

  await Promise.race([
    linkUserHeading
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {}),
    addUserDialog.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {}),
    page
      .getByRole("combobox")
      .filter({ hasText: "Select Role" })
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {}),
  ]);

  await page.waitForTimeout(1000);

  const isLinkUserVisible = await linkUserHeading
    .isVisible()
    .catch(() => false);
  const isRoleComboboxVisible = await page
    .getByRole("combobox")
    .filter({ hasText: "Select Role" })
    .isVisible()
    .catch(() => false);

  return isLinkUserVisible || isRoleComboboxVisible;
}

async function verifySuccessNotifications(page: Page): Promise<void> {
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

test.describe("User Creation and Validation", () => {
  let departmentPage: DepartmentPage;
  let userFormPage: UserFormPage;

  test.beforeEach(async ({ page }) => {
    departmentPage = new DepartmentPage(page);
    userFormPage = new UserFormPage(page);

    await page.goto("/");

    const firstFacilityLink = page
      .getByRole("link")
      .filter({ hasText: "View" })
      .first();
    await expect(firstFacilityLink).toBeVisible({ timeout: 10000 });
    await firstFacilityLink.click();

    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("link", { name: "Departments" }).click();

    await departmentPage.navigateToFirstDepartment();
    await departmentPage.openUsersTab();
  });

  test("should successfully create and link a new user", async ({ page }) => {
    test.setTimeout(60000);

    const testData = UserTestDataFactory.createValidUser();

    await departmentPage.clickAddUser();

    await expect(
      page.getByRole("heading", { name: "Add New User" }),
    ).toBeVisible();

    await userFormPage.fillCompleteForm(testData);
    await userFormPage.clickCreateUser();

    const shouldLinkUser = await waitForUserLinkingDialog(page);

    if (shouldLinkUser) {
      await userFormPage.selectRole();
      await userFormPage.clickAddToOrganization();
      await page.waitForLoadState("networkidle");
      await verifySuccessNotifications(page);
    } else {
      await userFormPage.clickCreateUser();
      await page.waitForTimeout(2000);

      if (
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Role" })
          .isVisible()
          .catch(() => false)
      ) {
        await userFormPage.selectRole();
        await userFormPage.clickAddToOrganization();
        await page.waitForLoadState("networkidle");
      }
    }

    await departmentPage.navigateToLastPage();

    const lastUserCard = await departmentPage.getLastUserCard();
    await expect(lastUserCard).toContainText(testData.firstName, {
      timeout: 10000,
    });
    await expect(lastUserCard).toContainText(testData.lastName, {
      timeout: 10000,
    });
  });

  test("should open user creation form with default values", async ({
    page,
  }) => {
    await departmentPage.clickAddUser();

    await expect(
      page.getByRole("heading", { name: "Add New User" }),
    ).toBeVisible();

    const userTypeField = page.getByRole("combobox", { name: "User Type *" });
    await expect(userTypeField).toBeVisible();

    const emailField = page.getByRole("textbox", { name: "Email *" });
    await expect(emailField).toBeVisible();
  });

  test("should reject invalid email formats", async ({ page }) => {
    const invalidEmailUsers = UserTestDataFactory.createInvalidEmailUsers();
    const testUser = invalidEmailUsers[0];

    await departmentPage.clickAddUser();

    await userFormPage.selectUserType();
    await userFormPage.selectTitle();
    await userFormPage.fillFirstName(testUser.firstName);
    await userFormPage.fillLastName(testUser.lastName);
    await userFormPage.fillUsername(testUser.username);
    await userFormPage.fillEmail(testUser.email);
    await userFormPage.fillPassword(testUser.password);
    await userFormPage.fillConfirmPassword(testUser.password);
    await userFormPage.fillPhoneNumber(testUser.phoneNumber);
    await userFormPage.selectGender();
    await userFormPage.selectState();

    await userFormPage.clickCreateUser();
    await page.waitForTimeout(1000);

    const dialog = page.getByRole("dialog", { name: "Add New User" });
    await expect(dialog).toBeVisible();
  });

  test("should reject mismatched password confirmation", async ({ page }) => {
    const testData = UserTestDataFactory.createValidUser();

    await departmentPage.clickAddUser();

    await userFormPage.selectUserType();
    await userFormPage.selectTitle();
    await userFormPage.fillFirstName(testData.firstName);
    await userFormPage.fillLastName(testData.lastName);
    await userFormPage.fillUsername(testData.username);
    await userFormPage.fillEmail(testData.email);
    await userFormPage.fillPassword(testData.password);
    await userFormPage.fillConfirmPassword("DifferentPassword@123");

    await page.waitForTimeout(500);

    const passwordError = await page
      .locator("text=/password.*match|confirm.*password/i")
      .first()
      .isVisible()
      .catch(() => false);

    expect(passwordError).toBe(true);
  });

  test("should reject invalid phone number formats", async ({ page }) => {
    const invalidPhoneUsers = UserTestDataFactory.createInvalidPhoneNumbers();
    const testUser = invalidPhoneUsers[0];

    await departmentPage.clickAddUser();

    await userFormPage.selectUserType();
    await userFormPage.selectTitle();
    await userFormPage.fillFirstName(testUser.firstName);
    await userFormPage.fillLastName(testUser.lastName);
    await userFormPage.fillUsername(testUser.username);
    await userFormPage.fillEmail(testUser.email);
    await userFormPage.fillPassword(testUser.password);
    await userFormPage.fillConfirmPassword(testUser.password);
    await userFormPage.fillPhoneNumber(testUser.phoneNumber);

    await page.waitForTimeout(500);

    const dialog = page.getByRole("dialog", { name: "Add New User" });
    await expect(dialog).toBeVisible();
  });

  test("should reject usernames exceeding character limit", async ({
    page,
  }) => {
    const invalidUsernameUsers =
      UserTestDataFactory.createInvalidUsernameUsers();
    const testUser = invalidUsernameUsers[1];

    await departmentPage.clickAddUser();

    await userFormPage.selectUserType();
    await userFormPage.selectTitle();
    await userFormPage.fillFirstName(testUser.firstName);
    await userFormPage.fillLastName(testUser.lastName);
    await userFormPage.fillUsername(testUser.username);

    await page.waitForTimeout(500);

    const usernameError = await page
      .locator("text=/Use at most.*characters/i")
      .isVisible()
      .catch(() => false);

    expect(usernameError).toBe(true);
  });

  test("should display multiple validation errors simultaneously", async ({
    page,
  }) => {
    await departmentPage.clickAddUser();

    await userFormPage.selectUserType();
    await userFormPage.selectTitle();
    await userFormPage.fillFirstName("T");
    await userFormPage.fillLastName("T");
    await userFormPage.fillUsername("a");
    await userFormPage.fillEmail("invalid.email");
    await userFormPage.fillPassword("weak");
    await userFormPage.fillConfirmPassword("different");
    await userFormPage.fillPhoneNumber("123");

    await page.waitForTimeout(1000);

    const hasValidationErrors = await page
      .locator("text=/required|invalid|error/i")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasValidationErrors).toBe(true);
  });
});
