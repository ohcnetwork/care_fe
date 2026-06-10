import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";

/**
 * Extracts unique invoices from a list of dispenses, based on the
 * `charge_item.paid_invoice` field embedded in each dispense. This avoids
 * the need for additional fetches to gather invoice metadata when rendering
 * dispense-related billing information.
 *
 * @param dispenses List of medication dispenses to extract invoices from
 * @returns Array of unique invoices referenced by the input dispenses
 */
export function extractInvoicesFromDispenses<T extends MedicationDispenseRead>(
  dispenses: T[],
) {
  const map = new Map<string, NonNullable<T["charge_item"]["paid_invoice"]>>();
  dispenses.forEach((dispense) => {
    const invoice = dispense.charge_item?.paid_invoice;
    if (invoice) {
      map.set(invoice.id, invoice);
    }
  });
  return Array.from(map.values());
}
