import mutate from "@/Utils/request/mutate";
import { InvoiceCreate, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

export async function createAndIssueInvoice(
  facilityId: string,
  data: Pick<InvoiceCreate, "account" | "charge_items">,
) {
  const invoice = await mutate(invoiceApi.createInvoice, {
    pathParams: { facilityId },
  })({ ...data, status: InvoiceStatus.draft });

  return mutate(invoiceApi.updateInvoice, {
    pathParams: { facilityId, invoiceId: invoice.id },
  })({
    ...data,
    status: InvoiceStatus.issued,
    issue_date: new Date().toISOString(),
  });
}
