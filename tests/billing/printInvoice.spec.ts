import { expect, test, type Page } from "@playwright/test";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// Seeded charge item definitions under the "Lab Tests" category.
const CHARGE_ITEMS = ["Urinalysis Test", "Lipid Panel Test"];

/**
 * Adds a billable charge item to the account (via the Charge Items tab) and
 * creates an invoice from it. Returns the new invoice id.
 */
async function createInvoiceWithChargeItem(
  page: Page,
  facilityId: string,
  accountId: string,
  chargeItem: string,
) {
  await page.goto(
    `/facility/${facilityId}/billing/account/${accountId}/charge_items`,
  );

  // Opening the sheet auto-opens the charge-item definition picker.
  await page.getByRole("button", { name: "Add Charge Items" }).click();
  await page.getByRole("option", { name: /lab tests/i }).click();
  await page.getByRole("option", { name: chargeItem }).click();

  // Selecting a definition closes the picker; commit the selected item.
  await page.getByRole("button", { name: "Add Items" }).click();
  await expect(
    page.getByRole("cell", { name: chargeItem }).first(),
  ).toBeVisible();

  // Create an invoice from the billable charge item.
  await page.goto(
    `/facility/${facilityId}/billing/account/${accountId}/invoices/create`,
  );
  await page.getByRole("button", { name: "Create Invoice" }).click();
  await expect(page).toHaveURL(/\/billing\/invoices\/[a-f0-9-]+$/);

  const invoiceId = page.url().match(/\/billing\/invoices\/([a-f0-9-]+)$/)?.[1];
  expect(invoiceId).toBeTruthy();
  return invoiceId as string;
}

test.describe("Print Invoice", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  test("renders invoices on the single and multi-invoice print pages", async ({
    page,
  }) => {
    let invoiceId1 = "";
    let invoiceId2 = "";

    await test.step("Create two invoices from charge items", async () => {
      invoiceId1 = await createInvoiceWithChargeItem(
        page,
        facilityId,
        accountId,
        CHARGE_ITEMS[0],
      );
      invoiceId2 = await createInvoiceWithChargeItem(
        page,
        facilityId,
        accountId,
        CHARGE_ITEMS[1],
      );
      expect(invoiceId1).not.toBe("");
      expect(invoiceId2).not.toBe("");
      expect(invoiceId1).not.toBe(invoiceId2);
    });

    await test.step("Print the single-invoice view", async () => {
      // Currently on invoice 2's detail page; use its Print action.
      await page.getByRole("button", { name: /print/i }).first().click();
      await expect(page).toHaveURL(
        new RegExp(`/billing/invoice/${invoiceId2}/print`),
      );

      const printSection = page.locator("#section-to-print");
      await expect(printSection.getByText("Bill To:")).toBeVisible();
      await expect(printSection.getByText("Issue Date:")).toBeVisible();
      await expect(printSection.getByText("Net Amount")).toBeVisible();
      await expect(printSection.locator("svg").first()).toBeVisible();
    });

    await test.step("Print the multi-invoice view with both invoices", async () => {
      await page.goto(
        `/facility/${facilityId}/billing/invoices/${invoiceId1},${invoiceId2}/print`,
      );

      const printSection = page.locator("#section-to-print");
      // Bill To is shown once (both invoices share the same patient)...
      await expect(printSection.getByText("Bill To:")).toHaveCount(1);
      // ...and each invoice renders its own body.
      await expect(printSection.getByText("Issue Date:")).toHaveCount(2);
      await expect(printSection.getByText("Net Amount")).toHaveCount(2);
    });
  });
});
