"use client";

import { t } from "i18next";
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

interface Props<TUnit extends string> {
  quantity?: QuantityValue<TUnit> | null;
  onChange: (quantity: QuantityValue<TUnit>) => void;
  units: readonly TUnit[];
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

interface QuantityValue<TUnit extends string> {
  value?: number;
  unit?: TUnit;
}

export function ComboboxQuantityInput<TUnit extends string>({
  quantity = { value: undefined, unit: undefined },
  onChange,
  units,
  disabled,
  placeholder = "Enter a number...",
  autoFocus,
}: Props<TUnit>) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(
    quantity?.value?.toString() || "",
  );
  const [selectedUnit, setSelectedUnit] = React.useState<TUnit | undefined>(
    quantity?.unit,
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  const showDropdown = /^\d+$/.test(inputValue);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setInputValue(value);
      setOpen(true);
      setSelectedUnit(undefined);
      setActiveIndex(0);
      onChange({
        value: value ? parseInt(value, 10) : undefined,
        unit: selectedUnit,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

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
        onChange({ value: parseInt(inputValue, 10), unit });
      }
    }
  };

  React.useEffect(() => {
    if (quantity?.value !== undefined) {
      setInputValue(quantity.value.toString());
    }
    if (quantity?.unit !== undefined) {
      setSelectedUnit(quantity.unit);
    }
  }, [quantity]);

  return (
    <div className="relative flex w-full lg:max-w-[200px] flex-col gap-1">
      <Popover open={open && showDropdown} onOpenChange={setOpen}>
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
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {t(`unit_${selectedUnit}`)}
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
                    key={unit}
                    value={unit}
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
                      {inputValue} {t(`unit_${unit}`)}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedUnit === unit ? "opacity-100" : "opacity-0",
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
