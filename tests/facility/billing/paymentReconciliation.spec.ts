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

  test("should record payment with all fields filled", async ({ page }) => {
    // Open Record Payment
    await page.getByRole("button", { name: /record payment/i }).click();

    // Select payment method randomly
    const paymentMethods = [
      "Cash",
      "Credit Card",
      "Debit Card",
      "Check",
      "Direct Deposit",
    ];
    const selectedMethod = faker.helpers.arrayElement(paymentMethods);

    await page.getByRole("combobox", { name: "Payment Method" }).click();
    await page.getByRole("option", { name: selectedMethod }).click();

    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Location" })
      .click();

    await page
      .locator('[data-slot="command-item"]')
      .first()
      .waitFor({ state: "visible" });

    await page.locator('[data-slot="command-item"]').first().click();

    const paymentTypes = ["Payment", "Adjustment", "Advance"];
    const selectedType = faker.helpers.arrayElement(paymentTypes);

    await page.getByRole("combobox", { name: "Payment Type" }).click();
    await page.getByRole("option", { name: selectedType }).click();

    // Enter payment amount
    const paymentAmount = faker.number.int({ min: 100, max: 5000 }).toString();
    await page
      .getByRole("textbox", { name: "Payment Amount" })
      .fill(paymentAmount);

    // If payment method is Cash, enter tender amount
    if (selectedMethod === "Cash") {
      const tenderAmount = faker.number
        .int({ min: parseInt(paymentAmount), max: 10000 })
        .toString();
      await page
        .getByRole("textbox", { name: "Tender Amount" })
        .fill(tenderAmount);
    } else {
      // For non-cash payments, Tender Amount field should not be visible
      await expect(
        page.getByRole("textbox", { name: "Tender Amount" }),
      ).not.toBeVisible();
    }

    // Fill Payment Date
    const paymentDate = faker.date
      .between({
        from: new Date(2025, 0, 1),
        to: new Date(),
      })
      .toISOString()
      .slice(0, 16);

    await page.getByRole("textbox", { name: "Payment Date" }).fill(paymentDate);

    // Fill Reference Number
    const referenceNumber = faker.string.alphanumeric(10).toUpperCase();
    await page
      .getByRole("textbox", { name: "Reference Number" })
      .fill(referenceNumber);

    // Fill Notes
    const notes = faker.lorem.sentence();
    await page.getByRole("textbox", { name: "Notes" }).fill(notes);

    // Save payment
    await page.getByRole("button", { name: /record payment/i }).click();

    // Verify success
    await expect(
      page.getByText(/payment.*recorded.*successfully/i),
    ).toBeVisible();
  });

  test("should open record payment dialog using keyboard shortcut R", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: /record payment/i }),
    ).toBeVisible();
    // Press 'R' to open Record Payment
    await page.keyboard.press("r");

    // Verify Record Payment dialog is open
    const dialog = page.getByRole("dialog", { name: "Record Payment" });
    await expect(dialog).toBeVisible();
  });

  test("should show validation error when submitting empty payment", async ({
    page,
  }) => {
    // Open Record Payment
    await page.getByRole("button", { name: /record payment/i }).click();

    // Click Record Payment without filling anything
    await page.getByRole("button", { name: /record payment/i }).click();

    // Verify validation error is shown
    const paymentAmountSection = page
      .locator("div")
      .filter({ hasText: /^Payment Amount/ })
      .filter({ hasText: /Invalid input$/ });

    await expect(paymentAmountSection).toBeVisible();
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
