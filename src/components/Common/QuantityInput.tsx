import { t } from "i18next";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuantityValue<TUnit extends string> {
  value?: number;
  unit?: TUnit;
}

interface Props<TUnit extends string> {
  quantity?: QuantityValue<TUnit> | null;
  onChange: (quantity: QuantityValue<TUnit>) => void;
  units: readonly TUnit[];
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

const QuantityInput = <TUnit extends string>({
  units,
  quantity = { value: undefined, unit: units[0] },
  onChange,
  disabled,
  placeholder,
  autoFocus,
}: Props<TUnit>) => {
  const handleChange = (update: Partial<QuantityValue<TUnit>>) => {
    onChange({ ...quantity, ...update });
  };

  return (
    <div className="relative group flex shadow-sm border-gray-200 focus-within:border-primary-500 rounded-md focus-within:ring-1 focus-within:ring-primary-500">
      <Input
        disabled={disabled}
        type="number"
        className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0 focus:border-transparent"
        placeholder={placeholder}
        value={quantity?.value}
        onChange={(e) =>
          handleChange({
            value: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        autoFocus={autoFocus}
      />
      <Select
        disabled={disabled}
        value={quantity?.unit}
        onValueChange={(value) => handleChange({ unit: value as TUnit })}
        defaultValue={quantity?.unit}
      >
        <SelectTrigger className="max-w-min rounded-l-none focus:ring-0 focus:ring-offset-0 border-l-0 focus:border-transparent bg-gray-50">
          <SelectValue placeholder="Unit" />
        </SelectTrigger>
        <SelectContent>
          {units.map((unit) => (
            <SelectItem key={unit} value={unit}>
              {t(`unit_${unit}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

QuantityInput.displayName = "QuantityInput";

export { QuantityInput };
