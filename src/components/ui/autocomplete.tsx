import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDrawer,
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

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";

interface AutoCompleteOption {
  label: string;
  value: string;
}

interface AutocompleteProps {
  options: AutoCompleteOption[];
  isLoading?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  inputPlaceholder?: string;
  noOptionsMessage?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  popoverClassName?: string;
  freeInput?: boolean;
  "data-cy"?: string;
}

export default function Autocomplete({
  options,
  isLoading = false,
  value,
  onChange,
  onSearch,
  placeholder = "Select...",
  inputPlaceholder = "Search option...",
  noOptionsMessage = "No options found",
  disabled,
  align = "center",
  className,
  popoverClassName,
  freeInput = false,
  "data-cy": dataCy,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  // Maintain an internal state for the input text when freeInput is enabled.
  // TODO : Find a better way to handle this, maybe as a seperate component
  const [inputValue, setInputValue] = React.useState(value);

  // Find a matching option from the options list (for non freeInput or when value matches an option)
  const selectedOption = options.find((option) => option.value === value);

  // Sync the inputValue with value prop changes.
  React.useEffect(() => {
    const selected = options.find((option) => option.value === value);
    if (value) {
      setInputValue(selected ? selected.label : value);
    } else {
      setInputValue("");
    }
  }, [value, options]);

  // Determine what text to display on the button.
  const displayText = freeInput
    ? inputValue || placeholder
    : selectedOption
      ? selectedOption.label
      : placeholder;

  // Handle changes in the CommandInput.
  const handleInputChange = (newValue: string) => {
    if (freeInput) {
      setInputValue(newValue);
      // If the new text exactly matches an option (case-insensitive), select that option.
      const matchingOption = options.find(
        (option) => option.label.toLowerCase() === newValue.toLowerCase(),
      );
      if (matchingOption) {
        onChange(matchingOption.value);
      } else {
        onChange(newValue);
      }
    } else {
      if (onSearch) {
        onSearch(newValue);
      }
    }
  };

  const commandContent = (
    <>
      <CommandInput
        placeholder={inputPlaceholder}
        disabled={disabled}
        onValueChange={handleInputChange}
        // Control the input when freeInput is true.
        {...(freeInput ? { value: inputValue } : {})}
        className="outline-none border-none ring-0 shadow-none"
        autoFocus
      />
      <CommandList>
        {isLoading ? (
          <CardListSkeleton count={3} />
        ) : (
          <CommandEmpty>{noOptionsMessage}</CommandEmpty>
        )}
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option.value}
              value={`${option.label} - ${option.value}`}
              onSelect={(v) => {
                const currentValue =
                  options.find((o) => `${o.label} - ${o.value}` === v)?.value ||
                  "";
                onChange(currentValue);
                // If freeInput is enabled, update the input text with the selected option’s label.
                if (freeInput) {
                  const selected = options.find(
                    (o) => o.value === currentValue,
                  );
                  setInputValue(selected ? selected.label : currentValue);
                }
                setOpen(false);
              }}
            >
              <CheckIcon
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
    </>
  );

  if (isMobile) {
    return (
      <>
        <Button
          title={
            value
              ? freeInput
                ? inputValue || value
                : selectedOption?.label
              : undefined
          }
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
          data-cy={dataCy}
          type="button"
          onClick={() => setOpen(true)}
        >
          <span className="overflow-hidden">
            {value
              ? freeInput
                ? inputValue || value
                : selectedOption?.label
              : placeholder}
          </span>
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
        <CommandDrawer open={open} onOpenChange={setOpen}>
          {commandContent}
        </CommandDrawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild className={popoverClassName}>
        <Button
          title={selectedOption ? selectedOption.label : undefined}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
          data-cy={dataCy}
          onClick={() => setOpen(!open)}
        >
          <span className={cn("truncate", !selectedOption && "text-gray-500")}>
            {displayText}
          </span>
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]"
        align={align}
      >
        <Command>{commandContent}</Command>
      </PopoverContent>
    </Popover>
  );
}
