import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  capOptions,
  collectionOptions,
  INT_MAX,
  MAX_SLUG_LENGTH,
  MIN_SLUG_LENGTH,
  preferenceOptions,
  preparationOptions,
  STATUS_OPTIONS,
  typeCollectedOptions,
} from "tests/facility/settings/specimenDefinitions/specimenDefinitionConstants";
import { getFieldErrorMessage } from "tests/helper/error";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Specimen Definitions Create", () => {
  let facilityId: string;

  // Faker data - generated fresh for each test
  let definitionTitle: string;
  let definitionDescription: string;
  let definitionSlug: string;
  let status: string;
  let typeCollected: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    definitionTitle = faker.science.chemicalElement().name;
    definitionDescription = faker.lorem.sentence();
    const randomHex = faker.string
      .hexadecimal({ length: MIN_SLUG_LENGTH, prefix: "" })
      .toLowerCase();
    definitionSlug = `${faker.science.chemicalElement().symbol.toLowerCase()}-${randomHex}`;
    status = faker.helpers.arrayElement(STATUS_OPTIONS);
    typeCollected = faker.helpers.arrayElement(typeCollectedOptions);

    const targetUrl = `/facility/${facilityId}/settings/specimen_definitions`;
    await page.goto(targetUrl);
  });

  test("should create specimen definition with all fields", async ({
    page,
  }) => {
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

    const derivedFromURI = faker.internet.url();
    await page
      .getByRole("textbox", { name: "Derived From URI" })
      .fill(derivedFromURI);

    const collectionOption = faker.helpers.arrayElement(collectionOptions);
    await page.getByRole("combobox", { name: "Collection" }).click();
    await page.getByRole("option", { name: collectionOption }).click();

    const preparationOption = faker.helpers.arrayElement(preparationOptions);
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("combobox", { name: "Patient Preparation" }).click();
    await page.getByRole("option", { name: preparationOption }).click();

    const isDerived = faker.datatype.boolean();
    if (isDerived) {
      await page.getByRole("switch", { name: "Is Derived" }).click();
    }

    const isSingleUse = faker.datatype.boolean();
    if (isSingleUse) {
      await page.getByRole("switch", { name: "Single Use" }).click();
    }

    await page.getByRole("combobox", { name: "Preference" }).click();
    const preferenceOption = faker.helpers.arrayElement(preferenceOptions);
    await page.getByRole("option", { name: preferenceOption }).click();

    const retentionTime = faker.number.int(INT_MAX);
    await page
      .getByRole("textbox", { name: "Enter Retention Time" })
      .fill(retentionTime.toString());

    const requirement = faker.lorem.sentence();
    await page.getByRole("textbox", { name: "Requirement" }).fill(requirement);

    const containerDescription = faker.lorem.sentence();
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill(containerDescription);

    const capOption = faker.helpers.arrayElement(capOptions);
    await page.getByRole("combobox", { name: "Cap" }).click();
    await page.getByRole("option", { name: capOption }).click();

    const capacity = faker.number.int(INT_MAX);
    await page
      .getByRole("textbox", { name: "Enter Capacity" })
      .fill(capacity.toString());

    const minimumVolume = faker.number.int(INT_MAX);
    await page
      .getByRole("textbox", { name: "Enter Minimum Volume" })
      .fill(minimumVolume.toString());

    const preparationDescription = faker.lorem.sentence();
    await page
      .getByRole("textbox", { name: "Preparation" })
      .fill(preparationDescription);

    // Submit form
    await page.getByRole("button", { name: /save/i }).click();

    // Apply status filter before searching
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: status.toLowerCase() }).click();

    // Search for the newly created definition
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);

    // Verify it appears in the list
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(definitionTitle);
    await expect(tableBody).toContainText(definitionDescription);
    await expect(tableBody).toContainText(status);

    // Navigate to View page to verify all details
    await page.getByRole("link", { name: /view/i }).first().click();

    // Verify all fields on detail page
    await expect(
      page.getByRole("heading", { name: definitionTitle }),
    ).toBeVisible();
    await expect(page.getByText(definitionDescription)).toBeVisible();
    await expect(page.getByText(status)).toBeVisible();
    await expect(page.getByText(derivedFromURI)).toBeVisible();
    await expect(page.getByText(typeCollected)).toBeVisible();
    await expect(page.getByText(collectionOption)).toBeVisible();
    await expect(page.getByText(preparationOption)).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Is Derived${isDerived ? "Yes" : "No"}`, "i")),
    ).toBeVisible();
    await expect(
      page.getByText(
        new RegExp(`Single Use${isSingleUse ? "Yes" : "No"}`, "i"),
      ),
    ).toBeVisible();
    await expect(page.getByText(requirement)).toBeVisible();
    await expect(
      page.getByText(new RegExp(`${retentionTime.toFixed(2)}\\s+(hours|days)`)),
    ).toBeVisible();
    await expect(page.getByText(containerDescription)).toBeVisible();
    await expect(page.getByText(preparationDescription)).toBeVisible();
    await expect(page.getByText(capacity.toFixed(2))).toBeVisible();
    await expect(page.getByText(capOption)).toBeVisible();
    await expect(page.getByText(minimumVolume.toString())).toBeVisible();
  });

  test("should create specimen definition with all required fields", async ({
    page,
  }) => {
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

    // Verify it appears in the list
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(definitionTitle);
    await expect(tableBody).toContainText(definitionDescription);
    await expect(tableBody).toContainText(status);

    // Navigate to View page to verify all details
    await page.getByRole("link", { name: /view/i }).first().click();

    // Verify all fields on detail page
    await expect(
      page.getByRole("heading", { name: definitionTitle }),
    ).toBeVisible();
    await expect(page.getByText(definitionDescription)).toBeVisible();
    await expect(page.getByText(status)).toBeVisible();
    await expect(page.getByText(typeCollected)).toBeVisible();
  });

  test("should show validation errors when trying to save without required fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add Definition" }).click();

    // Click save without filling any required fields
    await page.getByRole("button", { name: /save/i }).click();

    await expect(
      getFieldErrorMessage(page.getByRole("textbox", { name: "Title *" })),
    ).toBeVisible();

    await expect(
      getFieldErrorMessage(page.getByRole("textbox", { name: "Slug *" })),
    ).toBeVisible();

    await expect(
      getFieldErrorMessage(
        page.getByRole("textbox", { name: "Description *" }),
      ),
    ).toBeVisible();

    await expect(
      getFieldErrorMessage(
        page.getByRole("combobox", { name: "Type Collected *" }),
      ),
    ).toBeVisible();
  });

  test("should auto-populate slug from title", async ({ page }) => {
    await page.getByRole("button", { name: "Add Definition" }).click();

    await page.getByRole("textbox", { name: "Title *" }).fill(definitionTitle);
    await page.getByRole("textbox", { name: "Title *" }).blur();

    const slugField = page.getByRole("textbox", { name: "Slug *" });
    const slugValue = await slugField.inputValue();
    expect(slugValue).toBeTruthy();
    expect(slugValue.length).toBeGreaterThan(0);

    const expectedSlugPattern = definitionTitle
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    expect(slugValue).toContain(expectedSlugPattern);
  });

  test("verify slug validation of 5 - 25 character", async ({ page }) => {
    await page.getByRole("button", { name: "Add Definition" }).click();

    await page.getByRole("textbox", { name: "Title *" }).fill(definitionTitle);
    await page
      .getByRole("textbox", { name: "Description *" })
      .fill(definitionDescription);
    await page.getByRole("combobox", { name: "Type Collected *" }).click();
    await page.getByRole("option", { name: typeCollected }).click();

    const shortSlug = faker.string.alphanumeric(MIN_SLUG_LENGTH - 1);
    await page.getByRole("textbox", { name: "Slug *" }).fill(shortSlug);

    await page.getByRole("combobox", { name: "Status *" }).click();
    await page.getByRole("option", { name: status }).click();

    // Try to submit
    await page.getByRole("button", { name: /save/i }).click();
    const errorMessage = getFieldErrorMessage(
      page.getByRole("textbox", { name: "Slug *" }),
    );
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/atleast \d+.*atmost 25/i);

    // Test: Slug too long (more than 25 characters)
    const longSlug = faker.string.alphanumeric(MAX_SLUG_LENGTH + 1);
    await page.getByRole("textbox", { name: "Slug *" }).fill(longSlug);

    // Try to submit
    await page.getByRole("button", { name: /save/i }).click();

    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/atleast \d+.*atmost 25/i);

    const validSlug = faker.string.alphanumeric(
      faker.number.int({ min: MIN_SLUG_LENGTH, max: MAX_SLUG_LENGTH }),
    );
    await page.getByRole("textbox", { name: "Slug *" }).fill(validSlug);
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page).not.toHaveURL(/\/new$/);
  });
});
