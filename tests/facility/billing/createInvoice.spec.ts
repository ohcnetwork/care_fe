import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  expectToast,
  selectFromDefinitionCategoryPicker,
} from "tests/helper/ui";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const medicationsCategoryChargeItemTitles = [
  "Ibuprofen",
  "Paracetamol",
  "Amoxicillin",
];

async function addBillableChargeItemOnCreateInvoicePage(
  page: Page,
  chargeItemTitle: string,
) {
  const definitionPicker = page
    .getByRole("combobox")
    .filter({ hasText: /add charges/i });
  await expect(definitionPicker).toBeVisible();
  await selectFromDefinitionCategoryPicker(page, definitionPicker, {
    navigateCategories: ["Medications"],
    search: chargeItemTitle,
  });

  await page.getByTitle(/confirm/i).click();
  await page.waitForLoadState("networkidle");

  const chargeRow = page
    .locator('[data-slot="table-body"]')
    .getByRole("row")
    .filter({ hasText: new RegExp(chargeItemTitle, "i") });
  await expect(chargeRow).toHaveCount(1);
}

async function clickCreateInvoiceFromAccount(page: Page) {
  const createInvoiceBtn = page
    .getByRole("button", { name: /create invoice|^invoice$/i })
    .filter({ visible: true });
  await expect(createInvoiceBtn).toBeVisible();
  await createInvoiceBtn.click();
}

async function createInvoiceAndGetId(
  page: Page,
  facilityId: string,
  accountId: string,
  chargeItemTitle: string,
): Promise<string> {
  await page.goto(`/facility/${facilityId}/billing/account/${accountId}`);
  await page.waitForLoadState("networkidle");

  await clickCreateInvoiceFromAccount(page);

  await page.waitForURL(/\/billing\/account\/[a-f0-9-]+\/invoices\/create/i);
  await page.waitForLoadState("networkidle");

  await addBillableChargeItemOnCreateInvoicePage(page, chargeItemTitle);

  const submitButton = page
    .locator('button[type="submit"]')
    .filter({ hasText: /create invoice/i });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page).toHaveURL(/\/billing\/invoices\/[a-f0-9-]+/i);
  await expectToast(page, /invoice created successfully/i);

  const invoiceId = page.url().match(/\/billing\/invoices\/([a-f0-9-]+)/i)?.[1];
  if (!invoiceId)
    throw new Error("Could not extract created invoice ID from URL");

  return invoiceId;
}

async function expectInvoiceShowListsDraftAndChargeItem(
  page: Page,
  chargeItemTitle: string,
) {
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/invoice:/i)).toBeVisible();
  await expect(page.getByText(/^draft$/i)).toBeVisible();
  await expect(
    page.getByRole("table").getByText(new RegExp(chargeItemTitle, "i")),
  ).toBeVisible();
}

test.describe("Create Invoice", () => {
  let facilityId: string;
  let accountId: string;
  let chargeItemTitle: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
    chargeItemTitle = faker.helpers.arrayElement(
      medicationsCategoryChargeItemTitles,
    );
  });

  test("billing accounts list filtered by patient opens setup account", async ({
    page,
  }) => {
    const patientId = getPatientId();

    await page.goto(
      `/facility/${facilityId}/billing/account?patient_filter=${patientId}`,
    );
    await page.waitForLoadState("networkidle");

    const accountsTable = page.getByRole("table");
    await expect(accountsTable).toBeVisible();

    const accountRow = page
      .locator('[data-slot="table-body"]')
      .getByRole("row");
    await expect(accountRow).toHaveCount(1);

    await accountRow.getByRole("button", { name: /go to account/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`/billing/account/${accountId}(/|$)`),
    );

    await expect(
      page
        .getByRole("button", { name: /create invoice|^invoice$/i })
        .filter({ visible: true }),
    ).toBeVisible();
  });

  test("create invoice and show success", async ({ page }) => {
    const invoiceId = await createInvoiceAndGetId(
      page,
      facilityId,
      accountId,
      chargeItemTitle,
    );
    await expect(page).toHaveURL(
      new RegExp(`/billing/invoices/${invoiceId}`, "i"),
    );
    await expectInvoiceShowListsDraftAndChargeItem(page, chargeItemTitle);
  });

  test("created invoice appears in account invoices tab", async ({ page }) => {
    const invoiceId = await createInvoiceAndGetId(
      page,
      facilityId,
      accountId,
      chargeItemTitle,
    );

    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/invoices`,
    );
    await page.waitForLoadState("networkidle");

    const invoicesTable = page.getByRole("table");
    await expect(invoicesTable).toBeVisible();

    const invoiceLink = page.locator(
      `a[href="/facility/${facilityId}/billing/invoices/${invoiceId}"]`,
    );
    await expect(invoiceLink).toHaveCount(1);
    await expect(invoiceLink).toBeVisible();
    await expect(invoiceLink).toContainText(/see invoice/i);

    const invoiceRow = invoiceLink.locator("xpath=ancestor::tr[1]");

    await expect(invoiceRow).toBeVisible();
    await expect(
      invoiceRow.getByRole("cell", { name: /draft|issued|paid|cancelled/i }),
    ).toBeVisible();
  });
});
