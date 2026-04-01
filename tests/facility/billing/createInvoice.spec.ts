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

  const dialog = page.getByRole("dialog");
  await Promise.race([
    dialog.waitFor({ state: "visible" }),
    page.waitForURL(/\/billing\/account\/[a-f0-9-]+\/invoices\/create/i),
  ]).catch(() => {});
  const hasDialog = await dialog.isVisible().catch(() => false);

  if (hasDialog) {
    const createInvoiceButton = dialog.getByRole("button", {
      name: /create invoice/i,
    });
    await expect(createInvoiceButton).toBeVisible();
    await expect(createInvoiceButton).toBeEnabled();
    await createInvoiceButton.click();
  } else {
    await expect(page).toHaveURL(
      /\/billing\/account\/[a-f0-9-]+\/invoices\/create/i,
    );
    const table = page.getByRole("table");
    await expect(table).toBeVisible();

    const dataRow = table.getByRole("row").nth(1);
    const hasDataRow = await dataRow.isVisible().catch(() => false);
    if (hasDataRow) {
      const rowCheckbox = dataRow.getByRole("checkbox").first();
      if (await rowCheckbox.isVisible().catch(() => false)) {
        await rowCheckbox.check().catch(async () => {
          await rowCheckbox.click();
        });
      }
    }

    const createInvoiceButton = page.getByRole("button", {
      name: /create invoice/i,
    });
    await expect(createInvoiceButton).toBeVisible();
    await expect(createInvoiceButton).toBeEnabled({ timeout: 20000 });
    await createInvoiceButton.click();
  }

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
