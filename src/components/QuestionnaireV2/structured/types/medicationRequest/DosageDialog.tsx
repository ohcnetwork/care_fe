import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { ComboboxQuantityInput } from "@/components/Common/ComboboxQuantityInput";

import type { DoseRange } from "@/types/emr/medicationRequest/medicationRequest";

export interface DosageDialogProps {
  dosageRange: DoseRange;
  disabled?: boolean;
  onSave: (range: DoseRange) => void;
  onClear: () => void;
}

/**
 * The taper/titrate dose-range editor — start dose → end dose. It takes plain
 * `onSave`/`onClear` callbacks so its identity and internal `localDoseRange`
 * state are independent of the row rendering it.
 */
export function DosageDialog({
  dosageRange,
  disabled,
  onSave,
  onClear,
}: DosageDialogProps) {
  const { t } = useTranslation();
  const [localDoseRange, setLocalDoseRange] = useState<DoseRange>(dosageRange);

  return (
    <div className="flex flex-col gap-3">
      <div className="font-medium text-base">{t("taper_titrate_dosage")}</div>
      <div>
        <Label className="mb-1.5">{t("start_dose")}</Label>
        <ComboboxQuantityInput
          quantity={localDoseRange.low}
          onChange={(value) => {
            if (value) {
              setLocalDoseRange((prev) => ({
                ...prev,
                low: value,
                high: { ...prev.high, unit: value.unit || prev.high.unit },
              }));
            }
          }}
          disabled={disabled}
          className="lg:max-w-[200px]"
        />
      </div>
      <div>
        <Label className="mb-1.5">{t("end_dose")}</Label>
        <ComboboxQuantityInput
          quantity={localDoseRange.high}
          onChange={(value) => {
            if (value) {
              setLocalDoseRange((prev) => ({
                ...prev,
                high: value,
                low: { ...prev.low, unit: value.unit || prev.low.unit },
              }));
            }
          }}
          disabled={disabled || !localDoseRange.low.value}
          className="lg:max-w-[200px]"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClear}>
          {t("clear")}
        </Button>
        <Button
          onClick={() => onSave(localDoseRange)}
          disabled={
            disabled ||
            !localDoseRange.low.value ||
            !localDoseRange.high.value ||
            !localDoseRange.low.unit ||
            !localDoseRange.high.unit
          }
        >
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
