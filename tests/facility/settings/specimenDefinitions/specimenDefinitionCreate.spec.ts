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
import { expectToast } from "tests/helper/ui";
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
    await page
      .getByRole("combobox", { name: "Collection", exact: true })
      .click();
    await page.getByRole("option", { name: collectionOption }).click();

    const expectedQuantity = page.getByRole("combobox", {
      name: "Expected Quantity",
    });
    for (const invalidValue of [".", "1.999"]) {
      await expectedQuantity.fill("3");
      await expectedQuantity.fill(invalidValue);
      await expectedQuantity.press("Escape");
      await page.getByRole("button", { name: /save/i }).click();
      await expect(expectedQuantity).toHaveAttribute("aria-invalid", "true");
      await expect(expectedQuantity).toHaveAccessibleDescription(/quantity/i);
    }
    await expectedQuantity.fill("3.00");
    await page
      .getByRole("option", { name: "3.00 milliliter", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Collection Method", exact: true })
      .click();
    await page.getByRole("option", { name: "Aspiration - action" }).click();
    await page
      .getByRole("combobox", { name: "Body Site", exact: true })
      .click();
    await page
      .getByPlaceholder("Select Body Site")
      .fill("Distal phalanx of hallux");
    await page
      .getByRole("option", { name: /Distal phalanx of hallux/i })
      .first()
      .click();

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
      .getByPlaceholder("Enter Retention Time", { exact: true })
      .fill(retentionTime.toString());
    // Pick the unit to commit the quantity and close the suggestions.
    await page
      .getByRole("option", { name: `${retentionTime} hours`, exact: true })
      .click();

    const requirement = faker.lorem.sentence();
    await page.getByRole("textbox", { name: "Requirement" }).fill(requirement);

    const containerDescription = faker.lorem.sentence();
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill(containerDescription);

    const capOption = faker.helpers.arrayElement(capOptions);
    // Exact: the Capacity quantity input below is a combobox too.
    await page.getByRole("combobox", { name: "Cap", exact: true }).click();
    await page.getByRole("option", { name: capOption }).click();

    const capacity = faker.number.int(INT_MAX);
    await page
      .getByPlaceholder("Enter Capacity", { exact: true })
      .fill(capacity.toString());
    // Pick the unit to commit the quantity and close the suggestions.
    await page
      .getByRole("option", { name: `${capacity} milliliter`, exact: true })
      .click();

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
    await page.getByRole("button", { name: /^Status/ }).click();
    await page
      .getByRole("menuitemradio", { name: status.toLowerCase() })
      .click();

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
    await expect(page.getByText("3 milliliter", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Aspiration - action", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Distal phalanx of hallux", { exact: true }),
    ).toBeVisible();
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
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Capacity/ })
        .getByText(new RegExp(`\\b${capacity}\\.00\\b`)),
    ).toBeVisible();
    await expect(page.getByText(capOption)).toBeVisible();
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Minimum Volume/ })
        .getByText(new RegExp(`\\b${minimumVolume}(\\.00)?\\b`)),
    ).toBeVisible();
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
    await page.getByRole("button", { name: /^Status/ }).click();
    await page
      .getByRole("menuitemradio", { name: status.toLowerCase() })
      .click();

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

  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add Definition" }).click();

    const whitespace = "   ";
    const fields = ["Title *", "Description *"];

    for (const field of fields) {
      await page.getByRole("textbox", { name: field }).fill(whitespace);
    }

    await page.getByRole("button", { name: /save/i }).click();

    for (const field of fields) {
      const errorMessage = getFieldErrorMessage(
        page.getByRole("textbox", { name: field }),
      );
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveText("This field is required");
    }
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

  test("verify slug validation of 5 - 50 character", async ({ page }) => {
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
    await expect(errorMessage).toHaveText(/at least \d+.*at most 50/i);

    // Test: Slug too long (more than 50 characters)
    const longSlug = faker.string.alphanumeric(MAX_SLUG_LENGTH + 1);
    await page.getByRole("textbox", { name: "Slug *" }).fill(longSlug);

    // Try to submit
    await page.getByRole("button", { name: /save/i }).click();

    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/at least \d+.*at most 50/i);

    const validSlug = faker.string.alphanumeric(
      faker.number.int({ min: MIN_SLUG_LENGTH, max: MAX_SLUG_LENGTH }),
    );
    await page.getByRole("textbox", { name: "Slug *" }).fill(validSlug);
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page).not.toHaveURL(/\/new$/);
  });

  test("should reject a malformed Derived From URI and save once it is cleared", async ({
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

    const derivedFromURIField = page.getByRole("textbox", {
      name: "Derived From URI",
    });
    await derivedFromURIField.fill(faker.lorem.words(2));
    await page.getByRole("button", { name: /save/i }).click();
    await expect(getFieldErrorMessage(derivedFromURIField)).toHaveText(
      "Please enter a valid URL",
    );

    await derivedFromURIField.clear();
    await page.getByRole("button", { name: /save/i }).click();

    await expectToast(page, "Specimen definition created");
    await expect(page).not.toHaveURL(/\/new$/);
  });
});
