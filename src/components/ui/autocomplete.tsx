import { CaretSortIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";

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
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  closeOnSelect?: boolean;
  showClearButton?: boolean;
  "data-cy"?: string;

  ref?: React.RefCallback<HTMLButtonElement | null>;

  "aria-invalid"?: boolean;
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
  closeOnSelect = true,
  showClearButton = true,
  "data-cy": dataCy,
  ref,
  ...props
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

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onChange("");

    if (freeInput) {
      setInputValue("");
    }

    onSearch?.("");

    setOpen(false);
  };
  const { t } = useTranslation();
  const commandContent = (
    <>
      <CommandInput
        placeholder={inputPlaceholder}
        disabled={disabled}
        onValueChange={handleInputChange}
        className="outline-hidden border-none ring-0 shadow-none"
        autoFocus
      />
      <CommandList className="overflow-y-auto">
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
                // If freeInput is enabled, update the input text with the selected option's label.
                if (freeInput) {
                  const selected = options.find(
                    (o) => o.value === currentValue,
                  );
                  setInputValue(selected ? selected.label : currentValue);
                }
                if (closeOnSelect) {
                  setOpen(false);
                }
              }}
            >
              <CheckIcon
                className={cn(
                  "mr-2 size-4",
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
      <div className="relative w-full">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              aria-invalid={props["aria-invalid"]}
              title={
                value
                  ? freeInput
                    ? inputValue || value
                    : selectedOption?.label
                  : undefined
              }
              variant="outline"
              ref={ref}
              role="combobox"
              aria-expanded={open}
              className={cn("w-full justify-between", className)}
              disabled={disabled}
              data-cy={dataCy}
              type="button"
            >
              <span className="overflow-hidden">
                {value
                  ? freeInput
                    ? inputValue || value
                    : selectedOption?.label
                  : placeholder}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            aria-describedby={undefined}
            className="h-[50vh] px-0 pt-2 pb-0 rounded-t-lg"
          >
            <SheetTitle className="sr-only">
              {t("autocomplete_options")}
            </SheetTitle>

            <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto rounded-full bg-gray-300 mt-2" />
            <div className="mt-6 h-full">
              <Command>{commandContent}</Command>
            </div>
          </SheetContent>
        </Sheet>
        {selectedOption && showClearButton ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-0 hover:bg-transparent opacity-50 z-10"
            onClick={handleClear}
            title={t("clear")}
          >
            <Cross2Icon className="size-3" />
            <span className="sr-only">{t("clear")}</span>
          </Button>
        ) : (
          <CaretSortIcon className="absolute right-3 top-1/2 -translate-y-1/2 ml-2 size-4 shrink-0 opacity-50" />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild className={popoverClassName}>
          <Button
            title={selectedOption ? selectedOption.label : undefined}
            variant="outline"
            role="combobox"
            aria-invalid={props["aria-invalid"]}
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
            data-cy={dataCy}
            onClick={() => setOpen(!open)}
            ref={ref}
          >
            <span
              className={cn(
                inputValue && "truncate",
                !selectedOption && "text-gray-500",
              )}
            >
              {displayText}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]"
          align={align}
        >
          <Command>{commandContent}</Command>
        </PopoverContent>
      </Popover>
      {selectedOption && showClearButton ? (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-0 hover:bg-transparent opacity-50 z-10"
          onClick={handleClear}
          title={t("clear")}
        >
          <Cross2Icon className="size-3" />
          <span className="sr-only">{t("clear")}</span>
        </Button>
      ) : (
        <CaretSortIcon className="absolute right-3 top-1/2 -translate-y-1/2 ml-2 size-4 shrink-0 opacity-50" />
      )}
    </div>
  );
}
