import { expect, test } from "@playwright/test";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Invoice Creation", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  test("opens the create-invoice form and blocks submission until an item is billable", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/billing/account/${accountId}`);

    // Real user entry point into invoice creation.
    await page.getByRole("button", { name: /create invoice/i }).click();
    await page.waitForURL(/\/invoices\/create$/);

    // The create form opens a fresh draft.
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    // The account has no billable charge items, so the form shows its empty
    // state and keeps the submit button disabled — the real guard that stops
    // empty invoices from being created.
    await expect(page.getByText(/no billable items found/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create invoice/i }),
    ).toBeDisabled();
  });

  test("should render the account invoices tab", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/invoices`,
    );

    // The invoices tab owns the invoice search box.
    await expect(
      page.getByRole("textbox", { name: /search invoices/i }),
    ).toBeVisible();
  });

  test("should render the account charge items tab", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/charge_items`,
    );

    // "Print charge items" is always rendered by the charge items tab.
    await expect(
      page.getByRole("button", { name: /print charge items/i }),
    ).toBeVisible();
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
    ).toBeVisible();
  });

  test("should render the facility invoices list", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/billing/invoices`);

    await expect(
      page.getByRole("heading", { name: /invoice management/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /search invoices/i }),
    ).toBeVisible();
  });

  test("should render the facility payments list", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/billing/payments`);

    await expect(
      page.getByRole("heading", { name: /payment reconciliations/i }),
    ).toBeVisible();
  });
});
