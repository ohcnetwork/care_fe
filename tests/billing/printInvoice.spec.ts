import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

/**
 * Render-smoke coverage for the two invoice print routes that share the
 * extracted `InvoicePrintBody` / `InvoiceBillTo` components (ENG-729):
 *   - single: /facility/:facilityId/billing/invoice/:invoiceId/print
 *   - batch:  /facility/:facilityId/billing/invoices/:invoiceIds/print
 *
 * This is a behavior-preserving refactor, so the spec only asserts that the
 * shared body renders its key structural content (a real item row, the items
 * table headers, and the totals labels) and that the batch page shows the shared
 * bill-to header exactly once with one body per invoice.
 *
 * Preconditions (invoices) are seeded via the billing API, matching the
 * existing billing-setup precedent in tests/facility/billing/accountTransfer.spec.ts.
 *
 * Note: the local fixture backend assigns no invoice number (it has no numbering
 * series configured — invoices come back with number ""), so the smoke asserts
 * the rendered item/table/totals rather than a number string.
 */

interface SeededInvoice {
  id: string;
  itemTitle: string;
}

async function firstChargeItemDefinitionSlug(
  facilityId: string,
): Promise<string> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/charge_item_definition/?status=active&limit=1`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    throw new Error(
      `Failed to list charge item definitions: ${res.status} — ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { results?: { slug?: string }[] };
  const slug = data.results?.[0]?.slug;
  if (!slug) {
    throw new Error("No active charge item definition found in fixtures");
  }
  return slug;
}

async function applyChargeItem(
  facilityId: string,
  accountId: string,
  patientId: string,
  slug: string,
): Promise<{ id: string; title: string }> {
  const applyRes = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/charge_item/apply_charge_item_defs/`,
    {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        requests: [
          {
            charge_item_definition: slug,
            quantity: "1",
            patient: patientId,
            account: accountId,
          },
        ],
      }),
    },
  );
  if (!applyRes.ok) {
    throw new Error(
      `Failed to apply charge item: ${applyRes.status} — ${await applyRes.text()}`,
    );
  }

  // apply_charge_item_defs returns no body, so fetch the just-created item:
  // the newest billable charge item on the account.
  const listRes = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/charge_item/?account=${accountId}&status=billable&ordering=-created_date&limit=1`,
    { headers: getApiHeaders() },
  );
  if (!listRes.ok) {
    throw new Error(
      `Failed to list charge items: ${listRes.status} — ${await listRes.text()}`,
    );
  }
  const data = (await listRes.json()) as {
    results?: { id: string; title: string }[];
  };
  const item = data.results?.[0];
  if (!item?.id) {
    throw new Error("No billable charge item found after applying definition");
  }
  return { id: item.id, title: item.title };
}

async function createInvoice(
  facilityId: string,
  accountId: string,
  chargeItemId: string,
): Promise<{ id: string }> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/invoice/`,
    {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        status: "draft",
        account: accountId,
        charge_items: [chargeItemId],
      }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Failed to create invoice: ${res.status} — ${await res.text()}`,
    );
  }
  const inv = (await res.json()) as { id: string };
  if (!inv?.id) {
    throw new Error("Create invoice did not return an id");
  }
  return inv;
}

async function seedInvoice(
  facilityId: string,
  accountId: string,
  patientId: string,
  slug: string,
): Promise<SeededInvoice> {
  const item = await applyChargeItem(facilityId, accountId, patientId, slug);
  const invoice = await createInvoice(facilityId, accountId, item.id);
  return { id: invoice.id, itemTitle: item.title };
}

test.describe("Invoice print pages render", () => {
  // Billing pages require facility-admin; view through that storage state.
  test.use({ storageState: "tests/.auth/facilityAdmin.json" });

  let facilityId: string;
  let accountId: string;
  let patientId: string;
  let single: SeededInvoice;
  let batch: SeededInvoice[];

  test.beforeAll(async () => {
    facilityId = getFacilityId();
    accountId = getAccountId();
    patientId = getPatientId();

    const slug = await firstChargeItemDefinitionSlug(facilityId);
    single = await seedInvoice(facilityId, accountId, patientId, slug);
    batch = [
      await seedInvoice(facilityId, accountId, patientId, slug),
      await seedInvoice(facilityId, accountId, patientId, slug),
    ];
  });

  test("single-invoice print route renders item row, items table, and totals", async ({
    page,
  }) => {
    await test.step("Navigate to the single-invoice print route", async () => {
      await page.goto(
        `/facility/${facilityId}/billing/invoice/${single.id}/print`,
      );
    });

    await test.step("A real item row renders in the items table", async () => {
      await expect(page.getByText(single.itemTitle).first()).toBeVisible();
    });

    await test.step("Items table headers render", async () => {
      await expect(
        page.getByRole("columnheader", { name: "Item", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Qty" }),
      ).toBeVisible();
    });

    await test.step("Totals labels render", async () => {
      await expect(page.getByText("Net Amount")).toBeVisible();
      await expect(
        page.getByText("Total", { exact: true }).first(),
      ).toBeVisible();
    });
  });

  test("batch print route renders each invoice body with a single bill-to header", async ({
    page,
  }) => {
    const invoiceIds = batch.map((invoice) => invoice.id).join(",");

    await test.step("Navigate to the batch print route", async () => {
      await page.goto(
        `/facility/${facilityId}/billing/invoices/${invoiceIds}/print`,
      );
    });

    await test.step("Each invoice body renders (one item row + totals each)", async () => {
      await expect(page.getByText(batch[0].itemTitle)).toHaveCount(
        batch.length,
      );
      await expect(page.getByText("Net Amount")).toHaveCount(batch.length);
    });

    await test.step("Shared bill-to header appears exactly once", async () => {
      await expect(page.getByText("Bill To:")).toHaveCount(1);
    });
  });
});
