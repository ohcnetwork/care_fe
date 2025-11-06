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
});

// Helper function to get currency symbol
export const getCurrencySymbol = () => CURRENCY_SYMBOL;

export function mapPriceComponent<T extends MonetaryComponent>(data: T): T {
  if (!data) return data;

  return {
    ...data,
    amount: data.amount != null ? String(data.amount) : undefined,
  } as T;
}

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
          ? numberFormatterWithoutCurrency.format(Number(amount)).toString()
          : numberFormatter.format(Number(amount)).toString())}
      {factor != null && `${factor}%`}
    </data>
  );
}

function MonetaryAmountInput(props: React.ComponentProps<typeof Input>) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty value, numbers with up to 2 decimal places
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      props.onChange?.(e);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-lg font-medium">{CURRENCY_SYMBOL}</span>
      <Input
        type="text"
        inputMode="decimal"
        pattern="^\d*\.?\d{0,2}$"
        placeholder="0.00"
        data-care-input="monetary-amount"
        {...props}
        onChange={handleChange}
        className={cn("text-right", props.className)}
      />
    </div>
  );
}

export { MonetaryAmountInput, MonetaryDisplay };
