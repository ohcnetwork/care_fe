import { expect, test, type Page } from "@playwright/test";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function ensureSubmitInvoiceEnabled(page: Page) {
  const submitButton = page
    .getByRole("button", { name: /create invoice/i })
    .last();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await submitButton.isEnabled().catch(() => false)) return submitButton;
    await page.waitForTimeout(300);
  }

  const commandItem = page.locator('[data-slot="command-item"]').first();
  if (!(await commandItem.isVisible().catch(() => false))) {
    const pickerTrigger = page.getByRole("combobox").first();
    await expect(pickerTrigger).toBeVisible();
    await pickerTrigger.click();
    await expect(commandItem).toBeVisible();
  }

  for (let depth = 0; depth < 5; depth += 1) {
    await commandItem.click();
    const quantityInput = page.locator('input[type="number"]').first();
    if (await quantityInput.isVisible().catch(() => false)) break;
  }

  const confirmButton = page.getByTitle(/confirm/i).first();
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  } else {
    await page.keyboard.press("Enter");
  }

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await submitButton.isEnabled().catch(() => false)) return submitButton;
    await page.waitForTimeout(500);
  }

  throw new Error("Create invoice submit button did not become enabled");
}

async function createInvoiceAndGetId(
  page: Page,
  facilityId: string,
  accountId: string,
): Promise<string> {
  await page.goto(`/facility/${facilityId}/billing/account/${accountId}`);
  await expect(
    page.getByRole("button", { name: /create invoice|invoice/i }).first(),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /create invoice|invoice/i })
    .first()
    .click();

  await page.waitForURL(/\/billing\/account\/[a-f0-9-]+\/invoices\/create/i);
  const submitButton = await ensureSubmitInvoiceEnabled(page);
  await submitButton.click();

  await expect(
    page.getByRole("status").filter({
      hasText: /invoice.*created.*successfully/i,
    }),
  ).toBeVisible();

  await expect(page).toHaveURL(/\/billing\/invoices\/[a-f0-9-]+/i);

  const invoiceId = page.url().match(/\/billing\/invoices\/([a-f0-9-]+)/i)?.[1];
  if (!invoiceId)
    throw new Error("Could not extract created invoice ID from URL");

  return invoiceId;
}

test.describe("Create Invoice", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  test("navigate billing account list and open account", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/billing/account`);

    const accountsTable = page.getByRole("table");
    await expect(accountsTable).toBeVisible();

    await page
      .getByRole("button", { name: /go to account/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/billing\/account\/[a-f0-9-]+/i);
    await expect(
      page.getByRole("button", { name: /create invoice|invoice/i }).first(),
    ).toBeVisible();
  });

  test("create invoice and show success", async ({ page }) => {
    await createInvoiceAndGetId(page, facilityId, accountId);
  });

  test("created invoice appears in account invoices tab", async ({ page }) => {
    const invoiceId = await createInvoiceAndGetId(page, facilityId, accountId);

    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/invoices`,
    );

    const invoicesTable = page.getByRole("table");
    await expect(invoicesTable).toBeVisible();

    const invoiceLink = invoicesTable
      .getByRole("link", { name: /see invoice/i })
      .filter({ has: page.locator(`a[href*="${invoiceId}"]`) })
      .first();

    await expect(invoiceLink).toBeVisible();

    const invoiceRow = invoiceLink.locator("xpath=ancestor::tr[1]");

    await expect(invoiceRow).toBeVisible();
    await expect(
      invoiceRow.getByRole("cell", { name: /draft|issued|paid|cancelled/i }),
    ).toBeVisible();
  });
});
