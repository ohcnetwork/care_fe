import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test";
import en from "public/locale/en.json";
import { closeAnyOpenPopovers, expectToast } from "tests/helper/ui";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

function tr(key: string) {
  const value = (en as Record<string, unknown>)[key];
  if (typeof value !== "string") {
    throw new Error(`Missing or non-string i18n key: ${key}`);
  }
  return value;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tabLocator(page: Page, tabText: string) {
  return page.getByRole("tab", {
    name: new RegExp(`^${escapeRegex(tabText)}(\\b|\\s|$)`, "i"),
  });
}

function firstNonEmptyLine(text: string) {
  return (
    text
      .split("\n")
      .map((s) => s.trim())
      .find((line) => line.length > 0) ?? ""
  );
}

async function createMinimalChargeItemDefinition(
  page: Page,
  facilityId: string,
) {
  const title = `E2E ${faker.string.alphanumeric(12)}`;
  const slug = title.replace(/\s+/g, "-").toLowerCase().slice(0, 25);
  const basePrice = faker.commerce.price({ dec: 0 });
  const categoryQuery = tr("medication");

  await page.goto(`/facility/${facilityId}/settings/charge_item_definitions/`);
  await page.waitForLoadState("networkidle");

  await page.getByRole("textbox", { name: tr("search") }).fill(categoryQuery);
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("heading", { name: new RegExp(escapeRegex(categoryQuery), "i") })
    .first()
    .click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: tr("add_definition") }).click();
  await page.getByRole("textbox", { name: tr("title") }).fill(title);
  await page.getByRole("textbox", { name: tr("slug") }).fill(slug);
  await page.getByRole("textbox", { name: tr("base_price") }).fill(basePrice);
  await page.getByRole("button", { name: tr("create") }).click();
  await expectToast(page, tr("charge_item_definition_created_successfully"));
  await page.waitForLoadState("networkidle");
  return title;
}

async function waitForChargeItemSearchSettled(page: Page) {
  const searchingIndicator = page.getByText(tr("searching"), { exact: true });
  if (await searchingIndicator.isVisible().catch(() => false)) {
    await searchingIndicator.waitFor({ state: "hidden" });
  }
  await page.waitForLoadState("networkidle");
}

async function addChargeItemsFromPickerInSheet(
  page: Page,
  sheet: Locator,
  definitionSearch: string,
) {
  await closeAnyOpenPopovers(page);

  const picker = sheet.getByRole("combobox", {
    name: tr("select_charge_item_definition"),
  });
  await expect(picker).toBeVisible();
  await picker.click();

  const search = page.getByPlaceholder(tr("search_charge_item_definition"));
  await expect(search).toBeVisible();
  await search.fill("");
  await search.fill(definitionSearch);
  await waitForChargeItemSearchSettled(page);

  const listbox = page.getByRole("listbox").last();
  const listboxVisible = await listbox.isVisible().catch(() => false);
  if (!listboxVisible) return null;

  const options = listbox.getByRole("option");
  const count = await options.count();
  if (count === 0) return null;

  const option = options.first();
  await expect(option).toBeVisible();
  const optionText = (await option.textContent()) ?? "";
  const chargeItemTitle = firstNonEmptyLine(optionText);
  if (!chargeItemTitle) return null;

  await option.click();
  await expect(
    sheet.getByText(chargeItemTitle, { exact: false }),
  ).toBeVisible();
  await sheet.getByRole("button", { name: tr("add_items") }).click();
  await expectToast(page, tr("charge_items_added_successfully"));
  await page.waitForLoadState("networkidle");
  return chargeItemTitle;
}

