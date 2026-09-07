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
});
