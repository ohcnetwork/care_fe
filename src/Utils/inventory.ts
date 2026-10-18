import {
  addMonths,
  endOfMonth,
  formatDate,
  isAfter,
  isValid,
  parseISO,
  startOfMonth,
} from "date-fns";

import { Badge } from "@/components/ui/badge";
import { InventoryRead } from "@/types/inventory/product/inventory";
import careConfig from "@careConfig";

export type ExpiryStatus = "expired" | "expiring_soon" | "valid";

/**
 * Recover the product expiry's calendar date in the backend timezone.
 * Date-only and timezone-less ISO values already use that calendar.
 */
export function getProductExpiryDate(value?: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return "";

  const date = parseISO(value);
  if (!isValid(date)) return "";

  if (!/[Z+-]/i.test(value.slice(10))) return value.slice(0, 10);

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: careConfig.inventory.expiryTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    return year && month && day
      ? `${year.padStart(4, "0")}-${month}-${day}`
      : "";
  } catch {
    return "";
  }
}

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
 * Gets the expiration date range of products considered "expiring_soon"
 */
export function getExpiringSoonDateRange(expiryMonthOffset: number) {
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
