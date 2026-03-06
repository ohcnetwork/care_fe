import * as React from "react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

import { ACCOUNTING_PRECISION, round, toNumber } from "@/Utils/decimal";
import Decimal from "decimal.js";

// Currency configuration
export const CURRENCY_CODE = "INR";
export const CURRENCY_SYMBOL = "₹";

export const numberFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: CURRENCY_CODE,
});

export const numberFormatterWithoutCurrency = new Intl.NumberFormat("en-IN", {
  style: "decimal",
  minimumFractionDigits: ACCOUNTING_PRECISION,
});

// Helper function to get currency symbol
export const getCurrencySymbol = () => CURRENCY_SYMBOL;

function MonetaryDisplay({
  amount,
  factor,
  fallback,
  hideCurrency = false,
  ...props
}: {
  factor?: string | number | Decimal | null;
  amount?: string | number | Decimal | null;
  fallback?: React.ReactNode;
  hideCurrency?: boolean;
} & React.ComponentProps<"data">) {
  amount &&= round(amount);

  if ((amount ?? factor) == null) {
    return fallback ?? "-";
  }

  return (
    <data
      data-slot="monetary-value"
      data-monetary-type={amount ? "amount" : "factor"}
      data-amount={amount}
      data-factor={factor}
      {...props}
    >
      {amount != null &&
        (hideCurrency
          ? numberFormatterWithoutCurrency.format(toNumber(amount)).toString()
          : numberFormatter.format(toNumber(amount)).toString())}
      {factor != null && `${round(factor)}%`}
    </data>
  );
}

function MonetaryAmountInput({
  hideCurrency = false,
  allowNegative = false,
  ...props
}: React.ComponentProps<typeof Input> & {
  hideCurrency?: boolean;
  allowNegative?: boolean;
}) {
  const pattern = allowNegative
    ? `^-?\\d*\\.?\\d{0,${ACCOUNTING_PRECISION}}$`
    : `^\\d*\\.?\\d{0,${ACCOUNTING_PRECISION}}$`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty value, optional negative sign, numbers with up to ACCOUNTING_PRECISION decimal places
    if (
      value === "" ||
      (allowNegative && value === "-") ||
      new RegExp(pattern).test(value)
    ) {
      props.onChange?.(e);
    }
  };

  return (
    <div className="relative">
      {!hideCurrency && (
        <span className="font-medium absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
          {CURRENCY_SYMBOL}
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        pattern={pattern}
        placeholder={`0.${"0".repeat(ACCOUNTING_PRECISION)}`}
        data-care-input="monetary-amount"
        {...props}
        onChange={handleChange}
        className={cn(
          "font-bold tracking-widest",
          !hideCurrency && "pl-8",
          props.className,
        )}
      />
    </div>
  );
}

export { MonetaryAmountInput, MonetaryDisplay };
