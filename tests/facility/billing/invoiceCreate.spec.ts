import { faker } from "@faker-js/faker";
import {
  createAccount,
  createChargeItem,
  createInvoiceViaUi,
} from "tests/helper/billing";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Invoice create", () => {
  test(
    "should create a draft invoice for the account's billable charge items",
    { tag: ["@atomic", "@cap:billing.invoice.create"] },
    async ({ page, request, facilityId, isolatedPatient }) => {
      const suffix = faker.string.alphanumeric(8);
      const { patientId } = isolatedPatient;
      const account = await createAccount(facilityId, patientId, {
        name: `Invoice account ${suffix}`,
      });
      const titles = [`Invoice item A ${suffix}`, `Invoice item B ${suffix}`];
      for (const title of titles) {
        await createChargeItem(facilityId, {
          patientId,
          accountId: account.id,
          title,
        });
      }

      const { invoiceId } = await createInvoiceViaUi(page, {
        facilityId,
        accountId: account.id,
        chargeItemTitles: titles,
      });

      await test.step("The invoice opens as a draft with both items", async () => {
        await expect(page).toHaveURL(
          new RegExp(`/billing/invoices/${invoiceId}`),
        );
        for (const title of titles) {
          await expect(
            page.getByRole("row").filter({ hasText: title }),
          ).toBeVisible();
        }
        // Only a draft invoice can be issued.
        await expect(
          page.getByRole("button", { name: /^Issue Invoice/ }),
        ).toBeVisible();
      });

      await test.step("Both items are billed on the account", async () => {
        const response = await request.get(
          `${getApiUrl()}/api/v1/facility/${facilityId}/charge_item/?account=${account.id}&status=billed`,
          { headers: getApiHeaders() },
        );
        expect(response.ok(), await response.text()).toBe(true);
        const billed = (await response.json()) as {
          results: { title: string }[];
        };
        expect(billed.results.map((item) => item.title).sort()).toEqual(
          [...titles].sort(),
        );
      });
    },
  );
});
