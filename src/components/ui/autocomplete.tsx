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
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { isAppleDevice } from "@/Utils/utils";

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
  shortcutId?: string;
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
  shortcutId,
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
        className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm"
        autoFocus={!isAppleDevice}
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
      <div className="flex relative w-full">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
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
              className={cn(
                "w-full justify-between",
                className,
                selectedOption && "rounded-r-none",
              )}
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
          </DrawerTrigger>
          <DrawerContent
            aria-describedby={undefined}
            className="min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg"
          >
            <DrawerTitle className="sr-only">
              {t("autocomplete_options")}
            </DrawerTitle>

            <div className="mt-6 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
              <Command>{commandContent}</Command>
            </div>
          </DrawerContent>
        </Drawer>
        {selectedOption && showClearButton ? (
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none border-l-0 text-gray-400 h-auto"
            onClick={handleClear}
            title={t("clear")}
            hidden={disabled}
          >
            <Cross2Icon />
            <span className="sr-only">{t("clear")}</span>
          </Button>
        ) : (
          <CaretSortIcon className="absolute right-3 top-1/2 -translate-y-1/2 ml-2 size-4 shrink-0 opacity-50" />
        )}
      </div>
    );
  }

  return (
    <div className="flex relative w-full">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild className={popoverClassName}>
          <Button
            title={selectedOption ? selectedOption.label : undefined}
            variant="outline"
            role="combobox"
            aria-invalid={props["aria-invalid"]}
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              className,
              selectedOption && "rounded-r-none",
            )}
            disabled={disabled}
            data-cy={dataCy}
            onClick={() => setOpen(!open)}
            ref={ref}
            data-shortcut-id={shortcutId}
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
          variant="outline"
          size="icon"
          className="rounded-l-none border-l-0 text-gray-400 h-auto"
          onClick={handleClear}
          title={t("clear")}
          hidden={disabled}
        >
          <Cross2Icon />
          <span className="sr-only">{t("clear")}</span>
        </Button>
      ) : (
        <>
          {shortcutId ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 ">
              <div className="flex items-center justify-center gap-1">
                <ShortcutBadge actionId={shortcutId} />
                <CaretSortIcon className="size-3 shrink-0 opacity-50" />
              </div>
            </div>
          ) : (
            <CaretSortIcon className="absolute right-3 top-1/2 -translate-y-1/2 ml-2 size-4 shrink-0 opacity-50" />
          )}
        </>
      )}
    </div>
  );
}
