import * as React from "react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

import { MonetaryComponent } from "@/types/base/monetaryComponent/monetaryComponent";

// Currency configuration
export const CURRENCY_CODE = "INR";
export const CURRENCY_SYMBOL = "₹";

export const numberFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: CURRENCY_CODE,
});

export const numberFormatterWithoutCurrency = new Intl.NumberFormat("en-IN", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Helper function to get currency symbol
export const getCurrencySymbol = () => CURRENCY_SYMBOL;

function MonetaryDisplay({
  amount,
  factor,
  fallback,
  hideCurrency = false,
  ...props
}: Pick<MonetaryComponent, "amount" | "factor"> & {
  fallback?: React.ReactNode;
  hideCurrency?: boolean;
} & React.ComponentProps<"data">) {
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
          ? numberFormatterWithoutCurrency.format(amount)
          : numberFormatter.format(amount))}
      {factor != null && `${factor?.toFixed(2)}%`}
    </data>
  );
}

function MonetaryAmountInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-lg font-medium">₹</span>
      <Input
        type="number"
        min={0}
        data-care-input="monetary-amount"
        onWheel={(e) => {
          e.currentTarget.blur();
          e.stopPropagation();
        }}
        {...props}
        className={cn("text-right", props.className)}
      />
    </div>
  );
}

export { MonetaryDisplay, MonetaryAmountInput };
