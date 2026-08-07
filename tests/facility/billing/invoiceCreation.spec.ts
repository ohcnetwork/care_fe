import { expect, test } from "@playwright/test";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Invoice Creation", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  test("should open the invoice creation form from an active account", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/billing/account/${accountId}`);

    // The fixture account is active and billable, so the create-invoice action
    // must be offered. If it's missing (e.g. the account was closed elsewhere),
    // this fails loudly — which is exactly the regression worth catching.
    const createInvoice = page.getByRole("button", {
      name: /create invoice/i,
    });
    await expect(createInvoice).toBeVisible();
    await createInvoice.click();

    await page.waitForURL(/\/invoices\/create$/);
    await expect(page).toHaveURL(/\/invoices\/create$/);
    // A fresh draft invoice is what the create form opens.
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  });

  test("should render the account invoices tab", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/invoices`,
    );

    // The invoices tab owns the invoice search box.
    await expect(
      page.getByRole("textbox", { name: /search invoices/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should render the account charge items tab", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/charge_items`,
    );

    // "Print charge items" is always rendered by the charge items tab.
    await expect(
      page.getByRole("button", { name: /print charge items/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should render the account payments tab", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/payments`,
    );

    // Genuine either/or: the payments tab shows its empty state when there are
    // no reconciliations, or the payments table when there are.
    await expect(
      page
        .getByText(/no payments/i)
        .or(page.getByRole("table"))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should render the facility invoices list", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/billing/invoices`);

    await expect(
      page.getByRole("heading", { name: /invoice management/i }),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("textbox", { name: /search invoices/i }),
    ).toBeVisible();
  });

  test("should render the facility payments list", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/billing/payments`);

    await expect(
      page.getByRole("heading", { name: /payment reconciliations/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});
