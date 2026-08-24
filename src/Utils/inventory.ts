import {
  addMonths,
  endOfMonth,
  formatDate,
  isAfter,
  startOfMonth,
} from "date-fns";

import { Badge } from "@/components/ui/badge";
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
 * Gets the expiration date range of products considered "expired" by
 * {@link getExpiryStatus}.
 */
export function getExpiredDateRange() {
  return { to: endOfMonth(new Date()) };
}

/**
 * Gets the expiration date range of products considered "expiring_soon" by
 * {@link getExpiryStatus}, or `null` if no such range exists, i.e. when the
 * expiry restriction is disabled or covers only the current month.
 */
export function getExpiringSoonDateRange() {
  const expiryMonthOffset = careConfig.inventory.expiryMonthOffset;
  if (!expiryMonthOffset) return null;

  const today = new Date();
  return {
    from: startOfMonth(addMonths(today, 1)),
    to: endOfMonth(addMonths(today, expiryMonthOffset)),
  };
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
export function isLotAllowedForDispensing(inventory: InventoryRead) {
  return !isProductRestrictedFromDispensing(inventory.product.expiration_date);
}

/**
 * Gets the badge variant for displaying expiry status
 * @param expirationDate - The expiration date string
 * @returns Badge variant - "destructive" for expired, "yellow" for expiring soon, "green" for valid
 */
export function getExpiryBadgeVariant(
  expirationDate: string | undefined,
): React.ComponentProps<typeof Badge>["variant"] {
  const status = getExpiryStatus(expirationDate);
  if (status === "expired") return "destructive";
  if (status === "expiring_soon") return "yellow";
  return "green";
}

/**
 * Formats the expiry date of a lot
 * @param inventory - The inventory object
 * @returns The formatted expiry date
 */
export function formatLotExpiry(inventory: InventoryRead) {
  return inventory.product.expiration_date
    ? formatDate(inventory.product.expiration_date, "MM/yyyy")
    : "-";
}
