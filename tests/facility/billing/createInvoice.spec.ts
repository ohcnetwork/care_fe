import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { closeAnyOpenPopovers, expectToast } from "tests/helper/ui";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const medicationsCategoryChargeItemTitles = [
  "Ibuprofen",
  "Paracetamol",
  "Amoxicillin",
];

async function selectChargeDefinitionForCreateInvoice(
  page: Page,
  trigger: Locator,
  {
    navigateCategories = [],
    search,
    itemIndex = 0,
  }: {
    navigateCategories?: string[];
    search?: string;
    itemIndex?: number;
  } = {},
) {
  await trigger.waitFor({ state: "visible" });
  await trigger.evaluate((el) =>
    (el as HTMLElement).scrollIntoView({ block: "center", inline: "nearest" }),
  );

  await closeAnyOpenPopovers(page);
  await trigger.click();

  const dialog = page.getByRole("dialog").last();
  const hasDialog = await dialog.isVisible().catch(() => false);
  const popper = page.locator("[data-radix-popper-content-wrapper]").last();
  const scope = hasDialog ? dialog : popper;
  await scope.waitFor({ state: "visible" });

  for (const categoryTitle of navigateCategories) {
    const categoryItem = scope.getByRole("option", {
      name: new RegExp(categoryTitle, "i"),
    });
    await categoryItem.waitFor({ state: "attached" });
    await categoryItem.waitFor({ state: "visible" });
    await categoryItem.click();
    const afterNavItems = scope.getByRole("option");
    await afterNavItems.first().waitFor({ state: "attached" });
  }

  if (search) {
    const input = scope.locator('[data-slot="command-input"]').first();
    await input.waitFor({ state: "visible" });
    await input.fill("");
    await input.fill(search);
    const afterSearchItems = scope.getByRole("option");
    await afterSearchItems.first().waitFor({ state: "attached" });
  }

  const items = scope.getByRole("option");
  await items.first().waitFor({ state: "attached" });
  await items.first().waitFor({ state: "visible" });

  const count = await items.count();
  if (count === 0) {
    throw new Error("No items found in definition category picker");
  }

  const targetItem = items.nth(itemIndex);
  await targetItem.waitFor({ state: "attached" });
  await targetItem.waitFor({ state: "visible" });
  await targetItem.evaluate((el) =>
    (el as HTMLElement).scrollIntoView({ block: "center", inline: "nearest" }),
  );
  await targetItem.click();
  await scope.waitFor({ state: "hidden" }).catch(() => {});
}

async function addBillableChargeItemOnCreateInvoicePage(
  page: Page,
  chargeItemTitle: string,
) {
  await expect(page.locator('[data-slot="table-body"]').first()).toBeVisible({
    timeout: 30_000,
  });

  const urlMatch = page
    .url()
    .match(
      /\/facility\/([^/]+)\/billing\/account\/([a-f0-9-]+)\/invoices\/create/i,
    );
  if (!urlMatch) {
    throw new Error(`Expected create invoice URL, got: ${page.url()}`);
  }
  const [, facilityIdFromUrl, accountIdFromUrl] = urlMatch;

  await page
    .waitForResponse(
      (r) => {
        if (r.request().method() !== "GET" || r.status() !== 200) return false;
        try {
          const p = new URL(r.url()).pathname;
          return (
            p ===
            `/api/v1/facility/${facilityIdFromUrl}/account/${accountIdFromUrl}/`
          );
        } catch {
          return false;
        }
      },
      { timeout: 15_000 },
    )
    .catch(() => {});

  const invoiceForm = page
    .locator('[data-slot="table-body"]')
    .first()
    .locator("xpath=ancestor::form[1]");
  const definitionPicker = invoiceForm
    .locator('button[role="combobox"]')
    .first();
  await expect(definitionPicker).toBeVisible({ timeout: 30_000 });
  await selectChargeDefinitionForCreateInvoice(page, definitionPicker, {
    navigateCategories: ["Medications"],
    search: chargeItemTitle,
  });

  await page.getByTitle(/confirm/i).click();
  await page.waitForLoadState("networkidle");

  const chargeRowsMatchingTitle = page
    .locator('[data-slot="table-body"]')
    .getByRole("row")
    .filter({ hasText: new RegExp(chargeItemTitle, "i") });

  const existingCount = await chargeRowsMatchingTitle.count();
  await expect(chargeRowsMatchingTitle).toHaveCount(existingCount + 1, {
    timeout: 30_000,
  });
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
  const invoiceTitle = page.getByText(/invoice:/i);
  await expect(invoiceTitle).toBeVisible();
  await expect(invoiceTitle.locator("..").getByText(/^draft$/i)).toBeVisible();
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
