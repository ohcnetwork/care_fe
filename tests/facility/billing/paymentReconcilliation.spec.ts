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
