import type Decimal from "decimal.js";

import { numberFormatter } from "@/components/ui/monetary-display";

import { round, toNumber } from "@/Utils/decimal";

/** An amount with the currency symbol, as `<MonetaryDisplay>` shows it. */
export function formatAmount(
  amount: string | number | Decimal | null | undefined,
) {
  return numberFormatter.format(toNumber(round(amount ?? 0)));
}
