import careConfig from "@careConfig";
import { addMonths, endOfMonth } from "date-fns";

/**
 * Gets the expiration date threshold for dispensing products. Products with an
 * expiration date after this threshold is only allowed to be dispensed.
 */
export const getExpirationDateThresholdForDispensing = () => {
  const offset = careConfig.inventory.expiryMonthOffset;
  let date = new Date();

  if (offset) {
    date = addMonths(date, offset);
  }

  return endOfMonth(date);
};
