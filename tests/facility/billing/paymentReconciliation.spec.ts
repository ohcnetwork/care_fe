import { faker } from "@faker-js/faker";
import { createAccount, recordPaymentViaUi } from "tests/helper/billing";
import { createLocationHierarchy } from "tests/helper/locations";
import { getFacilityId } from "tests/support/facilityId";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });
const paymentMethods = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Check",
  "Direct Deposit",
];

test.describe("Payment Reconciliation", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeEach(async ({ page, isolatedPatient }) => {
    facilityId = getFacilityId();
    // Payments change the account's balance, so each test records on an
    // account of its own instead of the shared fixture account.
    const account = await createAccount(facilityId, isolatedPatient.patientId, {
      name: `Payment account ${faker.string.alphanumeric(10)}`,
    });
    accountId = account.id;
    const targetUrl = `/facility/${facilityId}/billing/account/${accountId}`;
    await page.goto(targetUrl);
  });

  test(
    "should record payment with all fields filled",
    { tag: ["@atomic", "@cap:billing.payment.record"] },
    async ({ page }) => {
      // Open Record Payment
      await page.getByRole("button", { name: /advance/i }).click();

      // Select payment method randomly
      const selectedMethod = faker.helpers.arrayElement(paymentMethods);

      await page
        .locator("label")
        .filter({ hasText: `${selectedMethod}` })
        .click();

      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Location" })
        .click();

      await page
        .locator('[data-slot="command-item"]')
        .filter({ hasText: "Bio-Chemistry Lab" })
        .click();

      const paymentTypes = [/^Payment$/, /^Advance$/];
      const selectedType = faker.helpers.arrayElement(paymentTypes);

      await page.locator("label").filter({ hasText: selectedType }).click();

      // Enter Amount Paid
      const paymentAmount = faker.number
        .int({ min: 100, max: 5000 })
        .toString();
      await page
        .getByRole("textbox", { name: "Amount Paid" })
        .fill(paymentAmount);

      // If payment method is Cash, enter Amount Received
      if (selectedMethod === "Cash") {
        const tenderAmount = faker.number
          .int({ min: parseInt(paymentAmount), max: 10000 })
          .toString();
        await page
          .getByRole("textbox", { name: "Amount Received" })
          .fill(tenderAmount);
      } else {
        // For non-cash payments, Amount Received field should not be visible
        await expect(
          page.getByRole("textbox", { name: "Amount Received" }),
        ).toBeHidden();
      }

      // Fill Payment Date
      const paymentDate = faker.date
        .between({
          from: new Date(2025, 0, 1),
          to: new Date(),
        })
        .toISOString()
        .slice(0, 16);

      await page
        .getByRole("textbox", { name: "Payment Date" })
        .fill(paymentDate);

      // Fill Reference Number (not available for Cash)
      const refField = page.getByRole("textbox", { name: "Reference Number" });
      if (selectedMethod !== "Cash") {
        const referenceNumber = faker.string.alphanumeric(10).toUpperCase();
        await refField.fill(referenceNumber);
      }

      // Fill Notes
      const notes = faker.lorem.sentence();
      await page.getByRole("textbox", { name: "Notes" }).fill(notes);

      // Save payment
      await page.getByRole("button", { name: /record payment/i }).click();

      // Wait for success message to appear in the sheet
      const successMessage = page.getByText(/payment.*recorded.*successfully/i);
      await expect(successMessage).toBeVisible();
    },
  );

  test(
    "should open record payment dialog using keyboard shortcut C",
    { tag: ["@atomic", "@cap:billing.payment.record"] },
    async ({ page }) => {
      // "R" is bound only to the lg:hidden mobile button; desktop uses "C"
      await expect(
        page.getByRole("button", { name: /advance/i }),
      ).toBeVisible();
      await page.keyboard.press("c");

      // Verify Record Payment sheet is open by checking for the sheet heading
      const sheet = page.locator("[role='dialog']").filter({
        has: page.getByRole("heading", { name: /collect payment/i }),
      });
      await expect(sheet).toBeVisible();
    },
  );

  test(
    "selects a ward with beds without opening an empty sub-location list",
    { tag: ["@atomic", "@cap:billing.payment.record"] },
    async ({ page, request }) => {
      const { root, ward, rootBed } = await createLocationHierarchy(
        request,
        facilityId,
      );
      await page.getByRole("button", { name: /advance/i }).click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Location" })
        .click();
      await page.getByPlaceholder("Search locations...").fill(root.name);
      await page.getByRole("option", { name: root.name, exact: true }).click();

      await expect(
        page.getByRole("option", { name: ward.name, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: rootBed.name, exact: true }),
      ).toHaveCount(0);
      await page.getByRole("option", { name: ward.name, exact: true }).click();

      await expect(
        page.getByRole("combobox").filter({ hasText: ward.name }),
      ).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByPlaceholder("Search locations...")).toBeHidden();
    },
  );

  test(
    "only enables recording a payment for a positive amount",
    { tag: ["@atomic", "@cap:billing.payment.record"] },
    async ({ page }) => {
      await page.getByRole("button", { name: /advance/i }).click();
      const amount = page.getByRole("textbox", { name: "Amount Paid" });
      const recordPayment = page.getByRole("button", {
        name: /record payment/i,
      });

      await expect(recordPayment).toBeDisabled();
      for (const value of ["0", "0.00"]) {
        await amount.fill(value);
        await expect(recordPayment).toBeDisabled();
      }

      await amount.fill("0.01");
      await expect(recordPayment).toBeEnabled();
      await amount.clear();
      await expect(recordPayment).toBeDisabled();
    },
  );

  test(
    "keeps the cash payment sheet usable while an amount is partial input",
    { tag: ["@atomic", "@cap:billing.payment.record"] },
    async ({ page }) => {
      await page.getByRole("button", { name: /advance/i }).click();
      await page.locator("label").filter({ hasText: "Cash" }).click();
      // Without a location, Zod skips the object-level tender check on submit.
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Location" })
        .click();
      await page
        .locator('[data-slot="command-item"]')
        .filter({ hasText: "Bio-Chemistry Lab" })
        .click();
      const amountPaid = page.getByRole("textbox", { name: "Amount Paid" });
      const amountReceived = page.getByRole("textbox", {
        name: "Amount Received",
      });
      const recordPayment = page.getByRole("button", {
        name: /record payment/i,
      });

      // A lone "." is not a number yet. The change calculation must not crash.
      await amountPaid.pressSequentially(".");
      await expect(amountPaid).toHaveValue(".");
      await expect(recordPayment).toBeDisabled();
      await amountPaid.pressSequentially("5");
      await expect(amountPaid).toHaveValue(".5");
      await expect(recordPayment).toBeEnabled();

      await amountPaid.fill("100");
      await amountReceived.clear();
      await amountReceived.pressSequentially(".");
      await expect(amountReceived).toHaveValue(".");

      // Submit with a partial amount received: show the error, do not crash.
      await recordPayment.click();
      await expect(page.getByText("Must be a valid number")).toBeVisible();
      await expect(
        page.getByText(/payment.*recorded.*successfully/i),
      ).toHaveCount(0);

      const changeToReturn = page.getByText(/change to return/i);
      const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(value);

      await amountReceived.fill("150");
      await expect(changeToReturn).toContainText(formatCurrency(50));

      // After a submit, the form validates on each change. A partial amount paid
      // must show its error, and the change counts it as 0.
      await amountPaid.fill(".");
      await expect(page.getByText("Must be a valid number")).toBeVisible();
      await expect(changeToReturn).toContainText(formatCurrency(150));
    },
  );

  test(
    "should record payment twice without refreshing page with location cache",
    { tag: ["@atomic", "@cap:billing.payment.record"] },
    async ({ page }) => {
      // Record the first payment, picking the location
      const paymentAmount = faker.number
        .int({ min: 100, max: 5000 })
        .toString();
      const tenderAmount = faker.number
        .int({ min: parseInt(paymentAmount), max: 10000 })
        .toString();
      await recordPaymentViaUi(page, {
        facilityId,
        accountId,
        amount: paymentAmount,
        tenderedAmount: tenderAmount,
        location: "Bio-Chemistry Lab",
        navigate: false,
      });

      // Close the success view by clicking the close button in the sheet
      const sheet = page.locator("[role='dialog']");
      await sheet.getByRole("button", { name: /close/i }).first().click();

      // Wait for sheet to close and button to be visible again
      await expect(
        page.getByRole("button", { name: /advance/i }),
      ).toBeVisible();

      // Record Payment again without refreshing the page: the sheet keeps the
      // location, so it is not picked again
      const newPaymentAmount = faker.number
        .int({ min: 1, max: 100 })
        .toString();
      const newTenderAmount = faker.number
        .int({ min: parseInt(newPaymentAmount), max: 10000 })
        .toString();
      await recordPaymentViaUi(page, {
        facilityId,
        accountId,
        amount: newPaymentAmount,
        tenderedAmount: newTenderAmount,
        navigate: false,
      });
    },
  );
});
