// tests/facility/billing/paymentReconciliation.spec.ts
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Adjust these strings if your i18n produces different visible text
const LABELS = {
  accountsNav: /accounts/i,
  recordPaymentBtn: /record payment/i, // button that opens the PaymentReconciliationSheet
  paymentAmountLabel: /payment amount/i,
  tenderAmountLabel: /tender amount/i,
  submitBtn: /record payment/i,
  customInvalidMsg: /Please enter a valid amount/i, // expected custom message (case-insensitive)
  nativeInvalidMsg: /Invalid input/i, // message you want to avoid
};

test.use({ storageState: "tests/.auth/user.json" });

test.describe("PaymentReconciliationSheet — validation messages", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the billing accounts page for the test facility
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/billing`);
    await page.getByRole("link", { name: LABELS.accountsNav }).click();

    // Wait for the account list to be ready and click the first account
    const firstAccountRow = page
      .locator('[data-testid^="account-row-"]')
      .first();
    await expect(firstAccountRow).toBeVisible();
    await firstAccountRow.click();

    // Click "Record payment" to open the sheet
    const recordPayment = page.getByRole("button", {
      name: LABELS.recordPaymentBtn,
    });
    await expect(recordPayment).toBeVisible();
    await recordPayment.click();

    // Wait for the sheet to appear. A good way to do this is to wait for a unique element inside it.
    const paymentAmountInput = page.getByLabel(LABELS.paymentAmountLabel);
    await expect(paymentAmountInput).toBeVisible();

      // Also ensure the submit button within the sheet is ready.
+   const dialog = page.getByRole('dialog');
+   await expect(
+     dialog.getByRole('button', { name: LABELS.submitBtn }),
+   ).toBeVisible();

  });

  test("submitting empty/default form shows custom validation message", async ({
    page,
  }) => {
    
    const dialog = page.getByRole("dialog");
    const submitBtn = dialog.getByRole("button", { name: LABELS.submitBtn });
    await submitBtn.click();

    // Expect the custom validation message to be visible
    await expect(page.getByText(LABELS.customInvalidMsg)).toBeVisible();

    // Ensure native browser message is NOT present
    await expect(page.getByText(LABELS.nativeInvalidMsg)).not.toBeVisible();
  });

  test("submitting explicit zero shows custom validation message (amount = 0)", async ({
    page,
  }) => {
    const paymentAmountInput = page.getByLabel(LABELS.paymentAmountLabel);

    // Fill 0 explicitly
    await paymentAmountInput.fill("0");

    // Submit
    const submitBtn = page.getByRole("button", { name: LABELS.submitBtn });
    await submitBtn.click();

    // Expect custom message
    await expect(page.getByText(LABELS.customInvalidMsg)).toBeVisible();

    // Ensure native message missing
    await expect(page.getByText(LABELS.nativeInvalidMsg)).not.toBeVisible();
  });

  test("no console errors when submitting invalid payment", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Direct submit to trigger validation
    const submitBtn = page.getByRole("button", { name: LABELS.submitBtn });
    await submitBtn.click();

    // Wait for the validation UI to settle, then assert that no console errors were logged.
+   await expect(page.getByText(LABELS.customInvalidMsg)).toBeVisible();
+   expect(errors).toHaveLength(0);
  });

  test("submitting valid payment form succeeds", async ({ page }) => {
    const paymentAmountInput = page.getByLabel(LABELS.paymentAmountLabel);
    const tenderAmountInput = page.getByLabel(LABELS.tenderAmountLabel);
    const submitBtn = page.getByRole("button", { name: LABELS.submitBtn });

    // Fill valid values
    await paymentAmountInput.fill("100");
    await tenderAmountInput.fill("100");

    // Submit the form
    await submitBtn.click();

    // Expect the payment form/sheet to close or success message to be visible
    // Check that the payment amount input is no longer visible, implying form closed
    await expect(paymentAmountInput).toBeHidden();
    
  });
});
