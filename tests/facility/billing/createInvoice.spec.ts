import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import en from "public/locale/en.json";
import { expectToast } from "tests/helper/ui";
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

function firstMeaningfulLine(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .find((line) => line.length > 0);
}

function getCreateInvoiceChargeItemsTable(page: Page) {
  // Create Invoice page can have multiple tables mounted (including in hidden sheets).
  // Scope to the main content area to avoid tables inside sheets/dialogs.
  const main = page.getByRole("main");
  return main.locator("table").first();
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

  await expect(page.getByRole("tab", { name: tr("invoices") })).toBeVisible();
  await expect(
    page.getByRole("tab", {
      name: new RegExp(`^${escapeRegex(tr("charge_items"))}(\\s|$)`),
    }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: tr("payments") })).toBeVisible();
}

async function ensureAtLeastOneChargeItemSelected(
  page: Page,
  _facilityId: string,
  _accountId: string,
) {
  const table = getCreateInvoiceChargeItemsTable(page);
  await expect(table).toBeVisible();

  // Wait for table body to render at least one row (either the empty-state row
  // or the first billable item row). This is more reliable than racing on text/checkbox.
  await expect(table.locator("tbody tr").first()).toBeVisible();

  const noBillable = table.getByText(tr("no_billable_items"));

  const hasNoBillable = await noBillable.isVisible().catch(() => false);

  let chargeItemTitle = "";

  if (hasNoBillable) {
    await page.getByRole("button", { name: tr("add_charge_items") }).click();
    await page.waitForLoadState("networkidle");

    const sheet = page.getByRole("dialog", { name: tr("add_charge_items") });
    await expect(sheet).toBeVisible();

    const searchBox = sheet
      .getByPlaceholder(tr("select_charge_item_definition"))
      .or(sheet.getByRole("textbox").first());
    await expect(searchBox).toBeVisible();
    await searchBox.press("Enter");
    await page.waitForLoadState("networkidle");

    const firstOption = sheet.getByRole("option").first();
    const hasOptions = await firstOption.isVisible().catch(() => false);
    if (!hasOptions) {
      await sheet.getByRole("button", { name: tr("cancel") }).click();
      await expect(sheet).toBeHidden();
      throw new Error(
        "No charge items available to add. Ensure a charge item definition exists for this facility.",
      );
    }

    chargeItemTitle =
      ((await firstOption.textContent()) ?? "").trim() || "item";
    await firstOption.click();

    const addItemsButton = sheet.getByRole("button", { name: tr("add_items") });
    await expect(addItemsButton).toBeEnabled();
    await addItemsButton.click();
    await expectToast(page, tr("charge_items_added_successfully"));

    await expect(sheet).toBeHidden();
    await expect(noBillable).toBeHidden();
    await expect
      .poll(async () => table.locator("tbody tr").count())
      .toBeGreaterThan(0);
  } else {
    const checkboxLike = table.locator(
      'input[type="checkbox"], [role="checkbox"]',
    );
    const rowsWithCheckbox = table.locator("tr").filter({ has: checkboxLike });
    const checkboxRowCount = await rowsWithCheckbox.count();

    if (checkboxRowCount > 0) {
      // First checkbox row is often a header/select-all; prefer the next one when present.
      const dataRow = rowsWithCheckbox.nth(Math.min(1, checkboxRowCount - 1));
      await expect(dataRow).toBeVisible();

      const rowText = (await dataRow.textContent()) ?? "";
      chargeItemTitle = firstMeaningfulLine(rowText) ?? "";
    } else {
      // Some tables don't expose a checkbox role; fall back to first data row.
      const dataRow = table.getByRole("row").nth(1);
      await expect(dataRow).toBeVisible();
      const rowText = (await dataRow.textContent()) ?? "";
      chargeItemTitle = firstMeaningfulLine(rowText) ?? "";
    }
  }

  const itemRow = chargeItemTitle
    ? table
        .getByRole("row")
        .filter({ hasText: new RegExp(escapeRegex(chargeItemTitle), "i") })
        .first()
    : table.getByRole("row").nth(1);

  await expect(itemRow).toBeVisible();

  const rowCheckbox = itemRow
    .locator('[role="checkbox"], input[type="checkbox"]')
    .first();
  const hasCheckbox = await rowCheckbox.isVisible().catch(() => false);

  if (hasCheckbox) {
    const isChecked =
      (await rowCheckbox.getAttribute("aria-checked").catch(() => null)) ===
      "true";
    if (!isChecked) await rowCheckbox.click();
  } else {
    // Some rows are selectable without an explicit checkbox control.
    await itemRow.click();
  }
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
  accountId = getAccountId();
});

