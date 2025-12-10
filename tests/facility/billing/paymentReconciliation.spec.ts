import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Payment Reconciliation", () => {
  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const accountId = getAccountId();
    const targetUrl = `/facility/${facilityId}/billing/account/${accountId}`;
    await page.goto(targetUrl);
  });

  test("should record payment twice without refreshing page with location cache", async ({
    page,
  }) => {
    // Open Record Payment
    await page.getByRole("button", { name: /record payment/i }).click();

    // Select the first location
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Location" })
      .click();

    await page
      .locator('[data-slot="command-item"]')
      .first()
      .waitFor({ state: "visible" });

    await page.locator('[data-slot="command-item"]').first().click();
    // Enter payment amount
    const paymentAmount = faker.number.int({ min: 100, max: 5000 }).toString();
    await page
      .getByRole("textbox", { name: "Payment Amount" })
      .fill(paymentAmount);

    // Enter tender amount
    const tenderAmount = faker.number
      .int({ min: parseInt(paymentAmount), max: 10000 })
      .toString();
    await page
      .getByRole("textbox", { name: "Tender Amount" })
      .fill(tenderAmount);

    // Save payment
    await page.getByRole("button", { name: /record payment/i }).click();

    // Verify success
    await expect(
      page.getByText(/payment.*recorded.*successfully/i),
    ).toBeVisible();

    // Record Payment again without refreshing the page
    await page.getByRole("button", { name: /record payment/i }).click();

    // Enter payment amount
    const newPaymentAmount = faker.number.int({ min: 1, max: 100 }).toString();
    await page
      .getByRole("textbox", { name: "Payment Amount" })
      .fill(newPaymentAmount);

    // Save payment
    await page.getByRole("button", { name: /record payment/i }).click();

    // Verify success
    await expect(
      page.getByText(/payment.*recorded.*successfully/i),
    ).toBeVisible();
  });
});
