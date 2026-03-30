import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

import en from "@/public/locale/en.json";

test.use({ storageState: "tests/.auth/user.json" });

const NO_MATCH_TERM = "ZZZNODATA_XYZ_12345";

// ── Shared setup ────────────────────────────────────────────────────────────

let facilityId: string;

test.beforeAll(async () => {
  facilityId = getFacilityId();
});

// ── Search / Filter helper ──────────────────────────────────────────────────
// Generates 4 tests for any read-only table page with a search input.

function searchFilterSuite(
  label: string,
  route: string,
  placeholder: string,
  emptyStateText: string,
) {
  test.describe(`Billing Settings - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/facility/${facilityId}${route}`);
      // Wait for the search input to appear — proves auth + facility data loaded
      await page
        .getByPlaceholder(placeholder)
        .waitFor({ state: "visible", timeout: 60000 });
    });

    test("shows table with rows on navigation", async ({ page }) => {
      await expect(page.getByRole("table")).toBeVisible();
      // nth(1) is the first data row (nth(0) is the header row)
      await expect(
        page.getByRole("table").getByRole("row").nth(1),
      ).toBeVisible();
    });

    test("matching search shows relevant rows", async ({ page }) => {
      // Read the first data-row's first cell at runtime to avoid hardcoding
      const firstDataRow = page.getByRole("table").getByRole("row").nth(1);
      const cellText =
        (await firstDataRow.getByRole("cell").first().textContent()) ?? "";
      const searchTerm = cellText.trim().slice(0, 4);
      if (!searchTerm) {
        throw new Error(
          `Could not read cell text to derive a search term on route ${route}`,
        );
      }

      await page.getByPlaceholder(placeholder).fill(searchTerm);

      await expect(firstDataRow).toBeVisible();
      await expect(
        page.getByText(emptyStateText, { exact: true }),
      ).not.toBeVisible();
    });

    test("non-matching search shows empty state", async ({ page }) => {
      await page.getByPlaceholder(placeholder).fill(NO_MATCH_TERM);

      await expect(
        page.getByText(emptyStateText, { exact: true }),
      ).toBeVisible();
    });

    test("clearing search restores all rows", async ({ page }) => {
      const searchInput = page.getByPlaceholder(placeholder);
      await searchInput.fill(NO_MATCH_TERM);
      await expect(
        page.getByText(emptyStateText, { exact: true }),
      ).toBeVisible();

      await searchInput.clear();

      await expect(
        page.getByRole("table").getByRole("row").nth(1),
      ).toBeVisible();
      await expect(
        page.getByText(emptyStateText, { exact: true }),
      ).not.toBeVisible();
    });
  });
}

searchFilterSuite(
  "Tax Codes",
  "/settings/billing/tax_codes",
  en.search_tax_codes,
  en.no_matching_tax_codes,
);

searchFilterSuite(
  "Tax Components",
  "/settings/billing/tax_components",
  en.search_tax_components,
  en.no_matching_tax_components,
);

searchFilterSuite(
  "Informational Codes",
  "/settings/billing/informational_codes",
  en.search_informational_codes,
  en.no_matching_informational_codes,
);

// ── Edit / Save Pages ───────────────────────────────────────────────────────

test.describe("Billing Settings - Discount Configuration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_configuration`,
    );
    // Wait for the Edit button to appear — proves auth + facility data loaded
    await page
      .getByRole("button", { name: en.edit })
      .waitFor({ state: "visible", timeout: 60000 });
  });

  test("shows current values in read-only view on navigation", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: en.edit })).toBeVisible();
    await expect(
      page.getByText(en.max_applicable_discounts, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(en.applicability_order, { exact: true }),
    ).toBeVisible();
  });

  test("clicking Edit shows pre-filled input fields", async ({ page }) => {
    await page.getByRole("button", { name: en.edit }).click();

    const maxInput = page.getByLabel(en.max_applicable_discounts);
    await expect(maxInput).toBeVisible();

    // Value must be a whole number pre-filled from current config
    await expect(maxInput).toHaveValue(/^\d+$/);

    await expect(page.getByLabel(en.applicability_order)).toBeVisible();
    await expect(page.getByRole("button", { name: en.save })).toBeVisible();
    await expect(page.getByRole("button", { name: en.cancel })).toBeVisible();
  });

  test("modifying values and saving shows success toast", async ({ page }) => {
    await page.getByRole("button", { name: en.edit }).click();

    const maxInput = page.getByLabel(en.max_applicable_discounts);
    const newValue = String(faker.number.int({ min: 1, max: 10 }));
    await maxInput.fill(newValue);

    await page.getByRole("button", { name: en.save }).click();

    await expect(
      page.getByText(en.discount_configuration_saved, { exact: true }),
    ).toBeVisible({ timeout: 5000 });
    // Read-only view restored
    await expect(page.getByRole("button", { name: en.edit })).toBeVisible();
  });

  test("cancelling edit restores original values", async ({ page }) => {
    await page.getByRole("button", { name: en.edit }).click();

    const maxInput = page.getByLabel(en.max_applicable_discounts);
    await maxInput.fill("999");

    await page.getByRole("button", { name: en.cancel }).click();

    // Edit form must be gone — edit button back, inputs hidden
    await expect(page.getByRole("button", { name: en.edit })).toBeVisible();
    await expect(maxInput).not.toBeVisible();
  });
});

test.describe("Billing Settings - Invoice Number Expression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/facility/${facilityId}/settings/billing/settings`);
    // Wait for the Edit button to appear — proves auth + facility data loaded
    await page
      .getByRole("button", { name: en.edit })
      .waitFor({ state: "visible", timeout: 60000 });
  });

  test("shows current expression in read-only view on navigation", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: en.edit })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: en.invoice_number_expression }).first(),
    ).toBeVisible();
  });

  test("clicking Edit shows pre-filled input field", async ({ page }) => {
    await page.getByRole("button", { name: en.edit }).click();

    const input = page.getByRole("textbox", {
      name: en.invoice_number_expression,
    });
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    await expect(page.getByRole("button", { name: en.save })).toBeVisible();
    await expect(page.getByRole("button", { name: en.cancel })).toBeVisible();
  });

  test("modifying expression and saving shows success message", async ({
    page,
  }) => {
    await page.getByRole("button", { name: en.edit }).click();

    const input = page.getByRole("textbox", {
      name: en.invoice_number_expression,
    });
    // Use the exact documented expression format (f-string with supported variables)
    const counter = faker.number.int({ min: 1000, max: 9999 });
    const newExpression = `f'#INV-{invoice_count + ${counter}}-{current_year_yy}'`;
    await input.fill(newExpression);

    await page.getByRole("button", { name: en.save }).click();

    await expect(
      page.getByText(en.saved_successfully, { exact: true }),
    ).toBeVisible();
    // Read-only view must reflect the saved expression
    await expect(page.getByText(newExpression, { exact: true })).toBeVisible();
  });

  test("cancelling edit restores original expression", async ({ page }) => {
    await page.getByRole("button", { name: en.edit }).click();

    const input = page.getByRole("textbox", {
      name: en.invoice_number_expression,
    });
    await input.fill("TEMP_EXPR_XYZ");

    await page.getByRole("button", { name: en.cancel }).click();

    // Edit form must be gone — edit button back, input hidden
    await expect(page.getByRole("button", { name: en.edit })).toBeVisible();
    await expect(input).not.toBeVisible();
    // Unsaved value must not appear anywhere on the page
    await expect(page.getByText("TEMP_EXPR_XYZ")).not.toBeVisible();
  });
});
