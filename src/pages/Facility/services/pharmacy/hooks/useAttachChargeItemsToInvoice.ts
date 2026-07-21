import { useMutation } from "@tanstack/react-query";

import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

import mutate from "@/Utils/request/mutate";

interface Params {
  facilityId: string;
  /** Account the invoice belongs to; required to create a new draft invoice. */
  accountId?: string;
  /**
   * Draft invoice to append the charge items to. When unset, a new draft
   * invoice is created for {@link Params.accountId} instead.
   */
  draftInvoiceId?: string;
}

/**
 * Settles newly created charge items into an invoice.
 * - With a draft invoice, the charge items are appended to it.
 * - Without a draft invoice, a new draft invoice is created for the account
 *   carrying the charge items.
 *
 * Returns an async settler; it is a no-op when there are no charge items, or
 * when neither a draft invoice nor an account is available.
 */
export function useAttachChargeItemsToInvoice({
  facilityId,
  accountId,
  draftInvoiceId,
}: Params) {
  const { mutateAsync: attachItemsToInvoice } = useMutation({
    mutationFn: mutate(chargeItemApi.addChargeItemsToInvoice, {
      pathParams: { facilityId, invoiceId: draftInvoiceId ?? "" },
    }),
  });

  const { mutateAsync: createInvoice } = useMutation({
    mutationFn: mutate(invoiceApi.createInvoice, {
      pathParams: { facilityId },
    }),
  });

  return async (chargeItemIds: string[]) => {
    if (chargeItemIds.length === 0) return;

    if (draftInvoiceId) {
      await attachItemsToInvoice({ charge_items: chargeItemIds });
    } else if (accountId) {
      await createInvoice({
        status: InvoiceStatus.draft,
        account: accountId,
        charge_items: chargeItemIds,
      });
    }
  };
}
