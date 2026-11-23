import { expect, test, type Page } from "@playwright/test";

import { seedInvoiceViaApi } from "tests/helper/billing";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The invoice page reads `sourceUrl` (the page that opened it) with a typed
// search schema (`invoiceShowSearch` in `src/lib/router/search/billing.ts`),
// and keeps its query string when the payment sheet opens and closes.

/** Opens the issued invoice `invoiceId`; returns its path. */
async function openIssuedInvoice(
  page: Page,
  facilityId: string,
  invoiceId: string,
) {
  await page.goto(`/facility/${facilityId}/billing/invoices/${invoiceId}`);
  await expect(page).toHaveURL(/\/billing\/invoices\/[0-9a-f-]+$/);
  return new URL(page.url()).pathname;
}

test.describe("Invoice page search params", () => {
  let facilityId: string;
  let invoiceId: string;

  test.beforeAll(async () => {
    facilityId = getFacilityId();
    // An issued invoice of its own instead of the first one in the facility.
    ({ invoiceId } = await seedInvoiceViaApi({
      facilityId,
      issue: true,
      namePrefix: "Invoice Page",
    }));
  });

  const sourcePath = () => `/facility/${facilityId}/billing/invoices`;

  test(
    "links back to the page in sourceUrl",
    { tag: ["@atomic", "@cap:billing.invoice.navigate"] },
    async ({ page }) => {
      const invoicePath = await openIssuedInvoice(page, facilityId, invoiceId);

      await page.goto(
        `${invoicePath}?${new URLSearchParams({ sourceUrl: sourcePath() })}`,
      );
      await page
        .getByRole("alert")
        .getByRole("button", { name: /^back to/i })
        .click();

      await expect(page).toHaveURL(new RegExp(`${sourcePath()}$`));
    },
  );

  test(
    "offers no way back to a source URL on another origin",
    { tag: ["@atomic", "@cap:billing.invoice.navigate"] },
    async ({ page }) => {
      const invoicePath = await openIssuedInvoice(page, facilityId, invoiceId);

      await page.goto(
        `${invoicePath}?${new URLSearchParams({ sourceUrl: "https://example.com/" })}`,
      );

      // The schema reads the other origin as no source URL.
      await expect(
        page.getByRole("button", { name: /^record payment/i }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /^back to/i })).toHaveCount(
        0,
      );
    },
  );

  test(
    "keeps sourceUrl when the payment sheet opens and closes",
    { tag: ["@atomic", "@cap:billing.invoice.navigate"] },
    async ({ page }) => {
      const invoicePath = await openIssuedInvoice(page, facilityId, invoiceId);
      const sourceUrlParam = new URLSearchParams({
        sourceUrl: sourcePath(),
      }).toString();
      await page.goto(`${invoicePath}?${sourceUrlParam}`);

      await test.step("Open the payment sheet", async () => {
        await page.getByRole("button", { name: /^record payment/i }).click();
        await expect(
          page.getByRole("heading", { name: "Collect Payment" }),
        ).toBeVisible();
        await expect(page).toHaveURL(`${invoicePath}/pay?${sourceUrlParam}`);
      });

      await test.step("Close the payment sheet", async () => {
        await page
          .getByRole("dialog")
          .getByRole("button", { name: /close/i })
          .click();
        await expect(
          page.getByRole("heading", { name: "Collect Payment" }),
        ).toBeHidden();
        await expect(page).toHaveURL(`${invoicePath}?${sourceUrlParam}`);
      });
    },
  );
});
