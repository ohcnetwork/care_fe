import { faker } from "@faker-js/faker";
import {
  addChargeItemViaQuickAdd,
  archiveQuickAddPackageViaApi,
  createAccountViaUi,
  createInvoiceViaUi,
  createQuickAddPackageViaApi,
  recordPaymentViaUi,
  type QuickAddPackage,
} from "tests/helper/billing";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    value,
  );

// The Quick Add package of this test, archived afterwards so it leaves the
// picker other specs use (as tests/facility/billing/quickAdd.spec.ts does).
let quickAddPackage: QuickAddPackage | undefined;

test.afterEach(async ({ request }) => {
  if (!quickAddPackage) return;
  await archiveQuickAddPackageViaApi({ request, quickAddPackage });
  quickAddPackage = undefined;
});

test(
  "a patient's billing cycle opens an account, adds a Quick Add charge, invoices it and records a payment against the balance",
  { tag: ["@workflow", "@cap:workflow.billing-cycle"] },
  async ({ page, request, facilityId, isolatedPatient }) => {
    test.slow();

    const { patientId } = isolatedPatient;
    const chargeAmount = 500;
    const paymentAmount = 200;
    quickAddPackage = await createQuickAddPackageViaApi({
      request,
      facilityId,
      label: "Workflow",
      amount: String(chargeAmount),
    });
    const { packageName, definitionTitle } = quickAddPackage;

    // A patient may have only one active, open account, so the account goes
    // on this test's own patient.
    const { accountId } = await createAccountViaUi(page, {
      facilityId,
      patientId,
      name: `Workflow account ${faker.string.alphanumeric(10)}`,
    });

    await addChargeItemViaQuickAdd(page, {
      facilityId,
      accountId,
      packageName,
    });

    await test.step("The charge shows on the account's charge items", async () => {
      await expect(
        page.getByRole("row").filter({ hasText: definitionTitle }),
      ).toBeVisible();
    });

    const { invoiceId } = await createInvoiceViaUi(page, {
      facilityId,
      accountId,
      chargeItemTitles: [definitionTitle],
    });

    await test.step("The invoice opens as a draft billing the charge", async () => {
      await expect(
        page.getByRole("row").filter({ hasText: definitionTitle }),
      ).toBeVisible();
      // Only a draft invoice can be issued.
      await expect(
        page.getByRole("button", { name: /^Issue Invoice/ }),
      ).toBeVisible();
    });

    await recordPaymentViaUi(page, {
      facilityId,
      accountId,
      amount: String(paymentAmount),
      location: "Bio-Chemistry Lab",
    });

    const account =
      await test.step("The account's totals count the invoice and the payment", async () => {
        const response = await request.get(
          `${getApiUrl()}/api/v1/facility/${facilityId}/account/${accountId}/`,
          { headers: getApiHeaders() },
        );
        expect(response.ok(), await response.text()).toBe(true);
        const totals = (await response.json()) as {
          total_gross: string;
          total_paid: string;
          total_balance: string;
        };
        const invoiceResponse = await request.get(
          `${getApiUrl()}/api/v1/facility/${facilityId}/invoice/${invoiceId}/`,
          { headers: getApiHeaders() },
        );
        expect(invoiceResponse.ok(), await invoiceResponse.text()).toBe(true);
        const invoice = (await invoiceResponse.json()) as {
          status: string;
          account: { id: string };
          total_gross: string;
        };
        expect(invoice.status).toBe("draft");
        expect(invoice.account.id).toBe(accountId);

        // Billed gross is the invoiced charge; the payment comes off it.
        const gross = Number(totals.total_gross);
        expect(gross).toBeCloseTo(Number(invoice.total_gross), 2);
        expect(gross).toBeGreaterThan(paymentAmount);
        expect(Number(totals.total_paid)).toBeCloseTo(paymentAmount, 2);
        expect(Number(totals.total_balance)).toBeCloseTo(
          gross - paymentAmount,
          2,
        );
        return { gross, balance: Number(totals.total_balance) };
      });

    await test.step("The account page shows the invoice and the reduced amount due", async () => {
      await page.goto(
        `/facility/${facilityId}/billing/account/${accountId}/invoices`,
      );
      const seeInvoice = page.getByRole("link", { name: "See Invoice" });
      await expect(seeInvoice).toHaveCount(1);
      await expect(seeInvoice).toHaveAttribute(
        "href",
        new RegExp(`/billing/invoices/${invoiceId}$`),
      );
      const invoiceRow = page.getByRole("row").filter({ has: seeInvoice });
      await expect(invoiceRow).toContainText("Draft");
      await expect(invoiceRow).toContainText(formatCurrency(account.gross));

      // The summary cards: "Total Paid" over "Payments Received", and the
      // whole-rupee "Amount Due" over "Pending from Patient".
      await expect(
        page.getByText("Payments Received", { exact: true }).locator(".."),
      ).toContainText(formatCurrency(paymentAmount));
      await expect(
        page.getByText("Pending from Patient", { exact: true }).locator(".."),
      ).toContainText(formatCurrency(Math.round(account.balance)));
    });

    await test.step("The payment is listed on the account's payments", async () => {
      await page.goto(
        `/facility/${facilityId}/billing/account/${accountId}/payments`,
      );
      const paymentRow = page
        .getByRole("row")
        .filter({ hasText: formatCurrency(paymentAmount) });
      await expect(paymentRow).toHaveCount(1);
      await expect(paymentRow).toContainText("Cash");
    });
  },
);
