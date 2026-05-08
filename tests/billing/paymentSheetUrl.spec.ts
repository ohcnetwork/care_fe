import { expect, test } from "@playwright/test";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.describe("Payment Sheet URL Persistence", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  test.describe("facility admin", () => {
    test.use({ storageState: "tests/.auth/facilityAdmin.json" });

    test("advance payment slideover persists after page refresh", async ({
      page,
    }) => {
      // Navigate to the account page
      await page.goto(`/facility/${facilityId}/billing/account/${accountId}`);

      // Open the advance payment slideover
      await page
        .getByRole("button", { name: /advance\/receipt/i })
        .first()
        .click();

      // Verify the payment sheet is open
      await expect(
        page.getByText("Record Payment", { exact: true }),
      ).toBeVisible();

      // Verify the URL contains payment=advance
      await expect(page).toHaveURL(/[?&]payment=advance/);

      // Refresh the page
      await page.reload();

      // Verify the payment sheet is still open after refresh
      await expect(
        page.getByText("Record Payment", { exact: true }),
      ).toBeVisible();

      // Verify the URL still contains payment=advance
      await expect(page).toHaveURL(/[?&]payment=advance/);
    });

    test("payment sheet closes and URL clears when dismissed", async ({
      page,
    }) => {
      // Navigate directly with payment=advance in URL
      await page.goto(
        `/facility/${facilityId}/billing/account/${accountId}?payment=advance`,
      );

      // Verify the payment sheet is open
      await expect(
        page.getByText("Record Payment", { exact: true }),
      ).toBeVisible();

      // Close the sheet by pressing Escape
      await page.keyboard.press("Escape");

      // Verify the sheet is closed
      await expect(
        page.getByText("Record Payment", { exact: true }),
      ).not.toBeVisible();

      // Verify the URL no longer contains payment param
      await expect(page).not.toHaveURL(/[?&]payment=/);
    });

    test("credit note slideover persists after page refresh", async ({
      page,
    }) => {
      // Navigate with payment=credit in URL
      await page.goto(
        `/facility/${facilityId}/billing/account/${accountId}?payment=credit`,
      );

      // Verify the credit note sheet is open
      await expect(
        page.getByText("Record Credit Note", { exact: true }),
      ).toBeVisible();

      // Refresh the page
      await page.reload();

      // Verify the credit note sheet is still open after refresh
      await expect(
        page.getByText("Record Credit Note", { exact: true }),
      ).toBeVisible();

      // Verify the URL still contains payment=credit
      await expect(page).toHaveURL(/[?&]payment=credit/);
    });
  });
});
