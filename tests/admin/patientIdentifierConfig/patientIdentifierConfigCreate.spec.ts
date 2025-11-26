import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  createPatientIdentifierConfig,
  searchForConfig,
  setStatusFilter,
  verifyConfigInTable,
} from "./patientIdentifierConfigHelper";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

const useOptions = ["usual", "official", "temp", "secondary", "old"];
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

  test.beforeEach(async ({ page }) => {
    use = faker.helpers.arrayElement(useOptions);
    displayName = faker.lorem.words(2);
    description = faker.lorem.sentence();
    systemUrl = faker.internet.url();
    regex = "^[A-Z0-9]+$";
    retrievalOption = faker.datatype.boolean();
    uniqueOption = faker.datatype.boolean();
    serialNumberMode = faker.helpers.arrayElement(serialNumberModes);

    const targetUrl = `/admin/patient_identifier_config`;
    await page.goto(targetUrl);
  });

  test("should create a Patient Identifier Config with all fields", async ({
    page,
  }) => {
    await createPatientIdentifierConfig(page, {
      use,
      displayName,
      description,
      systemUrl,
      status: "Active",
      regex,
      retrievalOption,
      uniqueOption,
      serialNumberMode: serialNumberMode as "User entered" | "Auto-generated",
    });

    await searchForConfig(page, displayName);

    await verifyConfigInTable(page, {
      displayName,
      systemUrl,
      use,
      status: "Active",
    });
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
    // Create a config first
    await createPatientIdentifierConfig(page, {
      use,
      displayName,
      description,
      systemUrl,
      status: "Active",
    });

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
    await page.getByRole("option", { name: "Active", exact: true }).click();

    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText(
        "A patient identifier config with this system already exists",
      ),
    ).toBeVisible();
  });

  test("should create a Patient Identifier Config with Draft status", async ({
    page,
  }) => {
    await createPatientIdentifierConfig(page, {
      use,
      displayName,
      description,
      systemUrl,
      status: "Draft",
    });

    await setStatusFilter(page, "Draft");
    await searchForConfig(page, displayName);

    await verifyConfigInTable(page, {
      displayName,
      systemUrl,
      use,
      status: "Draft",
    });
  });

  test("should create a Patient Identifier Config with Inactive status", async ({
    page,
  }) => {
    await createPatientIdentifierConfig(page, {
      use,
      displayName,
      description,
      systemUrl,
      status: "Inactive",
    });

    await setStatusFilter(page, "Inactive");
    await searchForConfig(page, displayName);

    await verifyConfigInTable(page, {
      displayName,
      systemUrl,
      use,
      status: "Inactive",
    });
  });
});
