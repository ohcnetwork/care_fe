import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  endOfDay,
  format,
  isWithinInterval,
  parse,
  startOfDay,
  subDays,
} from "date-fns";

import {
  applyCustomDateFilterRange,
  applyDateFilterPreset,
  applyFacilityUserMineFilter,
  clearAllMultiFilters,
  clearSelectedMultiFilter,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const DATE_CELL_FORMAT = "dd/MM/yy, hh:mm a";

const getDateQueryParam = (daysAgo: number) =>
  format(subDays(new Date(), daysAgo), "yyyy-MM-dd");

const getDateRangeLabel = (after: string, before: string) => {
  const from = parse(after, "yyyy-MM-dd", new Date());
  const to = parse(before, "yyyy-MM-dd", new Date());
  const fmt = from.getFullYear() !== to.getFullYear() ? "d MMM yy" : "d MMM";
  return `${format(from, fmt)} - ${format(to, fmt)}`;
};

const invoiceRows = (page: Page) =>
  page.locator('[data-slot="table-body"] [data-slot="table-row"]');

const invoiceDateCell = (row: Locator) =>
  row.locator('[data-slot="table-cell"]').nth(1);

async function waitForInvoiceRows(page: Page) {
  await page.locator('[data-slot="table-body"]').waitFor({ state: "visible" });
  await expect(invoiceRows(page).first()).toBeVisible();
}

async function expectInvoiceDatesWithinRange(
  page: Page,
  after: string,
  before: string,
) {
  const rangeStart = startOfDay(parse(after, "yyyy-MM-dd", new Date()));
  const rangeEnd = endOfDay(parse(before, "yyyy-MM-dd", new Date()));
  const count = await invoiceRows(page).count();

  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const cellText = (
      await invoiceDateCell(invoiceRows(page).nth(i)).innerText()
    ).trim();
    const rowDate = parse(cellText, DATE_CELL_FORMAT, new Date());

    expect(
      isWithinInterval(rowDate, { start: rangeStart, end: rangeEnd }),
      `row ${i} date "${cellText}" should be within ${after}..${before}`,
    ).toBeTruthy();
  }
}

