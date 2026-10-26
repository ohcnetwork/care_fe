import * as React from "react";
import { useTranslation } from "react-i18next";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { InputGroupAddon, InputGroupText } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { Code } from "@/types/base/code/code";
import {
  DOSAGE_UNITS_CODES,
  DosageQuantity,
} from "@/types/emr/medicationRequest/medicationRequest";
import { QuantitySpec } from "@/types/emr/specimenDefinition/specimenDefinition";

interface Props {
  quantity?: DosageQuantity | QuantitySpec | null;
  onChange: (quantity: DosageQuantity | QuantitySpec | null) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  units?: readonly Code[];
  className?: string;
}

export function ComboboxQuantityInput({
  quantity,
  onChange,
  disabled,
  placeholder,
  autoFocus,
  units = DOSAGE_UNITS_CODES,
  className,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(quantity?.value || "");
  const [selectedUnit, setSelectedUnit] = React.useState(quantity?.unit);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const showDropdown = /^\d*\.?\d*$/.test(inputValue) && inputValue !== ".";

  const handleInputChange = (value: string) => {
    if (disabled || (value !== "" && !/^\d*\.?\d*$/.test(value))) return;
    setInputValue(value);
    setOpen(true);
    if (value === "") onChange(null);
    else if (value !== ".") onChange({ value, unit: selectedUnit || units[0] });
  };

  React.useEffect(() => {
    setInputValue(quantity?.value?.toString() || "");
  }, [quantity?.value]);
  React.useEffect(() => setSelectedUnit(quantity?.unit), [quantity?.unit]);

  return (
    <div className={cn("w-full", className)}>
      <Combobox<string>
        items={units.map((unit) => unit.code)}
        value={selectedUnit?.code ?? null}
        inputValue={inputValue}
        open={open && showDropdown}
        onOpenChange={setOpen}
        disabled={disabled}
        filter={null}
        autoHighlight
        onInputValueChange={(value, details) => {
          if (
            details.reason === "input-change" ||
            details.reason === "input-clear"
          )
            handleInputChange(value);
        }}
        onValueChange={(code) => {
          const unit = units.find((unit) => unit.code === code);
          if (!unit) return;
          setSelectedUnit(unit);
          setOpen(false);
          inputRef.current?.focus();
          if (inputValue.trim() !== "") onChange({ value: inputValue, unit });
        }}
      >
        <ComboboxInput
          ref={inputRef}
          inputMode="decimal"
          pattern="\d*\.?\d*"
          placeholder={placeholder || t("enter_a_number")}
          disabled={disabled}
          autoFocus={autoFocus}
          showTrigger={false}
          className="w-full"
        >
          {selectedUnit && (
            <InputGroupAddon align="inline-end">
              <InputGroupText>{selectedUnit.display}</InputGroupText>
            </InputGroupAddon>
          )}
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxEmpty>{t("no_results_found")}</ComboboxEmpty>
          <ComboboxList>
            {(code: string) => (
              <ComboboxItem key={code} value={code}>
                {inputValue} {units.find((unit) => unit.code === code)?.display}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export default ComboboxQuantityInput;
