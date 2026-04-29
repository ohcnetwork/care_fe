import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { closeAnyOpenPopovers, expectToast } from "tests/helper/ui";
import { expectedSlug } from "tests/helper/utils";
import {
  LOINC_CODE_NAME,
  MAX_SLUG_LENGTH,
  MIN_SLUG_LENGTH,
  SNOMED_CODE_NAME,
  STATUS_OPTIONS,
  SYSTEM_OPTIONS,
  UCUM_CODE_NAME,
  VALID_LOINC_CODES,
  VALID_SNOMED_CODES,
  VALID_UCUM_CODES,
} from "./valuesetConstants";

test.use({ storageState: "tests/.auth/user.json" });

let name: string;
let slug: string;
let status: string;
let description: string;
let code: string;
let system: string;
let codeName: string;

test.describe("ValueSet Create", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/valuesets");
    name = faker.commerce.productName();
    slug = expectedSlug(name);
    description = faker.lorem.sentence();
    status = faker.helpers.arrayElement(STATUS_OPTIONS);
    system = faker.helpers.arrayElement(SYSTEM_OPTIONS);
    switch (system) {
      case "SNOMED":
        code = faker.helpers.arrayElement(VALID_SNOMED_CODES);
        codeName = SNOMED_CODE_NAME[code];
        break;
      case "LOINC":
        code = faker.helpers.arrayElement(VALID_LOINC_CODES);
        codeName = LOINC_CODE_NAME[code];
        break;
      case "UCUM":
        code = faker.helpers.arrayElement(VALID_UCUM_CODES);
        codeName = UCUM_CODE_NAME[code];
        break;
    }
  });

  test("create valueset with all fields and verify it appears in preview and list", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Create ValueSet" }).click();

    // Input details for the ValueSet
    await page.getByRole("textbox", { name: "Name *" }).fill(name);
    await page.getByRole("textbox", { name: "Slug *" }).fill(slug);
    await page.getByRole("textbox", { name: "Description" }).fill(description);
    await page.getByRole("combobox", { name: "Status *" }).click();
    await page.getByRole("option", { name: status }).click();
    await page.getByRole("button", { name: "Add Rule" }).first().click();
    await page.getByRole("combobox", { name: "System" }).click();
    await page.getByRole("option", { name: system }).click();
    await page.getByRole("button", { name: "Add Concept" }).click();
    await page.getByRole("textbox", { name: "Code" }).fill(code);
    await page.getByLabel("Verify code").click();

    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: "Code verified successfully" }),
    ).toBeVisible();

    // Verify the code name is present in the display value
    const displayValue = await page
      .getByRole("textbox", { name: "Unverified" })
      .inputValue();
    expect(displayValue).toContain(codeName);

    await page.getByRole("button", { name: /valueset preview/i }).click();

    await expect(
      page.getByRole("dialog", {
        name: /valueset preview/i,
      }),
    ).toBeVisible();

    const previewDialog = page.getByRole("dialog", {
      name: /valueset preview/i,
    });

    await previewDialog.getByRole("combobox").click();

    await expect(page.getByText(codeName)).toBeVisible();

    // Close the preview valueset selector first and then the dialog
    await closeAnyOpenPopovers(page);
    await previewDialog.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "Save ValueSet" }).click();

    await expectToast(page, /valueset created successfully/i);

    // Filter by status to find the created ValueSet
    await page.getByRole("tab", { name: status }).click();

    await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);

    // Verify the created valueset appears in the list
    await expect(page.getByRole("cell", { name: name })).toBeVisible();
    await expect(page.getByRole("cell", { name: description })).toBeVisible();
    await expect(page.getByRole("cell", { name: status })).toBeVisible();
  });

  test("verify slug auto-generation from title", async ({ page }) => {
    await page.getByRole("link", { name: "Create ValueSet" }).click();
    await page.getByRole("textbox", { name: "Name *" }).fill(name);

    const slugField = page.getByRole("textbox", { name: "Slug *" });
    const slugValue = await slugField.inputValue();
    expect(slugValue).toBeTruthy();
    expect(slugValue.length).toBeGreaterThan(0);

    const expectedSlugValue = expectedSlug(name);

    expect(slugValue).toContain(expectedSlugValue);
  });

  test("verify excluded rules are not present in preview", async ({ page }) => {
    await page.getByRole("link", { name: "Create ValueSet" }).click();

    // Input details for the ValueSet
    await page.getByRole("textbox", { name: "Name *" }).fill(name);
    await page.getByRole("textbox", { name: "Slug *" }).fill(slug);
    await page.getByRole("button", { name: "Add Rule" }).nth(1).click();
    await page.getByRole("combobox", { name: "System" }).click();
    await page.getByRole("option", { name: system }).click();
    await page.getByRole("button", { name: "Add Concept" }).click();
    await page.getByRole("textbox", { name: "Code" }).fill(code);
    await page.getByLabel("Verify code").click();

    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: "Code verified successfully" }),
    ).toBeVisible();

    // Verify the code name is present in the display value
    const displayValue = await page
      .getByRole("textbox", { name: "Unverified" })
      .inputValue();
    expect(displayValue).toContain(codeName);

    await page.getByRole("button", { name: /valueset preview/i }).click();

    await expect(
      page.getByRole("dialog", {
        name: /valueset preview/i,
      }),
    ).toBeVisible();

    const previewDialog = page.getByRole("dialog", {
      name: /valueset preview/i,
    });

    await previewDialog.getByRole("combobox").click();

    await expect(page.getByText(codeName)).not.toBeVisible();

    // Close the preview valueset selector first and then the dialog
    await closeAnyOpenPopovers(page);
    await previewDialog.getByRole("button", { name: "Close" }).click();
  });

  test("verify slug validation of 5 - 25 character", async ({ page }) => {
    await page.getByRole("link", { name: "Create ValueSet" }).click();

    await page.getByRole("textbox", { name: "Name *" }).fill(name);

    const shortSlug = faker.string.alphanumeric(MIN_SLUG_LENGTH - 1);
    await page.getByRole("textbox", { name: "Slug *" }).fill(shortSlug);

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