async function addChargeItemsViaInlinePicker(
  page: Page,
  scope: Locator,
  definitionSearch: string,
) {
  await closeAnyOpenPopovers(page);

  const picker = scope.getByRole("combobox", {
    name: tr("select_charge_item_definition"),
  });
  await expect(picker).toBeVisible();
  await picker.click();

  const search = page.getByPlaceholder(tr("search_charge_item_definition"));
  await expect(search).toBeVisible();
  await search.fill("");
  await search.fill(definitionSearch);
  await waitForChargeItemSearchSettled(page);

  const listbox = page.getByRole("listbox").last();
  if (!(await listbox.isVisible().catch(() => false))) return null;

  const options = listbox.getByRole("option");
  if ((await options.count()) === 0) return null;

  const option = options.first();
  await expect(option).toBeVisible();
  const optionText = (await option.textContent()) ?? "";
  const chargeItemTitle = firstNonEmptyLine(optionText);
  if (!chargeItemTitle) return null;

  await option.click();
  await expect(
    scope.getByText(chargeItemTitle, { exact: false }),
  ).toBeVisible();

  const confirmBtn = scope
    .locator(
      `button[data-slot="button"][title*="${escapeRegex(tr("confirm"))}"]`,
    )
    .first();
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  await expectToast(page, tr("charge_items_added_successfully"));
  await page.waitForLoadState("networkidle");
  return chargeItemTitle;
}

async function openAccountList(
  page: Page,
  facilityId: string,
  patientId?: string,
) {
  const params = new URLSearchParams({ status: "active" });
  if (patientId) params.set("patient_filter", patientId);

  await page.goto(
    `/facility/${facilityId}/billing/account?${params.toString()}`,
  );
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: tr("accounts") }),
  ).toBeVisible();
}

async function openAccountShow(
  page: Page,
  facilityId: string,
  accountId: string,
) {
  await page.goto(`/facility/${facilityId}/billing/account/${accountId}`);
  await page.waitForLoadState("networkidle");

  await expect(tabLocator(page, tr("invoices"))).toBeVisible();
  await expect(tabLocator(page, tr("charge_items"))).toBeVisible();
  await expect(tabLocator(page, tr("payments"))).toBeVisible();
}

function chargeItemsListResponsePredicate(
  facilityId: string,
  accountId: string,
) {
  const pathNeedle = `/api/v1/facility/${facilityId}/charge_item/`;
  return (response: Response) =>
    response.request().method() === "GET" &&
    response.url().includes(pathNeedle) &&
    response.url().includes(accountId) &&
    (response.status() === 200 || response.status() === 304);
}

async function gotoCreateInvoicePage(
  page: Page,
  facilityId: string,
  accountId: string,
) {
  const createInvoiceUrl = `/facility/${facilityId}/billing/account/${accountId}/invoices/create`;
  const responsePromise = page.waitForResponse(
    chargeItemsListResponsePredicate(facilityId, accountId),
  );

  await page.goto(createInvoiceUrl, { waitUntil: "domcontentloaded" });
  await responsePromise;
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(
    new RegExp(`${escapeRegex(createInvoiceUrl)}(?:\\?|$)`),
  );
  await expect(
    page.getByText(tr("create_invoice"), { exact: true }),
  ).toBeVisible();
}

async function openCreateInvoiceFromAccountWorkspace(
  page: Page,
  facilityId: string,
  accountId: string,
) {
  const createInvoiceUrl = `/facility/${facilityId}/billing/account/${accountId}/invoices/create`;
  const responsePromise = page.waitForResponse(
    chargeItemsListResponsePredicate(facilityId, accountId),
  );

  const createInvoiceLink = page.getByRole("link", {
    name: tr("create_invoice"),
  });
  const hasLink = await createInvoiceLink.isVisible().catch(() => false);
  if (hasLink) {
    await createInvoiceLink.click();
  } else {
    await page.getByRole("button", { name: tr("create_invoice") }).click();
  }

  await responsePromise;
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(
    new RegExp(`${escapeRegex(createInvoiceUrl)}(?:\\?|$)`),
  );
  await expect(
    page.getByText(tr("create_invoice"), { exact: true }),
  ).toBeVisible();
}

async function openAddChargeItemsSheetDialog(page: Page) {
  const toolbarBtn = page
    .locator('button[data-slot="button"]')
    .filter({ hasText: tr("add_charge_items") });
  await expect(toolbarBtn.first()).toBeVisible();
  await toolbarBtn.first().scrollIntoViewIfNeeded();
  await toolbarBtn.first().click();
}

