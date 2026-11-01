import { useId } from "react";
import { useTranslation } from "react-i18next";

import { TAG_EXPIRY_OFFSET_UNITS } from "@/components/Tags/tagExpiry";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { TagExpiryOffset } from "@/types/emr/tagConfig/tagConfig";

interface TagExpiryOffsetInputProps {
  value: TagExpiryOffset;
  onChange: (value: TagExpiryOffset) => void;
  disabled?: boolean;
}

export function TagExpiryOffsetInput({
  value,
  onChange,
  disabled,
}: TagExpiryOffsetInputProps) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <div className="grid grid-cols-3 gap-2">
      {TAG_EXPIRY_OFFSET_UNITS.map((unit) => (
        <Field key={unit}>
          <FieldLabel htmlFor={`${id}-${unit}`}>
            {t(`expiry_offset_unit_${unit}`)}
          </FieldLabel>
          <Input
            id={`${id}-${unit}`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="0"
            value={value[unit] || ""}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              onChange({
                ...value,
                [unit]: Number.isNaN(parsed) ? 0 : Math.max(0, parsed),
              });
            }}
            disabled={disabled}
          />
        </Field>
      ))}
    </div>
  );
}
