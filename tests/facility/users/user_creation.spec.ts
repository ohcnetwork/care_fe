import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

// Constants
const USER_CONSTANTS = {
  USER_TYPES: ["Nurse", "Doctor", "Staff", "Volunteer", "Administrator"], // Available user types
  TITLES: ["Mr.", "Ms.", "Mrs.", "Dr."],
  GENDERS: ["Male", "Female", "Non Binary"], // Note: "Non Binary" with space
  ROLES: ["Admin Administrator", "Staff", "Doctor", "Nurse"],
} as const;

// Types
interface UserTestData {
  userType: string;
  title: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  gender: string;
  state: string;
  role: string;
}

// Helper Classes
class UserFormPage {
  constructor(private readonly page: Page) {}

  async selectUserType(): Promise<void> {
    await this.page.getByRole("combobox", { name: "User Type *" }).click();
    // Select the first available user type
    await this.page.getByRole("option").first().click();
  }

  async selectTitle(): Promise<void> {
    await this.page
      .getByRole("combobox")
      .filter({ hasText: "Select or type" })
      .click();
    // Select the first available title
    await this.page.getByRole("option").first().click();
  }

  async fillBasicInfo(data: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  }): Promise<void> {
    await this.page
      .getByRole("textbox", { name: "First Name *" })
      .fill(data.firstName);
    await this.page
      .getByRole("textbox", { name: "Last Name *" })
      .fill(data.lastName);
    await this.page
      .getByRole("textbox", { name: "Username" })
      .fill(data.username);
    await this.page.getByRole("textbox", { name: "Email *" }).fill(data.email);
  }

  async fillPasswordInfo(password: string): Promise<void> {
    await this.page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill(password);
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
    // Select the first available gender option
    await this.page.getByRole("option").first().click();
  }

  async selectState(): Promise<void> {
    await this.page
      .getByRole("combobox")
      .filter({ hasText: "Select..." })
      .click();
    // Select the first available state
    await this.page.getByRole("option").first().click();
  }

  async submitUser(): Promise<void> {
    await this.page.getByRole("button", { name: "Create User" }).click();
  }

  async selectRole(): Promise<void> {
    await this.page
      .getByRole("combobox")
      .filter({ hasText: "Select Role" })
      .click();
    // Select the first available role
    await this.page.getByRole("option").first().click();
  }

  async addToOrganization(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Add to Organization" })
      .click();
  }
}

class DepartmentNavigationPage {
  constructor(private readonly page: Page) {}

  async navigateToFirstDepartment(): Promise<void> {
    // Click the first department in the table
    await this.page.getByRole("table").getByRole("row").nth(1).click();
  }

  async openUsersTab(): Promise<void> {
    await this.page.getByRole("tab", { name: "Users" }).click();
  }

  async clickAddUser(): Promise<void> {
    await this.page.getByRole("button", { name: "Add User" }).click();
  }
}

// Test Data Factory
class UserTestDataFactory {
  static createUser(): UserTestData {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // Ensure username is max 16 characters
    const baseUsername = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .slice(0, 16);

    return {
      userType: faker.helpers.arrayElement(USER_CONSTANTS.USER_TYPES),
      title: faker.helpers.arrayElement(USER_CONSTANTS.TITLES),
      firstName,
      lastName,
      username: baseUsername,
      email: faker.internet.email({ firstName, lastName }),
      password: "Test@123", // Fixed password for test consistency
      phoneNumber: faker.string.numeric(5) + " " + faker.string.numeric(5),
      gender: faker.helpers.arrayElement(USER_CONSTANTS.GENDERS),
      state: "", // Will be selected from available options
      role: faker.helpers.arrayElement(USER_CONSTANTS.ROLES),
    };
  }
}

