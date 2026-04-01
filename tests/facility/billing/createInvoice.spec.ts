import { expect, test, type Page } from "@playwright/test";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

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

  const createInvoiceButtons = page.getByRole("button", {
    name: /create invoice/i,
  });

  let clickedEnabledButton = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const count = await createInvoiceButtons.count();
    for (let index = 0; index < count; index += 1) {
      const button = createInvoiceButtons.nth(index);
      const isVisible = await button.isVisible().catch(() => false);
      const isEnabled = await button.isEnabled().catch(() => false);
      if (isVisible && isEnabled) {
        await button.click();
        clickedEnabledButton = true;
        break;
      }
    }
    if (clickedEnabledButton) break;
    await page.waitForTimeout(300);
  }

  if (!clickedEnabledButton)
    throw new Error("No visible and enabled 'Create Invoice' button found");

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
