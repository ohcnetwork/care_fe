import { addMonths, endOfMonth, isBefore, startOfMonth } from "date-fns";

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
  const currentMonthStart = startOfMonth(new Date());
  const expiryMonthOffset = careConfig.inventory.expiryMonthOffset;

  // Check if expired (before current month start)
  if (isBefore(expiryDate, currentMonthStart)) return "expired";

  // Check if expiring soon (within the configured month offset)
  if (expiryMonthOffset !== null) {
    const referenceMonthEnd = endOfMonth(
      addMonths(new Date(), expiryMonthOffset),
    );
    if (isBefore(expiryDate, referenceMonthEnd)) return "expiring_soon";
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