test.describe("User Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("/");

    // Navigate to first available facility
    const firstFacilityLink = page
      .getByRole("link")
      .filter({ hasText: "View" })
      .first();
    await expect(firstFacilityLink).toBeVisible({ timeout: 10000 });
    await firstFacilityLink.click();

    // Open sidebar and navigate to settings
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("link", { name: "Departments" }).click();
  });

  test("should create a new user and link to facility", async ({ page }) => {
    const testData = UserTestDataFactory.createUser();
    const departmentNav = new DepartmentNavigationPage(page);
    const userForm = new UserFormPage(page);

    // Navigate to department users
    await departmentNav.navigateToFirstDepartment();
    await departmentNav.openUsersTab();

    await departmentNav.clickAddUser();

    // Wait for the form to be visible
    await expect(
      page.getByRole("heading", { name: "Add New User" }),
    ).toBeVisible();

    // Fill user creation form - using first() selectors instead of hardcoded values
    await userForm.selectUserType();
    await userForm.selectTitle();
    await userForm.fillBasicInfo({
      firstName: testData.firstName,
      lastName: testData.lastName,
      username: testData.username,
      email: testData.email,
    });
    await userForm.fillPasswordInfo(testData.password);
    await userForm.fillPhoneNumber(testData.phoneNumber);
    await userForm.selectGender();
    await userForm.selectState();

    // Submit user creation
    await userForm.submitUser();

    // Wait for either the "Link User to Facility" sheet or dialog to close
    // Sometimes the Create User button triggers role selection directly
    const linkUserHeading = page.getByRole("heading", {
      name: "Link User to Facility",
    });
    const addUserDialog = page.getByRole("dialog", { name: "Add New User" });

    // Wait for one of these conditions:
    // 1. Link User dialog appears
    // 2. Add User dialog closes
    // 3. Role selection combobox appears
    await Promise.race([
      linkUserHeading
        .waitFor({ state: "visible", timeout: 15000 })
        .catch(() => {}),
      addUserDialog
        .waitFor({ state: "hidden", timeout: 15000 })
        .catch(() => {}),
      page
        .getByRole("combobox")
        .filter({ hasText: "Select Role" })
        .waitFor({ state: "visible", timeout: 15000 })
        .catch(() => {}),
    ]);

    await page.waitForTimeout(1000);

    // Check if we need to handle the Link User sheet or if role selection is already visible
    const isLinkUserVisible = await linkUserHeading
      .isVisible()
      .catch(() => false);
    const isRoleComboboxVisible = await page
      .getByRole("combobox")
      .filter({ hasText: "Select Role" })
      .isVisible()
      .catch(() => false);

    if (isLinkUserVisible || isRoleComboboxVisible) {
      // Select role and add to organization
      await userForm.selectRole();
      await userForm.addToOrganization();

      // Wait for the sheet to close and success notifications
      await page.waitForLoadState("networkidle");

      // Verify success notifications appear
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
    } else {
      // If neither dialog appeared, the form might still be showing
      // Log this for debugging
      console.log("⚠️ Neither Link User dialog nor role selection appeared");
      // Try clicking Create User again
      await userForm.submitUser();
      await page.waitForTimeout(2000);

      // Try one more time to find the role selection
      if (
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Role" })
          .isVisible()
          .catch(() => false)
      ) {
        await userForm.selectRole();
        await userForm.addToOrganization();
        await page.waitForLoadState("networkidle");
      }
    }

    // Navigate to last page to find the newly created user
    await page.waitForTimeout(2000);

    // Check if pagination exists
    const paginationButtons = page.getByRole("navigation").last();
    const lastPageButton = paginationButtons
      .getByRole("button")
      .filter({ hasText: /^\d+$/ })
      .last();

    // If pagination exists, click the last page
    if (await lastPageButton.isVisible().catch(() => false)) {
      await lastPageButton.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
    }

    // Verify the new user card is visible (should be the last card on the last page)
    const lastUserCard = page
      .getByRole("button", { name: "See Details" })
      .last()
      .locator("..")
      .locator("..");

    // Verify the user's first and last name appear in the card
    await expect(lastUserCard).toContainText(testData.firstName, {
      timeout: 10000,
    });
    await expect(lastUserCard).toContainText(testData.lastName, {
      timeout: 10000,
    });

    console.log(
      `✅ User ${testData.firstName} ${testData.lastName} created and linked successfully`,
    );
  });
});
