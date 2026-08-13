import { addMonths, endOfMonth, isAfter, startOfDay } from "date-fns";

import { InventoryRead } from "@/types/inventory/product/inventory";
import careConfig from "@careConfig";

export type ExpiryStatus = "expired" | "expiring_soon" | "valid";

/**
 * Gets the expiry status of a product based on its expiration date
 * @param expirationDate - The expiration date string
 * @returns ExpiryStatus - "expired", "expiring_soon", or "valid"
 */
export function getExpiryStatus(
  expirationDate: string | undefined,
): ExpiryStatus {
  if (!expirationDate) return "valid";

  const expiryDate = new Date(expirationDate);
  const today = new Date();
  const currentMonthEnd = endOfMonth(today);
  const expiryMonthOffset = careConfig.inventory.expiryMonthOffset;

  // Check if expired (before current month end)
  if (!isAfter(expiryDate, currentMonthEnd)) return "expired";

  // Check if expiring soon (within the configured month offset)
  if (expiryMonthOffset !== null) {
    const referenceMonthEnd = endOfMonth(addMonths(today, expiryMonthOffset));
    if (!isAfter(expiryDate, referenceMonthEnd)) return "expiring_soon";
  }

  return "valid";
}

/**
 * Checks if a product is restricted based on its expiration date
 * (i.e., expired or expiring soon)
 * @param expirationDate - The expiration date string
 * @returns boolean - true if the product is expired or expiring soon
 */
export function isProductRestrictedFromDispensing(
  expirationDate: string | undefined,
): boolean {
  const status = getExpiryStatus(expirationDate);
  return status === "expired" || status === "expiring_soon";
}

/**
 * Checks if a lot is valid for selection (not expired, not expiring soon)
 * @param expirationDate - The expiration date string
 * @returns boolean - true if the lot is valid for selection
 */
export function isLotAllowedForDispensing(
  expirationDate: string | undefined,
): boolean {
  return !isProductRestrictedFromDispensing(expirationDate);
}

/**
 * Gets the badge variant for displaying expiry status
 * @param expirationDate - The expiration date string
 * @returns Badge variant - "destructive" for expired, "yellow" for expiring soon, "primary" for valid
 */
export function getExpiryBadgeVariant(
  expirationDate: string | undefined,
): "destructive" | "yellow" | "primary" {
  const status = getExpiryStatus(expirationDate);
  if (status === "expired") return "destructive";
  if (status === "expiring_soon") return "yellow";
  return "primary";
}

/**
 * Sorts inventory lots FEFO (earliest expiry first). Genuinely expired lots
 * (per `getExpiryStatus`) always sort last, since they're already blocked
 * from dispensing. Lots with no/unparseable expiration date are treated as
 * not-expired (matching `isProductRestrictedFromDispensing`), so they sort
 * after all dated non-expired lots but ahead of expired ones. Stable sort,
 * so ties keep their existing (FIFO) relative order.
 * @param inventories - The inventory lots to sort
 * @returns A new array sorted FEFO, with expired lots pushed to the bottom
 */
export function sortInventoriesFefo(
  inventories: InventoryRead[],
): InventoryRead[] {
  return inventories
    .map((inv) => {
      const expiry = inv.product.expiration_date;
      // Compare calendar date only; time-of-day is incidental to data entry.
      const expiryDay = expiry ? startOfDay(new Date(expiry)).getTime() : NaN;
      return {
        inv,
        expired: getExpiryStatus(expiry) === "expired",
        expiryDay: Number.isNaN(expiryDay) ? Infinity : expiryDay,
      };
    })
    .sort((a, b) => {
      if (a.expired !== b.expired) return a.expired ? 1 : -1;
      if (a.expiryDay === b.expiryDay) return 0;
      return a.expiryDay < b.expiryDay ? -1 : 1;
    })
    .map(({ inv }) => inv);
}
