import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

const useOptions = ["usual", "official", "temp", "secondary", "old"];
const statusOptions = ["Draft", "Active", "Inactive"];
const serialNumberModes = ["User entered", "Auto-generated"];

test.describe("Patient Identifier Config - Create", () => {
  let use: string;
  let displayName: string;
  let description: string;
  let systemUrl: string;
  let regex: string;
  let retrievalOption: boolean;
  let uniqueOption: boolean;
  let serialNumberMode: string;
  let status: string;

  test.beforeEach(async ({ page }) => {
    use = faker.helpers.arrayElement(useOptions);
    displayName = faker.lorem.words(2);
    description = faker.lorem.sentence();
    systemUrl = faker.internet.url();
    regex = "^[A-Z0-9]+$";
    retrievalOption = faker.datatype.boolean();
    uniqueOption = faker.datatype.boolean();
    serialNumberMode = faker.helpers.arrayElement(serialNumberModes);
    status = faker.helpers.arrayElement(statusOptions);

    const targetUrl = `/admin/patient_identifier_config`;
    await page.goto(targetUrl);
  });

  test("should create a Patient Identifier Config with all fields", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Add patient identifier config" })
      .click();

    await page.getByRole("combobox").filter({ hasText: "usual" }).click();
    await page.getByRole("option", { name: use }).click();

    await page.getByRole("textbox", { name: "Display" }).fill(displayName);
    await page.getByRole("textbox", { name: "Description" }).fill(description);
    await page.getByRole("textbox", { name: "System" }).fill(systemUrl);
    await page.getByRole("textbox", { name: "Regex" }).fill(regex);
    if (retrievalOption) {
      await page
        .getByRole("switch", { name: "Retrieve with year of birth" })
        .click();
    }
    if (uniqueOption) {
      await page.getByRole("switch", { name: "Unique" }).click();
    }
    if (serialNumberMode === "Auto-generated") {
      await page.getByRole("radio", { name: "Auto-generated" }).click();
    }

    await page.getByRole("combobox").filter({ hasText: "Draft" }).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    await page.getByRole("button", { name: "Create" }).click();

    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    // Verify that the new config appears in the list
    await page
      .getByRole("textbox", { name: "Search configs" })
      .fill(displayName);

    const tableBody = page.locator('[data-slot="table-body"]');

    await expect(tableBody).toContainText(displayName);
    await expect(tableBody).toContainText(systemUrl);
    await expect(tableBody).toContainText(use);
    await expect(tableBody).toContainText(status);
  });

  test("should show validation error for missing required fields", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Add patient identifier config" })
      .click();

    await expect(page.getByRole("button", { name: "Create" })).toBeDisabled();

    await page.getByRole("textbox", { name: "Display" }).fill(displayName);
    await page.getByRole("button", { name: "Create" }).click();
    const descriptionError = page
      .getByRole("textbox", { name: "Description" })
      .locator("..")
      .locator('[data-slot="form-message"]');
    await expect(descriptionError).toHaveText("This field is required");

    const systemError = page
      .getByRole("textbox", { name: "System" })
      .locator("..")
      .locator('[data-slot="form-message"]');
    await expect(systemError).toHaveText("This field is required");
  });

  test("should not allow duplicate system URL", async ({ page }) => {
    await page
      .getByRole("button", { name: "Add patient identifier config" })
      .click();

    //Create a config first
    await page.getByRole("combobox").filter({ hasText: "usual" }).click();
    await page.getByRole("option", { name: use }).click();

    await page.getByRole("textbox", { name: "Display" }).fill(displayName);
    await page.getByRole("textbox", { name: "Description" }).fill(description);
    await page.getByRole("textbox", { name: "System" }).fill(systemUrl);

    await page.getByRole("combobox").filter({ hasText: "Draft" }).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    await page.getByRole("button", { name: "Create" }).click();

    // Try to create another config with the same system URL
    await page
      .getByRole("button", { name: "Add patient identifier config" })
      .click();

    await page.getByRole("combobox").filter({ hasText: "usual" }).click();
    await page.getByRole("option", { name: use }).click();

    const newDisplayName = faker.lorem.words(2);
    const newDescription = faker.lorem.sentence();

    await page.getByRole("textbox", { name: "Display" }).fill(newDisplayName);
    await page
      .getByRole("textbox", { name: "Description" })
      .fill(newDescription);
    await page.getByRole("textbox", { name: "System" }).fill(systemUrl);

    await page.getByRole("combobox").filter({ hasText: "Draft" }).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText(
        "A patient identifier config with this system already exists",
      ),
    ).toBeVisible();
  });
});
