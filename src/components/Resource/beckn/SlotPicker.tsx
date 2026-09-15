import { useTranslation } from "react-i18next";

import { BecknSlot } from "@/types/beckn/becknModels";

interface SlotPickerProps {
  slots: BecknSlot[];
  value?: string;
  onChange: (slot: BecknSlot, key: string) => void;
  disabled?: boolean;
}

/** Selectable appointment slots from an `on_select` contract (appointment flow). */
export default function SlotPicker({
  slots,
  value,
  onChange,
  disabled,
}: SlotPickerProps) {
  const { t } = useTranslation();

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500">{t("beckn_no_slots_returned")}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {slots.map((slot, index) => {
        const key = slot.id ?? String(index);
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(slot, key)}
            className={[
              "rounded-md border px-3 py-2 text-left text-sm transition-colors",
              active
                ? "border-primary-600 bg-primary-50 font-medium"
                : "border-gray-200 hover:bg-gray-50",
              disabled ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
