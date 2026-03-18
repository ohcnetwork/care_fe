import { LocationRead } from "@/types/location/location";
import { atomFamily } from "jotai-family";
import { atomWithStorage } from "jotai/utils";

/**
 * Atom family for payment reconcilation location caching per facility
 */
export const paymentReconcilationLocationAtom = atomFamily(
  (facilityId: string) =>
    atomWithStorage<LocationRead | null>(
      `payment_reconcilation_location_cache--${facilityId}`,
      null,
    ),
);

/**
 * Helper to invalidate all payment reconcilation location caches
 */
export const invalidateAllPaymentReconcilationLocationCaches = () => {
  for (const key in localStorage) {
    if (key.startsWith("payment_reconcilation_location_cache--")) {
      localStorage.removeItem(key);
    }
  }
};