async function ensureAtLeastOneChargeItemSelected(
  page: Page,
  facilityId: string,
  accountId: string,
) {
  await openCreateInvoiceFromAccountWorkspace(page, facilityId, accountId);

  const invoiceForm = page.locator("form.space-y-6");
  await expect(invoiceForm).toBeVisible();

  const noBillableText = tr("no_billable_items");
  const noBillable = invoiceForm.getByText(noBillableText, { exact: true });
  const hasNoBillable = await noBillable.isVisible().catch(() => false);

  if (hasNoBillable) {
    const inlinePicker = invoiceForm.getByRole("combobox", {
      name: tr("select_charge_item_definition"),
    });

    let picked: string | null = null;
    if (await inlinePicker.isVisible().catch(() => false)) {
      picked = await addChargeItemsViaInlinePicker(page, invoiceForm, "");
      if (!picked) {
        picked = await addChargeItemsViaInlinePicker(page, invoiceForm, "a");
      }
    }

    let sheet = page.getByRole("dialog", { name: tr("add_charge_items") });

    if (!picked) {
      await openAddChargeItemsSheetDialog(page);
      await page.waitForLoadState("networkidle");
      await expect(sheet).toBeVisible();

      picked = await addChargeItemsFromPickerInSheet(page, sheet, "");
      if (!picked) {
        await page.keyboard.press("Escape");
        await page.waitForLoadState("networkidle");
        picked = await addChargeItemsFromPickerInSheet(page, sheet, "a");
      }
    }

    if (!picked) {
      await page.keyboard.press("Escape");
      await page.waitForLoadState("networkidle");

      const cancelBtn = sheet.getByRole("button", { name: tr("cancel") });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        await expect(
          page.getByRole("dialog", { name: tr("add_charge_items") }),
        ).toBeHidden();
      }

      const newDefinitionTitle = await createMinimalChargeItemDefinition(
        page,
        facilityId,
      );

      await gotoCreateInvoicePage(page, facilityId, accountId);
      await expect(invoiceForm).toBeVisible();

      picked = null;
      if (await inlinePicker.isVisible().catch(() => false)) {
        picked = await addChargeItemsViaInlinePicker(
          page,
          invoiceForm,
          newDefinitionTitle,
        );
      }
      if (!picked) {
        await openAddChargeItemsSheetDialog(page);
        await page.waitForLoadState("networkidle");
        sheet = page.getByRole("dialog", { name: tr("add_charge_items") });
        await expect(sheet).toBeVisible();

        picked = await addChargeItemsFromPickerInSheet(
          page,
          sheet,
          newDefinitionTitle,
        );
      }
      if (!picked) {
        throw new Error(
          "Charge item picker had no options after creating a definition",
        );
      }
    }

    await expect(noBillable).not.toBeVisible();
  }

  const rowCheckboxes = invoiceForm.getByRole("checkbox");
  await expect(rowCheckboxes.first()).toBeVisible();

  const checkboxCount = await rowCheckboxes.count();
  expect(checkboxCount).toBeGreaterThan(0);

  const targetCheckbox =
    checkboxCount > 1 ? rowCheckboxes.nth(1) : rowCheckboxes.first();
  await expect(targetCheckbox).toBeVisible();

  const isChecked =
    (await targetCheckbox.getAttribute("aria-checked").catch(() => null)) ===
    "true";
  if (!isChecked) await targetCheckbox.click();

  await expect(targetCheckbox).toHaveAttribute("aria-checked", "true");
}

async function extractInvoiceNumber(page: Page) {
  const invoiceLabel = escapeRegex(tr("invoice"));
  const invoiceLine = page
    .getByText(new RegExp(`${invoiceLabel}\\s*:\\s*`, "i"))
    .first();
  await expect(invoiceLine).toBeVisible();

  const text = (await invoiceLine.textContent())?.trim() || "";
  return text.replace(new RegExp(`^${tr("invoice")}\\s*:\\s*`, "i"), "").trim();
}

test.use({ storageState: "tests/.auth/user.json" });
test.describe.configure({ mode: "serial" });

let facilityId: string;
let patientId: string;
let accountId: string;
let createdInvoiceNumber = "";

test.beforeAll(async () => {
  facilityId = getFacilityId();
  patientId = getPatientId();
  accountId = "";
  try {
    accountId = getAccountId();
  } catch {
    accountId = "";
  }
});

