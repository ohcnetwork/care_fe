import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

const SNOMED_CODES = [
  "73211009", // Diabetes mellitus
  "44054006",
  "90725009",
  "46635009",
  "195967001",
];

const LOINC_CODES = ["1558-6", "2339-0", "718-7", "5792-7", "8310-5"];

const UCUM_CODES = ["mg", "kg", "cm", "mm[Hg]", "mm"];

test.describe("ValueSet Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home
    await page.goto("/");

    // Go to Admin Dashboard
    const adminDashboardLink = page.getByRole("link", {
      name: /admin dashboard/i,
    });
    await expect(adminDashboardLink).toBeVisible();
    await adminDashboardLink.click();

    // Wait for Admin Dashboard to be visible
    await expect(
      page.getByRole("heading", { name: /admin dashboard/i }),
    ).toBeVisible();

    // Navigate to ValueSets page
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await page.getByRole("link", { name: /valuesets/i }).click();

    // Wait for ValueSets list heading
    await expect(
      page.getByRole("heading", { name: /valuesets/i }),
    ).toBeVisible();

    // Start creating new ValueSet via list "Create ValueSet" link
    await page.getByRole("link", { name: /create valueset/i }).click();

    // Wait for creation form to be ready
    await expect(page.getByRole("textbox", { name: /name/i })).toBeVisible();
  });

  test("should create a ValueSet with just required fields (SNOMED concept) and verify preview & display", async ({
    page,
  }) => {
    const id = faker.string.uuid();
    const uniqueName = `Required Fields ValueSet ${id}`;
    const uniqueSlug = `required-fields-${id}`;

    // Fill required fields
    await page.getByRole("textbox", { name: /name/i }).fill(uniqueName);
    await page.getByRole("textbox", { name: /slug/i }).fill(uniqueSlug);

    // --- Include Rules card must be visible before adding rule ---
    const includeHeading = page.getByRole("heading", {
      name: /include rules/i,
    });
    await expect(includeHeading).toBeVisible();

    // Add at least one include rule (required)
    await page
      .getByRole("button", { name: /add rule/i })
      .first()
      .click();

    // Select SNOMED CT system
    await page.getByRole("button", { name: /system/i }).first().click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    // Add a concept
    await page
      .getByRole("button", { name: /add concept/i })
      .first()
      .click();

    const conceptCode = SNOMED_CODES[0]; // 73211009
    const codeInput = page.getByPlaceholder(/code/i).first();
    await codeInput.fill(conceptCode);

    // Initially display field should be empty/unverified
    const displayInput = page.getByPlaceholder(/unverified/i).first();
    await expect(displayInput).toHaveValue("");

    // Click verify button for this coding field and ensure display auto-fills
    // (desktop verify button is visible on default Playwright viewport)
    const codingRow = codeInput.locator("xpath=ancestor::div[contains(@class,'flex')][1]");
    const verifyButton = codingRow
      .getByRole("button")
      .nth(0); // first button within this row is the verify button
    await verifyButton.click();

    await expect(displayInput).not.toHaveValue("");
    // You can make this stricter if you know expected text, e.g. /diabetes/i

    // Set status
    await page.getByRole("button", { name: /status/i }).click();
    await page.getByRole("option", { name: /active/i }).click();

    // Open ValueSet preview and verify the code is visible there
    await page.getByRole("button", { name: /valueset preview/i }).click();

    const previewSheet = page.getByRole("dialog", {
      name: /valueset preview/i,
    });
    await expect(previewSheet).toBeVisible();

    const previewSearch = previewSheet.getByPlaceholder(/search concept/i);
    await previewSearch.fill(conceptCode);

    await expect(previewSheet.getByText(conceptCode)).toBeVisible();

    // Close preview sheet
    await previewSheet
      .getByRole("button", { name: /close/i })
      .click();

    // Save the ValueSet
    await page.getByRole("button", { name: /save valueset/i }).click();

    // Verify success toast
    await expect(page.getByText(/valueset_created/i)).toBeVisible({
      timeout: 10000,
    });

    // We should be back on the list page
    await expect(
      page.getByRole("heading", { name: /valuesets/i }),
    ).toBeVisible();

    // Search by ValueSet name
    await page
      .getByPlaceholder(/search valuesets/i)
      .fill(uniqueName);

    // Verify our ValueSet is visible in the table
    await expect(
      page.getByRole("cell", { name: uniqueName }),
    ).toBeVisible();
  });

  test("should create a ValueSet with all fields (LOINC concepts) and verify draft list entry", async ({
    page,
  }) => {
    const id = faker.string.uuid();
    const uniqueName = `All Fields ValueSet ${id}`;
    const uniqueSlug = `all-fields-${id}`;
    const description = `Filter-based LOINC ValueSet for testing – ${id}`;

    // Fill all basic fields
    await page.getByRole("textbox", { name: /name/i }).fill(uniqueName);
    await page.getByRole("textbox", { name: /slug/i }).fill(uniqueSlug);
    await page.getByRole("textbox", { name: /description/i }).fill(description);

    // Set status to Draft
    await page.getByRole("button", { name: /status/i }).click();
    await page.getByRole("option", { name: /draft/i }).click();

    // Include rule for LOINC
    await page
      .getByRole("button", { name: /add rule/i })
      .first()
      .click();
    await page.getByRole("button", { name: /system/i }).first().click();
    await page.getByRole("option", { name: "LOINC" }).click();

    // Add two concepts
    await page
      .getByRole("button", { name: /add concept/i })
      .first()
      .click();
    await page.getByPlaceholder(/code/i).first().fill(LOINC_CODES[0]);

    await page
      .getByRole("button", { name: /add concept/i })
      .first()
      .click();
    await page.getByPlaceholder(/code/i).nth(1).fill(LOINC_CODES[1]);

    // Save
    await page.getByRole("button", { name: /save valueset/i }).click();

    // Verify success toast
    await expect(page.getByText(/valueset_created/i)).toBeVisible({
      timeout: 10000,
    });

    // Ensure we're on list page
    await expect(
      page.getByRole("heading", { name: /valuesets/i }),
    ).toBeVisible();

    // Switch to Draft tab
    await page.getByRole("tab", { name: /draft/i }).click();

    // Search by name
    await page
      .getByPlaceholder(/search valuesets/i)
      .fill(uniqueName);

    const row = page.getByRole("row", { name: new RegExp(uniqueName) });
    await expect(row).toBeVisible();

    // Verify slug cell
    await expect(
      row.getByRole("cell", { name: uniqueSlug }),
    ).toBeVisible();

    // Verify status badge shows Draft
    await expect(row.getByText(/draft/i)).toBeVisible();
  });

  test("should create UCUM concept-only ValueSet and verify preview search", async ({
    page,
  }) => {
    const id = faker.string.uuid();
    const uniqueName = `UCUM Concept ValueSet ${id}`;
    const uniqueSlug = `ucum-concept-${id}`;

    await page.getByRole("textbox", { name: /name/i }).fill(uniqueName);
    await page.getByRole("textbox", { name: /slug/i }).fill(uniqueSlug);

    // Include rule for UCUM
    await page
      .getByRole("button", { name: /add rule/i })
      .first()
      .click();
    await page.getByRole("button", { name: /system/i }).first().click();
    await page.getByRole("option", { name: "UCUM" }).click();

    // Add concept
    await page
      .getByRole("button", { name: /add concept/i })
      .first()
      .click();
    const ucumCode = UCUM_CODES[0]; // e.g. "mg"
    await page.getByPlaceholder(/code/i).first().fill(ucumCode);

    // Status Active
    await page.getByRole("button", { name: /status/i }).click();
    await page.getByRole("option", { name: /active/i }).click();

    // Preview & search using a faker array of static UCUM codes
    await page.getByRole("button", { name: /valueset preview/i }).click();

    const previewSheet = page.getByRole("dialog", {
      name: /valueset preview/i,
    });
    await expect(previewSheet).toBeVisible();

    const codesToTest = faker.helpers.arrayElements(UCUM_CODES, 5);
    const previewSearch = previewSheet.getByPlaceholder(/search concept/i);

    for (const code of codesToTest) {
      await previewSearch.fill(code);
      await expect(previewSheet.getByText(code)).toBeVisible();
    }

    await previewSheet
      .getByRole("button", { name: /close/i })
      .click();

    // Save
    await page.getByRole("button", { name: /save valueset/i }).click();

    await expect(page.getByText(/valueset_created/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should create ValueSet with SNOMED filters and verify preview search", async ({
    page,
  }) => {
    const id = faker.string.uuid();
    const uniqueName = `SNOMED Filter ValueSet ${id}`;
    const uniqueSlug = `snomed-filter-${id}`;
    const description = `Filter-based SNOMED ValueSet for testing – ${id}`;

    await page.getByRole("textbox", { name: /name/i }).fill(uniqueName);
    await page.getByRole("textbox", { name: /slug/i }).fill(uniqueSlug);
    await page.getByRole("textbox", { name: /description/i }).fill(description);

    // Include rule - SNOMED
    await page
      .getByRole("button", { name: /add rule/i })
      .first()
      .click();
    await page.getByRole("button", { name: /system/i }).first().click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    // Add filter
    await page
      .getByRole("button", { name: /add filter/i })
      .first()
      .click();

    await page.getByPlaceholder(/property/i).first().fill("concept");
    await page.getByPlaceholder(/operator/i).first().fill("equals");
    await page.getByPlaceholder(/value/i).first().fill("disorder");

    await page.getByRole("button", { name: /status/i }).click();
    await page.getByRole("option", { name: /active/i }).click();

    // Preview & search using faker array of SNOMED codes
    await page.getByRole("button", { name: /valueset preview/i }).click();

    const previewSheet = page.getByRole("dialog", {
      name: /valueset preview/i,
    });
    await expect(previewSheet).toBeVisible();

    const codesToTest = faker.helpers.arrayElements(SNOMED_CODES, 5);
    const previewSearch = previewSheet.getByPlaceholder(/search concept/i);

    for (const code of codesToTest) {
      await previewSearch.fill(code);
      await expect(previewSheet.getByText(code)).toBeVisible();
    }

    await previewSheet
      .getByRole("button", { name: /close/i })
      .click();

    // Save & verify list
    await page.getByRole("button", { name: /save valueset/i }).click();

    await expect(page.getByText(/valueset_created/i)).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByRole("heading", { name: /valuesets/i }),
    ).toBeVisible();

    await page
      .getByPlaceholder(/search valuesets/i)
      .fill(uniqueName);

    await expect(
      page.getByRole("cell", { name: uniqueName }),
    ).toBeVisible();
  });

  test("should create ValueSet with include and exclude SNOMED rules and verify preview", async ({
    page,
  }) => {
    const id = faker.string.uuid();
    const uniqueName = `SNOMED Include/Exclude ValueSet ${id}`;
    const uniqueSlug = `snomed-include-exclude-${id}`;

    await page.getByRole("textbox", { name: /name/i }).fill(uniqueName);
    await page.getByRole("textbox", { name: /slug/i }).fill(uniqueSlug);

    // INCLUDE RULE
    await page
      .getByRole("button", { name: /add rule/i })
      .first()
      .click();
    await page.getByRole("button", { name: /system/i }).first().click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    await page
      .getByRole("button", { name: /add concept/i })
      .first()
      .click();
    await page.getByPlaceholder(/code/i).first().fill(SNOMED_CODES[0]);

    // EXCLUDE RULE (second rule block - SNOMED)
    await page
      .getByRole("button", { name: /add rule/i })
      .nth(1)
      .click();
    await page.getByRole("button", { name: /system/i }).nth(1).click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    await page
      .getByRole("button", { name: /add concept/i })
      .nth(1)
      .click();
    await page.getByPlaceholder(/code/i).nth(1).fill(SNOMED_CODES[3]);

    await page.getByRole("button", { name: /status/i }).click();
    await page.getByRole("option", { name: /active/i }).click();

    // Preview
    await page.getByRole("button", { name: /valueset preview/i }).click();
    const previewSheet = page.getByRole("dialog", {
      name: /valueset preview/i,
    });
    await expect(previewSheet).toBeVisible();

    await previewSheet
      .getByPlaceholder(/search concept/i)
      .fill(SNOMED_CODES[0]);
    await expect(previewSheet.getByText(SNOMED_CODES[0])).toBeVisible();

    await previewSheet
      .getByPlaceholder(/search concept/i)
      .fill(SNOMED_CODES[3]);
    await expect(previewSheet.getByText(SNOMED_CODES[3])).toBeVisible();

    await previewSheet
      .getByRole("button", { name: /close/i })
      .click();

    await page.getByRole("button", { name: /save valueset/i }).click();

    await expect(page.getByText(/valueset_created/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should validate required fields", async ({ page }) => {
    // Try to save without required fields
    await page.getByRole("button", { name: /save valueset/i }).click();

    // Verify validation errors
    // TODO: when include-rule validation is enforced, extend this test to cover it as well.
    await expect(page.getByText(/field_required/i)).toBeVisible();

    // Fill only name
    const name = faker.person.fullName();
    await page.getByRole("textbox", { name: /name/i }).fill(name);
    await page.getByRole("button", { name: /save valueset/i }).click();

    // Should still show slug error
    // TODO: add include-rule validation here in the future if needed.
    await expect(page.getByText(/character_count_validation/i)).toBeVisible();
  });

  test("should handle cancel operation correctly", async ({ page }) => {
    const id = faker.string.uuid();
    const testName = `Cancel Test ValueSet ${id}`;
    const testSlug = `cancel-test-${id}`;

    await page.getByRole("textbox", { name: /name/i }).fill(testName);
    await page.getByRole("textbox", { name: /slug/i }).fill(testSlug);

    // Click cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Verify navigation back to ValueSets list
    await expect(
      page.getByRole("heading", { name: /valuesets/i }),
    ).toBeVisible();

    // Verify data was not saved by checking the list
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByPlaceholder(/search valuesets/i).fill(testName);

    await expect(
      page.getByRole("cell", { name: testName }),
    ).toHaveCount(0);
  });
});
