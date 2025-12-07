import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  DELETED_STATUS,
  STATUS_OPTIONS,
  typeCollectedOptions,
} from "tests/facility/settings/specimenDefinitions/specimenDefinitionConstants";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Specimen Definitions Delete", () => {
  let facilityId: string;
  // Faker data - generated fresh for each test
  let definitionTitle: string;
  let definitionDescription: string;
  let definitionSlug: string;
  let status: string;
  let typeCollected: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    definitionTitle = faker.company.name();
    definitionDescription = faker.lorem.sentence();
    const randomHex = faker.string
      .hexadecimal({ length: 5, prefix: "" })
      .toLowerCase();
    definitionSlug = `${faker.science.chemicalElement().symbol.toLowerCase()}-${randomHex}`;
    status = faker.helpers.arrayElement(STATUS_OPTIONS);
    typeCollected = faker.helpers.arrayElement(typeCollectedOptions);

    const targetUrl = `/facility/${facilityId}/settings/specimen_definitions`;
    await page.goto(targetUrl);
  });

  test("should be able to delete specimen definition", async ({ page }) => {
    await page.getByRole("button", { name: "Add Definition" }).click();

    await page.getByRole("textbox", { name: "Title *" }).fill(definitionTitle);
    await page.getByRole("textbox", { name: "Slug *" }).fill(definitionSlug);
    await page
      .getByRole("textbox", { name: "Description *" })
      .fill(definitionDescription);
    await page.getByRole("combobox", { name: "Status *" }).click();
    await page.getByRole("option", { name: status }).click();

    await page.getByRole("combobox", { name: "Type Collected *" }).click();
    await page.getByRole("option", { name: typeCollected }).click();

    await page.getByRole("button", { name: /save/i }).click();

    // Apply status filter before searching
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: status.toLowerCase() }).click();

    // Search for the newly created definition
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);

    await page.getByRole("link", { name: /view/i }).first().click();

    // Click Delete button
    await page.getByRole("button", { name: /delete/i }).click();

    // Confirm deletion in the dialog
    await page.getByRole("button", { name: /confirm/i }).click();

    // Wait for table to be loaded
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toBeVisible();

    // Filter by retired status
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: DELETED_STATUS }).click();

    // Wait for filter to apply
    await expect(page).toHaveURL(/status=retired/);

    // Search for the deleted definition
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);
    await page.getByRole("link", { name: /view/i }).first().click();

    // Verify the definition exists with retired status
    await expect(page.getByText(definitionTitle)).toBeVisible();
    await expect(page.getByText(DELETED_STATUS)).toBeVisible();
  });
});
