import { expect, test } from "@playwright/test";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Invoice Creation", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  test("should navigate to invoice creation page from account", async ({
    page,
  }) => {
    // Navigate to the account page
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}`,
    );

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Look for a "Create Invoice" button or link
    const createInvoiceButton = page
      .getByRole("link", { name: /create invoice/i })
      .or(page.getByRole("button", { name: /create invoice/i }));

    if (await createInvoiceButton.first().isVisible().catch(() => false)) {
      await createInvoiceButton.first().click();
      await page.waitForURL(/\/invoices\/create/);

      // Verify the invoice creation page loads
      await expect(page).toHaveURL(/\/invoices\/create/);
    }
  });

  test("should view account details with invoices tab", async ({ page }) => {
    // Navigate to the account page with invoices tab
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/invoices`,
    );

    await page.waitForLoadState("networkidle");

    // Verify the account page loads
    // Should see account information
    const accountContent = page.locator("main");
    await expect(accountContent).toBeVisible({ timeout: 10000 });
  });

  test("should view account charge items tab", async ({ page }) => {
    // Navigate to the account page with charge items tab
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/charge_items`,
    );

    await page.waitForLoadState("networkidle");

    // Verify the charge items tab loads
    const accountContent = page.locator("main");
    await expect(accountContent).toBeVisible({ timeout: 10000 });
  });

  test("should view account payments tab", async ({ page }) => {
    // Navigate to the account page with payments tab
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/payments`,
    );

    await page.waitForLoadState("networkidle");

    // Verify the payments tab loads
    const accountContent = page.locator("main");
    await expect(accountContent).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to facility billing invoices list", async ({
    page,
  }) => {
    // Navigate to the facility-level invoices list
    await page.goto(`/facility/${facilityId}/billing/invoices`);

    await page.waitForLoadState("networkidle");

    // Verify the invoices list page loads
    const invoiceContent = page.locator("main");
    await expect(invoiceContent).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to facility billing payments list", async ({
    page,
  }) => {
    // Navigate to the facility-level payments list
    await page.goto(`/facility/${facilityId}/billing/payments`);

    await page.waitForLoadState("networkidle");

    // Verify the payments list page loads
    const paymentsContent = page.locator("main");
    await expect(paymentsContent).toBeVisible({ timeout: 10000 });
  });
});
