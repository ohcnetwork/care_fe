import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Common denominations in descending order
const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

interface DenominationInputProps {
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
  disabled?: boolean;
}

export default function DenominationInput({
  value,
  onChange,
  disabled = false,
}: DenominationInputProps) {
  const { t } = useTranslation();

  const handleDenominationChange = (denom: number, count: string) => {
    const numCount = parseInt(count) || 0;
    const newValue = { ...value };

    if (numCount > 0) {
      newValue[denom.toString()] = numCount;
    } else {
      delete newValue[denom.toString()];
    }

    onChange(newValue);
  };

  const calculateTotal = () => {
    return Object.entries(value).reduce((sum, [denom, count]) => {
      return sum + parseInt(denom) * count;
    }, 0);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {t("denomination_breakdown")}
      </Label>
      <div className="grid grid-cols-3 gap-3">
        {DENOMINATIONS.map((denom) => (
          <div key={denom} className="flex items-center gap-2">
            <span className="w-12 text-sm font-medium text-gray-600">
              {t("currency_symbol")}
              {denom}
            </span>
            <span className="text-gray-400">×</span>
            <Input
              type="number"
              min="0"
              value={value[denom.toString()] || ""}
              onChange={(e) => handleDenominationChange(denom, e.target.value)}
              placeholder="0"
              className="h-9 w-20"
              disabled={disabled}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t pt-3">
        <div className="text-right">
          <span className="text-sm text-gray-500">{t("total")}: </span>
          <span className="text-lg font-semibold">
            {t("currency_symbol")}
            {calculateTotal().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
