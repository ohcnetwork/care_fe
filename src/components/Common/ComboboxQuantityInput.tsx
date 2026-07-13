import { Check } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { ComboboxInput } from "@/components/ui/combobox-input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
  placeholder = "Enter a number...",
  autoFocus,
  units = DOSAGE_UNITS_CODES,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(quantity?.value || "");
  const { t } = useTranslation();
  const [selectedUnit, setSelectedUnit] = React.useState(quantity?.unit);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  const showDropdown = /^\d*\.?\d*$/.test(inputValue) && inputValue !== ".";

  const handleInputChange = (value: string) => {
    if (disabled) return;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
      setOpen(true);
      setActiveIndex(0);
      if (value === "") {
        onChange(null);
      }
      if (value && value !== ".") {
        onChange({ value, unit: selectedUnit || units[0] });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || !showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) =>
        prev === -1 ? 0 : prev < units.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < units.length) {
        const unit = units[activeIndex];
        setSelectedUnit(unit);
        setOpen(false);
        setActiveIndex(-1);
        if (inputValue.trim() !== "") {
          onChange({ value: inputValue, unit });
        }
      }
    }
  };

  React.useEffect(() => {
    setInputValue(quantity?.value?.toString() || "");
  }, [quantity?.value]);

  React.useEffect(() => {
    setSelectedUnit(quantity?.unit);
  }, [quantity?.unit]);

  return (
    <div className={cn("relative flex w-full flex-col gap-1", className)}>
      <ComboboxInput
        value={inputValue}
        onValueChange={handleInputChange}
        open={open && showDropdown}
        onOpenChange={setOpen}
        inputRef={inputRef}
        type="text"
        inputMode="decimal"
        pattern="\d*\.?\d*"
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onKeyDown={handleKeyDown}
        className={cn("text-base sm:text-sm", selectedUnit && "pr-16")}
        contentClassName="w-auto min-w-0"
        endAdornment={
          selectedUnit && (
            <div className="absolute right-4 pr-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {selectedUnit.display}
            </div>
          )
        }
      >
        <Command>
          <CommandList>
            <CommandEmpty>{t("no_results_found")}</CommandEmpty>
            <CommandGroup>
              {units.map((unit, index) => (
                <CommandItem
                  key={unit.code}
                  value={unit.code}
                  onSelect={() => {
                    setSelectedUnit(unit);
                    setOpen(false);
                    setActiveIndex(-1);
                    inputRef.current?.focus();
                    if (inputValue.trim() !== "") {
                      onChange({ value: inputValue, unit });
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    activeIndex === index && "bg-gray-100",
                  )}
                >
                  <div>
                    {inputValue} {unit.display}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      selectedUnit?.code === unit.code
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </ComboboxInput>
    </div>
  );
}

export default ComboboxQuantityInput;
