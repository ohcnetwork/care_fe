import { expect, type Page } from "@playwright/test";

export interface PatientIdentifierConfigOptions {
  use: string;
  displayName: string;
  description: string;
  systemUrl: string;
  status: "Active" | "Draft" | "Inactive";
  regex?: string;
  retrievalOption?: boolean;
  uniqueOption?: boolean;
  serialNumberMode?: "User entered" | "Auto-generated";
}

/**
 * Creates a patient identifier config through the UI.
 * Opens the add dialog, fills in the form, and submits it.
 * Waits for the sheet to close after successful creation.
 *
 * @param page - Playwright Page object
 * @param options - Configuration options for the patient identifier
 *
 * @example
 * await createPatientIdentifierConfig(page, {
 *   use: "usual",
 *   displayName: "Test Config",
 *   description: "Test Description",
 *   systemUrl: "https://example.com",
 *   status: "Active",
 * });
 */
export async function createPatientIdentifierConfig(
  page: Page,
  options: PatientIdentifierConfigOptions,
) {
  const {
    use,
    displayName,
    description,
    systemUrl,
    status,
    regex,
    retrievalOption,
    uniqueOption,
    serialNumberMode,
  } = options;

  // Open the add dialog
  await page
    .getByRole("button", { name: "Add patient identifier config" })
    .click();

  // Select use
  await page.getByRole("combobox").filter({ hasText: "usual" }).click();
  await page.getByRole("option", { name: use }).click();

  // Fill in basic fields
  await page.getByRole("textbox", { name: "Display" }).fill(displayName);
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  await page.getByRole("textbox", { name: "System" }).fill(systemUrl);

  // Fill in optional regex field
  if (regex) {
    await page.getByRole("textbox", { name: "Regex" }).fill(regex);
  }

  // Handle retrieval option
  if (retrievalOption) {
    await page
      .getByRole("switch", { name: "Retrieve with year of birth" })
      .click();
  }

  // Handle unique option
  if (uniqueOption) {
    await page.getByRole("switch", { name: "Unique" }).click();
  }

  // Handle serial number mode
  if (serialNumberMode === "Auto-generated") {
    await page.getByRole("radio", { name: "Auto-generated" }).click();
  }

  // Select status
  await page.getByRole("combobox").filter({ hasText: "Draft" }).click();
  await page.getByRole("option", { name: status, exact: true }).click();

  // Submit the form
  await page.getByRole("button", { name: "Create" }).click();

  // Wait for the sheet to close after successful creation
  await expect(
    page.getByRole("heading", { name: "Add patient identifier config" }),
  ).not.toBeVisible({ timeout: 10000 });
}

/**
 * Changes the status filter dropdown to show configs with the specified status.
 *
 * @param page - Playwright Page object
 * @param status - The status to filter by
 *
 * @example
 * await setStatusFilter(page, "Draft");
 */
export async function setStatusFilter(
  page: Page,
  status: "Active" | "Draft" | "Inactive",
) {
  const statusFilter = page.getByRole("combobox", { name: "Status" });
  await statusFilter.click();
  await page.getByRole("option", { name: status }).click();
}

/**
 * Searches for a patient identifier config by display name.
 *
 * @param page - Playwright Page object
 * @param displayName - The display name to search for
 *
 * @example
 * await searchForConfig(page, "Test Config");
 */
export async function searchForConfig(page: Page, displayName: string) {
  await page.getByRole("textbox", { name: "Search configs" }).fill(displayName);
}

/**
 * Verifies that a config appears in the table with expected values.
 *
 * @param page - Playwright Page object
 * @param expectedValues - Object containing values to verify
 *
 * @example
 * await verifyConfigInTable(page, {
 *   displayName: "Test Config",
 *   systemUrl: "https://example.com",
 *   use: "usual",
 *   status: "Active",
 * });
 */
export async function verifyConfigInTable(
  page: Page,
  expectedValues: {
    displayName: string;
    systemUrl: string;
    use: string;
    status: string;
  },
) {
  const tableBody = page.locator('[data-slot="table-body"]');

  await expect(tableBody).toContainText(expectedValues.displayName);
  await expect(tableBody).toContainText(expectedValues.systemUrl);
  await expect(tableBody).toContainText(expectedValues.use);
  await expect(tableBody).toContainText(expectedValues.status);
}
