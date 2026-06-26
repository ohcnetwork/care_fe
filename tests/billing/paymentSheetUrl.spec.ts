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
      await page.goto(`/facility/${facilityId}/billing/account/${accountId}`);

      await page.getByRole("button", { name: "Advance/Receipt" }).click();

      const paymentSheet = page.getByRole("dialog", {
        name: /record payment/i,
      });
      await expect(paymentSheet).toBeVisible();
      await expect(page).toHaveURL(/\/payment\/pay/);

      await page.reload();

      await expect(paymentSheet).toBeVisible();
      await expect(page).toHaveURL(/\/payment\/pay/);
    });

    test("payment sheet closes and URL clears when dismissed", async ({
      page,
    }) => {
      await page.goto(
        `/facility/${facilityId}/billing/account/${accountId}/invoices/payment/pay`,
      );

      const paymentSheet = page.getByRole("dialog", {
        name: /record payment/i,
      });
      await expect(paymentSheet).toBeVisible();

      // Close via the sheet's close button
      await paymentSheet.getByRole("button", { name: /close/i }).click();

      await expect(paymentSheet).not.toBeVisible();
      await expect(page).not.toHaveURL(/\/payment\//);
    });

    test("credit note slideover persists after page refresh", async ({
      page,
    }) => {
      await page.goto(
        `/facility/${facilityId}/billing/account/${accountId}/invoices/payment/credit_note`,
      );

      const creditNoteSheet = page.getByRole("dialog", {
        name: /record credit note/i,
      });
      await expect(creditNoteSheet).toBeVisible();

      await page.reload();

      await expect(creditNoteSheet).toBeVisible();
      await expect(page).toHaveURL(/\/payment\/credit_note/);
    });
  });
});