test.describe("Create Invoice (facility billing)", () => {
  test("Navigate Billing → Account List → open fixture account from list", async ({
    page,
  }) => {
    await test.step("Open account list scoped to fixture patient", async () => {
      await openAccountList(page, facilityId, patientId);
    });

    await test.step("Open the setup account from list (match URL to getAccountId)", async () => {
      const table = page.getByRole("table");
      await expect(table).toBeVisible();

      const dataRows = table.getByRole("row").filter({
        has: page.getByRole("button", { name: tr("go_to_account") }),
      });
      await expect(dataRows.first()).toBeVisible();

      const accountPath = `/billing/account/${accountId}`;
      let opened = false;
      const rowCount = await dataRows.count();
      for (let i = 0; i < rowCount; i += 1) {
        await dataRows
          .nth(i)
          .getByRole("button", { name: tr("go_to_account") })
          .click();
        await page.waitForLoadState("networkidle");
        if (page.url().includes(accountPath)) {
          opened = true;
          break;
        }
        await page.goBack();
        await page.waitForLoadState("networkidle");
        await expect(table).toBeVisible();
      }
      expect(opened).toBe(true);
    });

    await test.step("Verify account workspace tabs", async () => {
      await expect(
        page.getByRole("tab", { name: tr("invoices") }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", {
          name: new RegExp(`^${escapeRegex(tr("charge_items"))}(\\s|$)`),
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: tr("payments") }),
      ).toBeVisible();
    });
  });

  test("Create invoice from account and verify success toast", async ({
    page,
  }) => {
    await openAccountShow(page, facilityId, accountId);

    await test.step("Open Create Invoice page", async () => {
      const createInvoiceLink = page.getByRole("link", {
        name: tr("create_invoice"),
      });
      const hasLink = await createInvoiceLink.isVisible().catch(() => false);
      if (hasLink) {
        await createInvoiceLink.click();
      } else {
        await page.getByRole("button", { name: tr("create_invoice") }).click();
      }
      await expect(
        page.getByText(tr("create_invoice"), { exact: true }),
      ).toBeVisible();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Ensure at least one charge item is selected", async () => {
      await ensureAtLeastOneChargeItemSelected(page, facilityId, accountId);
    });

    await test.step("Fill optional fields", async () => {
      const toggleOptional = page.getByRole("button", {
        name: new RegExp(
          `^${escapeRegex(tr("payment_terms_and_note"))}(\\s|$)`,
        ),
      });

      const hasToggle = await toggleOptional.isVisible().catch(() => false);
      if (!hasToggle) return;

      await toggleOptional.click();

      const paymentTerms = page.getByPlaceholder(
        tr("payment_terms_placeholder"),
      );
      if (await paymentTerms.isVisible().catch(() => false))
        await paymentTerms.fill(`PT-${faker.string.alphanumeric(8)}`);

      const invoiceNote = page.getByPlaceholder(tr("invoice_note_placeholder"));
      if (await invoiceNote.isVisible().catch(() => false))
        await invoiceNote.fill(faker.lorem.sentence());
    });

    await test.step("Submit invoice and verify success", async () => {
      const table = getCreateInvoiceChargeItemsTable(page);
      await expect(table).toBeVisible();
      const noBillable = table.getByText(tr("no_billable_items"), {
        exact: true,
      });
      await expect(noBillable).toBeHidden();
      await expect
        .poll(async () => table.locator("tbody tr").count())
        .toBeGreaterThan(0);

      const createInvoiceInDialog = page
        .getByRole("dialog")
        .getByRole("button", { name: tr("create_invoice") });
      const createInvoiceButton = createInvoiceInDialog
        .or(page.getByRole("button", { name: tr("create_invoice") }))
        .first();

      await expect(createInvoiceButton).toBeVisible();
      await expect(createInvoiceButton).toBeEnabled();
      await createInvoiceButton.click();
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
        await page.getByRole("tab", { name: tr("invoices") }).click();
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
