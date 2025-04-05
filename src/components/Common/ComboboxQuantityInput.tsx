"use client";

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

import {
  DOSAGE_UNITS_CODES,
  DosageQuantity,
} from "@/types/emr/medicationRequest";

interface Props {
  quantity?: DosageQuantity;
  onChange: (quantity: DosageQuantity) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ComboboxQuantityInput({
  quantity,
  onChange,
  disabled,
  placeholder = "Enter a number...",
  autoFocus,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(
    quantity?.value.toString() || "",
  );
  const [selectedUnit, setSelectedUnit] = React.useState(quantity?.unit);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  const showDropdown = /^\d+$/.test(inputValue);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setInputValue(value);
      setOpen(true);
      setActiveIndex(0);
      if (value && selectedUnit) {
        onChange({
          value: parseInt(value, 10),
          unit: selectedUnit,
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || !showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) =>
        prev === -1
          ? 0
          : prev < DOSAGE_UNITS_CODES.length - 1
            ? prev + 1
            : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < DOSAGE_UNITS_CODES.length) {
        const unit = DOSAGE_UNITS_CODES[activeIndex];
        setSelectedUnit(unit);
        setOpen(false);
        setActiveIndex(-1);
        onChange({ value: parseInt(inputValue, 10), unit });
      }
    }
  };

  React.useEffect(() => {
    setInputValue(quantity?.value.toString() || "");
  }, [quantity?.value]);

  React.useEffect(() => {
    setSelectedUnit(quantity?.unit);
  }, [quantity?.unit]);

  return (
    <div className="relative flex w-full lg:max-w-[200px] flex-col gap-1">
      <Popover open={!disabled && open && showDropdown} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn("w-full text-sm", selectedUnit && "pr-16")}
              disabled={disabled}
              autoFocus={autoFocus}
            />
            {selectedUnit && (
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
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
                {DOSAGE_UNITS_CODES.map((unit, index) => (
                  <CommandItem
                    key={unit.code}
                    value={unit.code}
                    onSelect={() => {
                      setSelectedUnit(unit);
                      setOpen(false);
                      setActiveIndex(-1);
                      inputRef.current?.focus();
                      onChange({ value: parseInt(inputValue, 10), unit });
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
