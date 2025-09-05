import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [inputValue, setInputValue] = React.useState(
    quantity?.value?.toString() || "",
  );
  const [selectedUnit, setSelectedUnit] = React.useState(quantity?.unit);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  const showDropdown = /^\d*\.?\d*$/.test(inputValue) && inputValue !== ".";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
      setOpen(true);
      setActiveIndex(0);
      if (value === "") {
        onChange(null);
      }
      if (value && value !== ".") {
        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
          onChange({ value: parsedValue, unit: selectedUnit || units[0] });
        }
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
        const parsedValue = parseFloat(inputValue);
        if (!isNaN(parsedValue) && inputValue.trim() !== "") {
          onChange({ value: parsedValue, unit });
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
      <Popover open={!disabled && open && showDropdown} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              pattern="\d*\.?\d*"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn("w-full text-sm", selectedUnit && "pr-16")}
              disabled={disabled}
              autoFocus={autoFocus}
            />
            {selectedUnit && (
              <div
                className={cn(
                  "absolute right-4 pr-2 top-1/2 -translate-y-1/2 text-sm text-gray-500",
                )}
              >
                {selectedUnit.display}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <Command>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
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
                      const parsedValue = parseFloat(inputValue);
                      if (!isNaN(parsedValue) && inputValue.trim() !== "") {
                        onChange({ value: parsedValue, unit });
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
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ComboboxQuantityInput;