async function ensureAccountExistsAndOpen(page: Page) {
  await openAccountList(page, facilityId, patientId);

  const table = page.getByRole("table");
  const hasTable = await table.isVisible().catch(() => false);

  const goToAccountName = tr("go_to_account");
  const hasGoToAccount =
    hasTable &&
    (await table
      .getByRole("button", { name: goToAccountName })
      .first()
      .isVisible()
      .catch(() => false));

  if (!hasGoToAccount) {
    await page.getByRole("button", { name: tr("create_account") }).click();
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("textbox", { name: tr("name") })
      .fill(
        `E2E ${faker.finance.accountName()} ${faker.string.alphanumeric(6)}`,
      );

    await page.getByRole("button", { name: tr("create") }).click();
    await page.waitForLoadState("networkidle");
  }

  const openButtons = page.getByRole("button", { name: goToAccountName });
  await expect(openButtons.first()).toBeVisible();
  await openButtons.first().click();
  await page.waitForLoadState("networkidle");

  const match = page.url().match(/\/billing\/account\/([a-f0-9-]+)/i);
  if (!match?.[1])
    throw new Error(`Failed to extract accountId from URL: ${page.url()}`);
  accountId = match[1];

  await expect(page).toHaveURL(
    new RegExp(`/billing/account/${accountId}(?:/|$)`),
  );
}

test.describe("Create Invoice (facility billing)", () => {
  test("Navigate Billing → Account List → open fixture account from list", async ({
    page,
  }) => {
    await test.step("Ensure account exists and open it", async () => {
      await ensureAccountExistsAndOpen(page);
    });

    await test.step("Verify account workspace tabs", async () => {
      await expect(tabLocator(page, tr("invoices"))).toBeVisible();
      await expect(tabLocator(page, tr("charge_items"))).toBeVisible();
      await expect(tabLocator(page, tr("payments"))).toBeVisible();
    });
  });

  test("Create invoice from account and verify success toast", async ({
    page,
  }) => {
    await openAccountShow(page, facilityId, accountId);

    await test.step("Ensure at least one charge item is selected", async () => {
      await ensureAtLeastOneChargeItemSelected(page, facilityId, accountId);
    });

    await test.step("Fill optional fields", async () => {
      const toggleOptional = page.getByRole("button", {
        name: tr("payment_terms_and_note"),
        exact: true,
      });
      await expect(toggleOptional).toBeVisible();
      await toggleOptional.click();

      await page
        .getByPlaceholder(tr("payment_terms_placeholder"))
        .fill(`PT-${faker.string.alphanumeric(8)}`);
      await page
        .getByPlaceholder(tr("invoice_note_placeholder"))
        .fill(faker.lorem.sentence());
    });

    await test.step("Submit invoice and verify success", async () => {
      await page.getByRole("button", { name: tr("create_invoice") }).click();
      await expectToast(page, tr("invoice_created_successfully"));

      await page.waitForLoadState("networkidle");
      createdInvoiceNumber = await extractInvoiceNumber(page);
      expect(createdInvoiceNumber).not.toEqual("");
    });
  });

  test("Verify invoice appears in Invoices tab", async ({ page }) => {
    await test.step("Navigate back to invoices list", async () => {
      const back = page.getByRole("link", { name: tr("back_to_invoices") });
      const hasBack = await back.isVisible().catch(() => false);
      if (hasBack) {
        await back.click();
      } else {
        await openAccountShow(page, facilityId, accountId);
        await tabLocator(page, tr("invoices")).click();
      }
      await page.waitForLoadState("networkidle");
    });

    await test.step("Search invoice number and verify row + draft badge", async () => {
      expect(createdInvoiceNumber.length).toBeGreaterThan(0);

      const search = page.getByPlaceholder(tr("search_invoices"));
      await expect(search).toBeVisible();
      await search.fill(createdInvoiceNumber);
      await page.waitForLoadState("networkidle");

      const table = page.getByRole("table");
      await expect(table).toBeVisible();

      const row = table
        .getByRole("row")
        .filter({ hasText: createdInvoiceNumber })
        .first();
      await expect(row).toBeVisible();
      await expect(row.getByText(tr("draft"), { exact: true })).toBeVisible();
    });
  });
});
