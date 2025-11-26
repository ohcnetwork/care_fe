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

test.describe("Patient Identifier Config - Edit", () => {
  let use: string;
  let displayName: string;
  let description: string;
  let systemUrl: string;

  test.beforeEach(async ({ page }) => {
    use = faker.helpers.arrayElement(useOptions);
    displayName = faker.lorem.words(2);
    description = faker.lorem.sentence();
    systemUrl = faker.internet.url();

    const targetUrl = `/admin/patient_identifier_config`;
    await page.goto(targetUrl);
  });

  test("should edit a patient identifier config", async ({ page }) => {
    await createPatientIdentifierConfig(page, {
      use,
      displayName,
      description,
      systemUrl,
      status: "Active",
    });

    await searchForConfig(page, displayName);

    // Now edit the created config
    await page.getByRole("button", { name: "Edit" }).first().click();

    // Wait for the edit sheet to open
    await expect(
      page.getByRole("heading", { name: "Edit patient identifier config" }),
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Display" })
      .fill(`${displayName}-edited`);
    await page
      .getByRole("textbox", { name: "Description" })
      .fill(`${description}-edited`);
    await page.getByRole("button", { name: "Update" }).click();

    // Wait for the sheet to close after successful update
    await expect(
      page.getByRole("heading", { name: "Edit patient identifier config" }),
    ).not.toBeVisible({ timeout: 10000 });

    // Verify that the edited config appears in the list
    await searchForConfig(page, `${displayName}-edited`);

    await verifyConfigInTable(page, {
      displayName: `${displayName}-edited`,
      systemUrl,
      use,
      status: "Active",
    });
  });

  test("should edit status from Active to Draft", async ({ page }) => {
    await createPatientIdentifierConfig(page, {
      use,
      displayName,
      description,
      systemUrl,
      status: "Active",
    });

    await searchForConfig(page, displayName);

    // Now edit the created config to change status
    await page.getByRole("button", { name: "Edit" }).first().click();

    // Wait for the edit sheet to open
    await expect(
      page.getByRole("heading", { name: "Edit patient identifier config" }),
    ).toBeVisible();

    // Change status to Draft
    await page.getByRole("combobox").filter({ hasText: "Active" }).click();
    await page.getByRole("option", { name: "Draft", exact: true }).click();

    await page.getByRole("button", { name: "Update" }).click();

    // Wait for the sheet to close after successful update
    await expect(
      page.getByRole("heading", { name: "Edit patient identifier config" }),
    ).not.toBeVisible({ timeout: 10000 });

    // Change the status filter to Draft to see the config
    await setStatusFilter(page, "Draft");
    await searchForConfig(page, displayName);

    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(displayName);
    await expect(tableBody).toContainText("Draft");
  });

  test("should edit status from Active to Inactive", async ({ page }) => {
    await createPatientIdentifierConfig(page, {
      use,
      displayName,
      description,
      systemUrl,
      status: "Active",
    });

    await searchForConfig(page, displayName);

    // Now edit the created config to change status
    await page.getByRole("button", { name: "Edit" }).first().click();

    // Wait for the edit sheet to open
    await expect(
      page.getByRole("heading", { name: "Edit patient identifier config" }),
    ).toBeVisible();

    // Change status to Inactive
    await page.getByRole("combobox").filter({ hasText: "Active" }).click();
    await page.getByRole("option", { name: "Inactive", exact: true }).click();

    await page.getByRole("button", { name: "Update" }).click();

    // Wait for the sheet to close after successful update
    await expect(
      page.getByRole("heading", { name: "Edit patient identifier config" }),
    ).not.toBeVisible({ timeout: 10000 });

    // Change the status filter to Inactive to see the config
    await setStatusFilter(page, "Inactive");
    await searchForConfig(page, displayName);

    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(displayName);
    await expect(tableBody).toContainText("Inactive");
  });
});
