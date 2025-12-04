import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let patientId: string;
let accountId: string;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
  });
  const page = await context.newPage();

  facilityId = getFacilityId();

  await page.goto(`/facility/${facilityId}/encounters/patients/all`);
  await page.getByRole("button", { name: "View Encounter" }).first().click();

  await page.waitForURL(
    /\/facility\/([^/]+)\/patient\/([^/]+)\/encounter\/([^/]+)/,
    {
      timeout: 10000,
    },
  );

  const urlMatch = page
    .url()
    .match(/\/facility\/([^/]+)\/patient\/([^/]+)\/encounter\/([^/]+)/);

  if (!urlMatch || !urlMatch[2]) {
    throw new Error(`Failed to extract patient ID from URL: ${page.url()}`);
  }

  patientId = urlMatch[2];

  await page.goto(`/facility/${facilityId}/patient/${patientId}`);
  await page.getByRole("tab", { name: "Accounts" }).click();
  await page.getByRole("button", { name: "Create Account" }).click();

  // Generate random account name using faker
  const accountName = faker.finance.accountName();

  await page.getByRole("textbox", { name: "Name *" }).fill(accountName);
  await page.getByRole("button", { name: "Create" }).click();

  await page.getByRole("button", { name: "Go to account" }).click();

  // Wait for account creation and extract accountId from URL
  await page.waitForURL(/\/account\/[a-f0-9-]+/);
  const accountMatch = page.url().match(/\/account\/([a-f0-9-]+)/);

  if (!accountMatch || !accountMatch[1]) {
    throw new Error(`Failed to extract account ID from URL: ${page.url()}`);
  }
  accountId = accountMatch[1];

  await context.close();
});

test.describe("Payment Reconciliation", () => {
  test.beforeEach(async ({ page }) => {
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

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    // Delete the created account
    const targetUrl = `/facility/${facilityId}/billing/account/${accountId}`;
    await page.goto(targetUrl);

    await page.getByRole("button", { name: "Settle & Close S" }).click();

    await page.getByRole("button", { name: /close account/i }).click();

    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText(/account closed successfully/i),
    ).toBeVisible();

    await page.close();
    await context.close();
  });
});
