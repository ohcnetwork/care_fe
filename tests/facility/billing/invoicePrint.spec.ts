import { expect, test, type Page } from "@playwright/test";
import { selectFromDefinitionCategoryPicker } from "tests/helper/ui";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

// Regression gate for the consolidated invoice print pages (PrintInvoice /
// PrintInvoices sharing PrintableInvoice + InvoiceBillTo). Drives everything
// through the UI: adds billable charge items to the account, creates two
// invoices from them, then verifies the single- and multi-invoice print pages.

test.use({
  storageState: "tests/.auth/facilityAdmin.json",
  viewport: { width: 1440, height: 900 },
});

test.describe.configure({ mode: "serial" });

// Two distinct fixture charge item definitions (seeded under "Lab Tests").
const CHARGE_ITEM_CATEGORY = "Lab Tests";
const CHARGE_ITEM_TITLES = ["Urinalysis Test", "Lipid Panel Test"];

/**
 * Adds one billable charge item to the account using the Create Invoice
 * screen's inline charge-item picker (auto-opens when the invoice is empty),
 * then confirms the pending item (quantity defaults to 1).
 */
async function addChargeItem(
  page: Page,
  category: string,
  title: string,
): Promise<void> {
  const picker = page.getByRole("combobox").filter({ hasText: /add charges/i });
  await selectFromDefinitionCategoryPicker(page, picker, {
    navigateCategories: [category],
    search: title,
    itemIndex: 0,
  });

  // Selecting a definition stages a pending item; confirm it to apply.
  await page.getByRole("button", { name: /confirm/i }).click();
  await expect(page.getByText(title)).toBeVisible();
}

test.describe("Invoice print pages", () => {
  let facilityId: string;
  let accountId: string;
  let invoiceAId: string;
  let invoiceBId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  /** Reads the invoice id from the InvoiceShow URL landed on after creation. */
  function invoiceIdFromUrl(url: string): string {
    const match = url.match(/\/billing\/invoices\/([^/?#]+)/);
    if (!match) {
      throw new Error(`Could not parse invoice id from URL: ${url}`);
    }
    return match[1];
  }

  test("seeds charge items and creates two invoices", async ({ page }) => {
    const accountUrl = `/facility/${facilityId}/billing/account/${accountId}`;

    await test.step("Create invoice A with one charge item", async () => {
      await page.goto(accountUrl);
      await page.getByRole("button", { name: "Create Invoice" }).click();
      await expect(page).toHaveURL(/\/invoices\/create/);

      await addChargeItem(page, CHARGE_ITEM_CATEGORY, CHARGE_ITEM_TITLES[0]);

      // Ensure the newly added item is selected before submitting.
      const rowCheckbox = page.getByRole("checkbox").nth(1);
      if (!(await rowCheckbox.isChecked())) {
        await rowCheckbox.click();
      }

      await page.getByRole("button", { name: "Create Invoice" }).click();
      await expect(
        page.getByText("Invoice Created Successfully"),
      ).toBeVisible();
      await page.waitForURL(/\/billing\/invoices\/[^/]+$/);
      invoiceAId = invoiceIdFromUrl(page.url());
    });

    await test.step("Create invoice B with one charge item", async () => {
      await page.goto(accountUrl);
      await page.getByRole("button", { name: "Create Invoice" }).click();
      await expect(page).toHaveURL(/\/invoices\/create/);

      await addChargeItem(page, CHARGE_ITEM_CATEGORY, CHARGE_ITEM_TITLES[1]);

      const rowCheckbox = page.getByRole("checkbox").nth(1);
      if (!(await rowCheckbox.isChecked())) {
        await rowCheckbox.click();
      }

      await page.getByRole("button", { name: "Create Invoice" }).click();
      await expect(
        page.getByText("Invoice Created Successfully"),
      ).toBeVisible();
      await page.waitForURL(/\/billing\/invoices\/[^/]+$/);
      invoiceBId = invoiceIdFromUrl(page.url());
    });

    expect(invoiceAId).toBeTruthy();
    expect(invoiceBId).toBeTruthy();
    expect(invoiceAId).not.toBe(invoiceBId);
  });

  test("single-invoice print page renders invoice details", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/billing/invoice/${invoiceAId}/print`,
    );

    await expect(page.getByText("Bill To:")).toBeVisible();
    await expect(page.getByText("Issue Date")).toBeVisible();
    await expect(page.getByText("Net Amount")).toBeVisible();
    await expect(page.getByText("Created By:")).toBeVisible();

    // Exactly one invoice body is rendered.
    await expect(page.getByText("Issue Date")).toHaveCount(1);
  });

  test("multi-invoice print page renders both invoices", async ({ page }) => {
    // InvoiceShow builds the multi-print URL from the relatedInvoices param
    // when the Print button is clicked.
    await page.goto(
      `/facility/${facilityId}/billing/invoices/${invoiceBId}?relatedInvoices=${invoiceAId}`,
    );

    await page.getByRole("button", { name: "Print" }).click();

    await expect(page).toHaveURL(new RegExp(`/billing/invoices/[^/]+/print`));
    await expect(page).toHaveURL(new RegExp(invoiceAId));
    await expect(page).toHaveURL(new RegExp(invoiceBId));

    // Bill To is rendered once for the shared patient.
    await expect(page.getByText("Bill To:")).toHaveCount(1);
    // Two invoice bodies are rendered.
    await expect(page.getByText("Issue Date")).toHaveCount(2);
    await expect(page.getByText("Net Amount")).toHaveCount(2);
  });
});
