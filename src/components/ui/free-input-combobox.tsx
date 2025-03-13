"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ComboboxOption = {
  value: string;
  label: string;
};

interface FreeInputComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  popoverClassName?: string;
}

export function FreeInputCombobox({
  options,
  value,
  onChange,
  placeholder,
  emptyMessage,
  className,
  popoverClassName,
}: FreeInputComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || "");

  // Find the matching option for the current value
  const selectedOption = options.find((option) => option.value === value);

  // Update the input value when the value prop changes
  React.useEffect(() => {
    if (value) {
      setInputValue(selectedOption?.label || value);
    } else {
      setInputValue("");
    }
  }, [value, selectedOption]);

  const handleInputChange = (newInput: string) => {
    setInputValue(newInput);

    // If the input matches an option exactly, select it
    const matchingOption = options.find(
      (option) => option.label.toLowerCase() === newInput.toLowerCase(),
    );

    if (matchingOption) {
      onChange(matchingOption.value);
    } else {
      // Otherwise, use the input value directly
      onChange(newInput);
    }
  };

  const handleSelect = (currentValue: string) => {
    const selectedOption = options.find(
      (option) => option.value === currentValue,
    );

    if (selectedOption) {
      setInputValue(selectedOption.label);
      onChange(currentValue);
    }

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">{inputValue || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[200px] p-0", popoverClassName)}>
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
