import { ComponentProps, useState } from "react";

import { Input } from "@/components/ui/input";

import { ACCOUNTING_PRECISION, round } from "@/Utils/decimal";

interface DeliveryMonetaryInputProps extends Omit<
  ComponentProps<typeof Input>,
  "type" | "min" | "step" | "value" | "onChange" | "onFocus" | "onBlur"
> {
  value?: string | null;
  onValueChange?: (value: string) => void;
}

const amountPattern = new RegExp(
  `^\\d*(?:\\.\\d{0,${ACCOUNTING_PRECISION}})?$`,
);

export function DeliveryMonetaryInput({
  value,
  onValueChange,
  disabled,
  ...props
}: DeliveryMonetaryInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const displayValue = value == null || value === "" ? "" : round(value);

  return (
    <Input
      {...props}
      type="number"
      inputMode="decimal"
      min={0}
      step={10 ** -ACCOUNTING_PRECISION}
      disabled={disabled}
      value={disabled ? displayValue : (draft ?? displayValue)}
      onFocus={() => setDraft(displayValue)}
      onBlur={() => setDraft(null)}
      onChange={(event) => {
        const nextValue = event.target.value;
        if (amountPattern.test(nextValue)) {
          setDraft(nextValue);
          onValueChange?.(nextValue);
        }
      }}
    />
  );
}
