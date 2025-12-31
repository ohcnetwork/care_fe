import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const USER_TYPES = ["Doctor", "Nurse", "Staff", "Volunteer", "Administrator"];
const GENDERS = ["Male", "Female", "Non Binary", "Transgender"];
const ROLES = ["Nurse", "Doctor", "Staff"];

test.describe("User Management in Departments", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    await page.goto(`/facility/${facilityId}/settings/departments`);
    await page.getByRole("table").getByText("Administration").first().click();
    await page.getByRole("tab", { name: "Users" }).click();
  });

  test("Create and link a new user to department", async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = `${firstName.toLowerCase()}${faker.string.numeric(4)}`;
    const email = faker.internet.email({ firstName, lastName });
    const password = "Test@123";
    const phoneNumber = `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`;

    await test.step("Navigate to user creation form", async () => {
      await page.getByRole("button", { name: "Add User" }).click();
      await expect(
        page.getByRole("heading", { name: "Add New User" }),
      ).toBeVisible();
    });

    await test.step("Fill and submit user creation form", async () => {
      const userType = faker.helpers.arrayElement(USER_TYPES);
      const gender = faker.helpers.arrayElement(GENDERS);
      await page.getByRole("combobox", { name: "User Type *" }).click();
      await page.getByRole("option", { name: userType }).click();
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
      await page.getByRole("option", { name: gender, exact: true }).click();

      const createButton = page.getByRole("button", { name: "Create User" });
      await createButton.click();
    });

    await test.step("Link user to organization", async () => {
      const role = faker.helpers.arrayElement(ROLES);
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Role" })
        .click();
      await page.getByPlaceholder("Search Roles").fill(role);
      await page.getByRole("option", { name: role }).click();
      await page.getByRole("button", { name: "Add to Organization" }).click();

      await expect(
        page
          .getByRole("region", { name: "Notifications" })
          .getByText("User added successfully"),
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page
          .getByRole("region", { name: "Notifications" })
          .getByText("User added to organization successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify user appears in department users list", async () => {
      await page
        .getByRole("textbox", { name: "Search by username" })
        .fill(username);
      await expect(page.getByText(username)).toBeVisible();
    });
  });

  test("Open user creation form with default values", async ({ page }) => {
    await page.getByRole("button", { name: "Add User" }).click();

    await expect(
      page.getByRole("heading", { name: "Add New User" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "User Type *" }),
    ).toHaveText("Nurse");
    await expect(
      page.getByRole("radio", { name: "Set password now" }),
    ).toBeChecked();
  });
});
