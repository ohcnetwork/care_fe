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

test.use({ storageState: "tests/.auth/user.json" });
test.describe.configure({ mode: "serial" });

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

function createInvoiceForm(page: Page): Locator {
  return page.locator("form").filter({ has: page.getByRole("table") });
}

function addChargeItemsBillingSheetPanel(page: Page): Locator {
  return page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: tr("add_charge_items") }),
  });
}

function accountRetrieveResponsePredicate(
  facilityId: string,
  accountId: string,
) {
  const needle = `/api/v1/facility/${facilityId}/account/${accountId}/`;
  return (response: Response) =>
    response.request().method() === "GET" &&
    response.url().includes(needle) &&
    !response.url().includes("/rebalance/") &&
    (response.status() === 200 || response.status() === 304);
}

function firstNonEmptyLine(text: string) {
  return (
    text
      .split("\n")
      .map((s) => s.trim())
      .find((line) => line.length > 0) ?? ""
  );
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

  const definitionSearchPlaceholder = tr("search_charge_item_definition");
  const pickerPopover = page
    .locator("[data-radix-popper-content-wrapper]")
    .filter({ has: page.getByPlaceholder(definitionSearchPlaceholder) })
    .filter({ visible: true })
    .last();
  const listbox = pickerPopover.getByRole("listbox");
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

async function ensureAtLeastOneChargeItemSelected(
  page: Page,
  facilityId: string,
  accountId: string,
) {
  const createInvoiceUrl = `/facility/${facilityId}/billing/account/${accountId}/invoices/create`;
  const accountResponsePromise = page.waitForResponse(
    accountRetrieveResponsePredicate(facilityId, accountId),
  );

  await page.goto(createInvoiceUrl, { waitUntil: "domcontentloaded" });
  const accountResponse = await accountResponsePromise;

  if (accountResponse.status() === 200) {
    const accountData = (await accountResponse.json()) as {
      patient?: { id?: string } | string | null;
    };
    if (!accountData.patient) {
      throw new Error(
        `Billing account ${accountId} has no linked patient; Create Invoice cannot add charge items.`,
      );
    }
  }

  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(
    new RegExp(`${escapeRegex(createInvoiceUrl)}(?:\\?|$)`),
  );
  await expect(
    page.getByText(tr("create_invoice"), { exact: true }),
  ).toBeVisible();

  const invoiceForm = createInvoiceForm(page);
  await expect(invoiceForm).toBeVisible();

  const noBillableText = tr("no_billable_items");
  const noBillable = invoiceForm.getByText(noBillableText, { exact: true });
  const hasNoBillable = await noBillable.isVisible().catch(() => false);

  if (hasNoBillable) {
    const definitionCombobox = invoiceForm.getByRole("combobox", {
      name: tr("select_charge_item_definition"),
    });
    await expect(definitionCombobox).toBeVisible();

    await closeAnyOpenPopovers(page);
    await page.keyboard.press("Escape");
    await expect(definitionCombobox).toHaveAttribute("aria-expanded", "false");
    await page.waitForLoadState("networkidle");

    const sheet = addChargeItemsBillingSheetPanel(page);

    const toolbarBtn = page.getByRole("button", {
      name: tr("add_charge_items"),
    });
    await expect(toolbarBtn).toBeVisible();
    await toolbarBtn.scrollIntoViewIfNeeded();
    await toolbarBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(sheet).toBeVisible();

    let picked = await addChargeItemsFromPickerInSheet(page, sheet, "");
    if (!picked) {
      await page.keyboard.press("Escape");
      await page.waitForLoadState("networkidle");
      picked = await addChargeItemsFromPickerInSheet(page, sheet, "a");
    }

    if (!picked) {
      await page.keyboard.press("Escape");
      await page.waitForLoadState("networkidle");

      const dialog = addChargeItemsBillingSheetPanel(page);
      const cancelBtn = dialog.getByRole("button", { name: tr("cancel") });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        await expect(dialog).toBeHidden();
      }

      throw new Error(
        "No billable charge items could be added from the picker; ensure fixture data exposes charge item definitions with options.",
      );
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

let facilityId: string;
let patientId: string;
let accountId: string;
let createdInvoiceNumber = "";

test.beforeAll(async () => {
  facilityId = getFacilityId();
  patientId = getPatientId();
  accountId = getAccountId();
});

async function openFixtureAccountFromBillingList(page: Page) {
  await openAccountList(page, facilityId, patientId);

  const accountsTable = page.getByRole("table");
  await expect(accountsTable).toBeVisible();
  const goToAccount = accountsTable.getByRole("button", {
    name: tr("go_to_account"),
  });
  await expect(goToAccount.first()).toBeVisible();
  await goToAccount.first().click();
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(
    new RegExp(`/billing/account/${escapeRegex(accountId)}(?:/|$)`),
  );
}

test.describe("Create Invoice (facility billing)", () => {
  test("Navigate Billing → Account List → open fixture account from list", async ({
    page,
  }) => {
    await test.step("Open fixture account from billing list", async () => {
      await openFixtureAccountFromBillingList(page);
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
      const form = createInvoiceForm(page);
      const toggleOptional = form.getByRole("button", {
        name: tr("payment_terms_and_note"),
        exact: true,
      });
      await expect(toggleOptional).toBeVisible();
      await toggleOptional.click();

      await form
        .getByPlaceholder(tr("payment_terms_placeholder"))
        .fill(`PT-${faker.string.alphanumeric(8)}`);
      await form
        .getByPlaceholder(tr("invoice_note_placeholder"))
        .fill(faker.lorem.sentence());
    });

    await test.step("Submit invoice and verify success", async () => {
      await createInvoiceForm(page)
        .getByRole("button", { name: tr("create_invoice") })
        .click();
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
