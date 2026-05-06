import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });
const paymentMethods = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Check",
  "Direct Deposit",
];

const LOCATION_NAME = "Bio-Chemistry Lab";

async function ensureLocationHasOrganization(facilityId: string) {
  const apiUrl = getApiUrl();
  const headers = getApiHeaders();

  // Get the Bio-Chemistry Lab location
  const locRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/location/?name=${encodeURIComponent(LOCATION_NAME)}`,
    { headers },
  );
  if (!locRes.ok) return;
  const locData = await locRes.json();
  const location = locData.results?.find(
    (l: { name: string }) => l.name === LOCATION_NAME,
  );
  if (!location) return;

  // Check if any organization is already linked
  const orgRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/location/${location.id}/organizations/`,
    { headers },
  );
  if (!orgRes.ok) return;
  const orgData = await orgRes.json();
  if (orgData.results?.length > 0) return;

  // Find the Administration organization
  const facOrgRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/organizations/?limit=50`,
    { headers },
  );
  if (!facOrgRes.ok) return;
  const facOrgData = await facOrgRes.json();
  const adminOrg = facOrgData.results?.find(
    (o: { name: string }) => o.name === "Administration",
  );
  if (!adminOrg) return;

  // Link Administration org to the location
  await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/location/${location.id}/organizations_add/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ organization: adminOrg.id }),
    },
  );
}

test.describe("Payment Reconciliation", () => {
  test.beforeAll(async () => {
    const facilityId = getFacilityId();
    await ensureLocationHasOrganization(facilityId);
  });

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const accountId = getAccountId();
    const targetUrl = `/facility/${facilityId}/billing/account/${accountId}`;
    await page.goto(targetUrl);
  });

  test("should record payment with all fields filled", async ({ page }) => {
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
    const paymentAmount = faker.number.int({ min: 100, max: 5000 }).toString();
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

    // Verify success
    await expect(
      page.getByText(/payment.*recorded.*successfully/i),
    ).toBeVisible();
  });

  test("should open record payment dialog using keyboard shortcut R", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: /advance/i })).toBeVisible();
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
    await page.getByRole("button", { name: /advance/i }).click();

    // Click Record Payment without filling anything
    await page.getByRole("button", { name: /record payment/i }).click();

    // Verify validation error is shown
    const paymentAmountSection = page
      .locator("div")
      .filter({ hasText: /^Amount Paid/ })
      .filter({ hasText: /Must be a valid number$/ });

    await expect(paymentAmountSection).toBeVisible();
  });

  test("should record payment twice without refreshing page with location cache", async ({
    page,
  }) => {
    // Open Record Payment
    await page.getByRole("button", { name: /advance/i }).click();

    await page.locator("label").filter({ hasText: "Cash" }).click();

    // Select the location
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Location" })
      .click();

    await page
      .locator('[data-slot="command-item"]')
      .filter({ hasText: "Bio-Chemistry Lab" })
      .click();
    // Enter Amount Paid
    const paymentAmount = faker.number.int({ min: 100, max: 5000 }).toString();
    await page
      .getByRole("textbox", { name: "Amount Paid" })
      .fill(paymentAmount);

    // Enter Amount Received
    const tenderAmount = faker.number
      .int({ min: parseInt(paymentAmount), max: 10000 })
      .toString();
    await page
      .getByRole("textbox", { name: "Amount Received" })
      .fill(tenderAmount);

    // Save payment
    await page.getByRole("button", { name: /record payment/i }).click();

    // Verify success
    await expect(
      page.getByText(/payment.*recorded.*successfully/i),
    ).toBeVisible();

    // Record Payment again without refreshing the page
    await page.getByRole("button", { name: /advance/i }).click();

    await page.locator("label").filter({ hasText: "Cash" }).click();

    // Enter Amount Paid
    const newPaymentAmount = faker.number.int({ min: 1, max: 100 }).toString();
    await page
      .getByRole("textbox", { name: "Amount Paid" })
      .fill(newPaymentAmount);

    // Enter Amount Received
    const newTenderAmount = faker.number
      .int({ min: parseInt(newPaymentAmount), max: 10000 })
      .toString();
    await page
      .getByRole("textbox", { name: "Amount Received" })
      .fill(newTenderAmount);

    // Save payment
    await page.getByRole("button", { name: /record payment/i }).click();

    // Verify success
    await expect(
      page.getByText(/payment.*recorded.*successfully/i),
    ).toBeVisible();
  });
});