test.describe("Invoice List", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/billing/invoices${search ? `?${search}` : ""}`;
  };

  test("should list invoices before any date filter is applied", async ({
    page,
  }) => {
    await page.goto(listUrl());
    await waitForInvoiceRows(page);

    await expect(
      page.getByRole("columnheader", { name: /invoice number/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: /invoice date/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: /status/i }),
    ).toBeVisible();
    await expect(
      invoiceRows(page).first().locator('[data-slot="badge"]').first(),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/created_date_after=/);
    await expect(page).not.toHaveURL(/created_date_before=/);
  });

  test.describe("Date Filter", () => {
    test("should filter invoices by selecting the last 7 days preset", async ({
      page,
    }) => {
      const after = getDateQueryParam(7);
      const before = getDateQueryParam(0);

      await page.goto(listUrl());
      await waitForInvoiceRows(page);
      await applyDateFilterPreset(page, /invoice date/i, /last 7 days/i);

      await expect(page).toHaveURL(new RegExp(`created_date_after=${after}`));
      await expect(page).toHaveURL(new RegExp(`created_date_before=${before}`));
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toContainText(
        /last 7 days/i,
      );
      await waitForInvoiceRows(page);
      await expectInvoiceDatesWithinRange(page, after, before);
    });

    test("should filter invoices by selecting a custom date range", async ({
      page,
    }) => {
      const after = getDateQueryParam(32);
      const before = getDateQueryParam(0);

      await page.goto(listUrl());
      await waitForInvoiceRows(page);
      await applyCustomDateFilterRange(page, /invoice date/i, after, before);

      await expect(page).toHaveURL(new RegExp(`created_date_after=${after}`));
      await expect(page).toHaveURL(new RegExp(`created_date_before=${before}`));
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toBeVisible();
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toContainText(
        /b\/w/i,
      );
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toContainText(
        getDateRangeLabel(after, before),
      );
      await waitForInvoiceRows(page);
      await expectInvoiceDatesWithinRange(page, after, before);
    });

    test("should clear the applied date filter", async ({ page }) => {
      const after = getDateQueryParam(32);
      const before = getDateQueryParam(0);

      await page.goto(listUrl());
      await waitForInvoiceRows(page);
      await applyCustomDateFilterRange(page, /invoice date/i, after, before);

      await expect(page).toHaveURL(new RegExp(`created_date_after=${after}`));
      await expect(page).toHaveURL(new RegExp(`created_date_before=${before}`));
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toBeVisible();

      await clearSelectedMultiFilter(page, /invoice date/i);

      await expect(selectedMultiFilterBar(page, /invoice date/i)).toBeHidden();
      await expect(page).not.toHaveURL(/created_date_after=/);
      await expect(page).not.toHaveURL(/created_date_before=/);
      await waitForInvoiceRows(page);
    });

    test("should clear all applied filters", async ({ page }) => {
      const after = getDateQueryParam(32);
      const before = getDateQueryParam(0);

      await page.goto(listUrl());
      await waitForInvoiceRows(page);
      await applyFacilityUserMineFilter(page, /created by/i);
      await applyCustomDateFilterRange(page, /invoice date/i, after, before);

      await expect(selectedMultiFilterBar(page, /created by/i)).toBeVisible();
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toBeVisible();
      await expect(page).toHaveURL(/created_by=/);
      await expect(page).toHaveURL(new RegExp(`created_date_after=${after}`));
      await expect(page).toHaveURL(new RegExp(`created_date_before=${before}`));

      await clearAllMultiFilters(page);

      await expect(selectedMultiFilterBar(page, /created by/i)).toBeHidden();
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toBeHidden();
      await expect(page).not.toHaveURL(/created_by=/);
      await expect(page).not.toHaveURL(/created_date_after=/);
      await expect(page).not.toHaveURL(/created_date_before=/);
      await waitForInvoiceRows(page);
    });

    test("should restore the date filter from the URL", async ({ page }) => {
      const after = getDateQueryParam(32);
      const before = getDateQueryParam(0);

      await page.goto(
        listUrl({ created_date_after: after, created_date_before: before }),
      );
      await waitForInvoiceRows(page);

      await expect(selectedMultiFilterBar(page, /invoice date/i)).toBeVisible();
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toContainText(
        /b\/w/i,
      );
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toContainText(
        getDateRangeLabel(after, before),
      );
      await expectInvoiceDatesWithinRange(page, after, before);
    });

    test("should show an empty state when no invoice falls in the selected range", async ({
      page,
    }) => {
      await page.goto(
        listUrl({
          created_date_after: getDateQueryParam(41),
          created_date_before: getDateQueryParam(40),
        }),
      );

      await expect(page.getByText(/no invoices/i)).toBeVisible();
      await expect(invoiceRows(page)).toHaveCount(0);
    });

    test("should have created-by filter after applying a date filter", async ({
      page,
    }) => {
      const after = getDateQueryParam(32);
      const before = getDateQueryParam(0);

      await page.goto(listUrl());
      await waitForInvoiceRows(page);
      await applyFacilityUserMineFilter(page, /created by/i);

      await applyCustomDateFilterRange(page, /invoice date/i, after, before);

      await expect(selectedMultiFilterBar(page, /created by/i)).toBeVisible();
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toBeVisible();
      await expect(selectedMultiFilterBar(page, /invoice date/i)).toContainText(
        getDateRangeLabel(after, before),
      );
      await expect(page).toHaveURL(/created_by=/);
      await expect(page).toHaveURL(new RegExp(`created_date_after=${after}`));
      await expect(page).toHaveURL(new RegExp(`created_date_before=${before}`));
      await waitForInvoiceRows(page);
      await expectInvoiceDatesWithinRange(page, after, before);
    });
  });
});
