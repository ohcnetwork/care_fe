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
import RadioInput from "@/components/ui/RadioInput";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

/**
 * Minimum option count above which the radio variant falls back to the
 * combobox. Radio buttons are only rendered when `enableRadio` is set AND the
 * number of options is within this threshold.
 */
export const RADIO_MAX_OPTIONS = 5;

/**
 * Default option shape. Consumers that keep this shape only need to swap the
 * component name when migrating from `Autocomplete`.
 */
export interface GenericAutocompleteOption {
  label: string;
  value: string;
}

interface GenericAutocompleteProps<T = GenericAutocompleteOption> {
  options: T[];
  isLoading?: boolean;
  /** Currently selected value key (matches `getOptionValue`). */
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;

  /** Extract the value key from an option. Defaults to `option.value`. */
  getOptionValue?: (option: T) => string;
  /** Extract the display label from an option. Defaults to `option.label`. */
  getOptionLabel?: (option: T) => string;
  /** Custom render for a list item. Defaults to a check icon + label. */
  renderOption?: (option: T, isSelected: boolean) => React.ReactNode;
  /** Custom render for the selected option inside the trigger. */
  renderSelected?: (option: T) => React.ReactNode;

  placeholder?: string;
  inputPlaceholder?: string;
  noOptionsMessage?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  popoverClassName?: string;
  popoverContentClassName?: string;
  freeInput?: boolean;
  closeOnSelect?: boolean;
  showClearButton?: boolean;
  /** Set to `false` for server-side search to disable cmdk's internal filter. */
  filter?: boolean;

  /** Render options as a radio group instead of a combobox. */
  enableRadio?: boolean;
  radioClassName?: string;

  ref?: React.RefCallback<HTMLButtonElement | null>;

  "aria-invalid"?: boolean;
  shortcutId?: string;
}

/**
 * Generic, type-safe replacement for `Autocomplete`.
 *
 * With the default generic (`T = GenericAutocompleteOption`) the prop contract
 * matches `Autocomplete` exactly, so existing usages migrate by renaming the
 * component. For richer option types, provide `getOptionValue` /
 * `getOptionLabel` and (optionally) `renderOption` / `renderSelected`.
 */
export default function GenericAutocomplete<T = GenericAutocompleteOption>(
  props: GenericAutocompleteProps<T>,
) {
  const {
    options,
    isLoading = false,
    value,
    onChange,
    onSearch,
    onOpenChange,
    getOptionValue = (option: T) =>
      (option as unknown as GenericAutocompleteOption).value,
    getOptionLabel = (option: T) =>
      (option as unknown as GenericAutocompleteOption).label,
    renderOption,
    renderSelected,
    placeholder = "Select...",
    inputPlaceholder = "Search option...",
    noOptionsMessage = "No options found",
    disabled,
    align = "center",
    className,
    popoverClassName,
    popoverContentClassName,
    freeInput = false,
    closeOnSelect = true,
    showClearButton = true,
    filter = true,
    enableRadio = false,
    radioClassName,
    ref,
    shortcutId,
  } = props;

  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  // Maintain an internal state for the input text when freeInput is enabled.
  const [inputValue, setInputValue] = React.useState(value);

  // Find a matching option from the options list.
  const selectedOption = options.find(
    (option) => getOptionValue(option) === value,
  );

  // Sync the inputValue with value prop changes.
  React.useEffect(() => {
    const selected = options.find((option) => getOptionValue(option) === value);
    if (value) {
      setInputValue(selected ? getOptionLabel(selected) : value);
    } else {
      setInputValue("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options]);

  const renderTriggerContent = (fallback: string) => {
    if (selectedOption && renderSelected) {
      return renderSelected(selectedOption);
    }
    return (
      <span
        className={cn(
          inputValue && "truncate",
          !selectedOption && "text-gray-500",
        )}
      >
        {fallback}
      </span>
    );
  };

  // Determine what text to display on the button.
  const displayText = freeInput
    ? inputValue || placeholder
    : selectedOption
      ? getOptionLabel(selectedOption)
      : placeholder;

  // Handle changes in the CommandInput.
  const handleInputChange = (newValue: string) => {
    if (freeInput) {
      setInputValue(newValue);
      // If the new text exactly matches an option (case-insensitive), select it.
      const matchingOption = options.find(
        (option) =>
          getOptionLabel(option).toLowerCase() === newValue.toLowerCase(),
      );
      if (matchingOption) {
        onChange(getOptionValue(matchingOption));
      } else {
        onChange(newValue);
      }
    } else {
      onSearch?.(newValue);
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

    handleOpenChange(false);
  };

  // Radio variant — only when enabled and within the option threshold.
  if (enableRadio && options.length <= RADIO_MAX_OPTIONS) {
    return (
      <RadioInput
        options={options.map((option) => ({
          label: getOptionLabel(option),
          value: getOptionValue(option),
        }))}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        aria-invalid={props["aria-invalid"]}
        className={radioClassName}
      />
    );
  }

  const commandContent = (
    <>
      <CommandInput
        placeholder={inputPlaceholder}
        disabled={disabled}
        onValueChange={handleInputChange}
        className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm md:pr-0"
        autoFocus
      />
      <CommandList className="overflow-y-auto">
        {isLoading ? (
          <CardListSkeleton count={3} />
        ) : (
          <CommandEmpty>{noOptionsMessage}</CommandEmpty>
        )}
        <CommandGroup>
          {options.map((option) => {
            const optionValue = getOptionValue(option);
            const optionLabel = getOptionLabel(option);
            const isSelected = value === optionValue;
            return (
              <CommandItem
                key={optionValue}
                value={`${optionLabel} - ${optionValue}`}
                onSelect={(v) => {
                  const currentValue =
                    options.find(
                      (o) =>
                        `${getOptionLabel(o)} - ${getOptionValue(o)}` === v,
                    ) ?? option;
                  const currentOptionValue = getOptionValue(currentValue);
                  onChange(currentOptionValue);
                  // For freeInput, reflect the selected label in the input.
                  if (freeInput) {
                    setInputValue(getOptionLabel(currentValue));
                  }
                  if (closeOnSelect) {
                    handleOpenChange(false);
                  }
                }}
              >
                {renderOption ? (
                  renderOption(option, isSelected)
                ) : (
                  <>
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {optionLabel}
                  </>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex relative w-full">
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>
            <Button
              aria-invalid={props["aria-invalid"]}
              title={
                selectedOption
                  ? freeInput
                    ? inputValue || value
                    : getOptionLabel(selectedOption)
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
              type="button"
            >
              {renderTriggerContent(
                value
                  ? freeInput
                    ? inputValue || value
                    : selectedOption
                      ? getOptionLabel(selectedOption)
                      : placeholder
                  : placeholder,
              )}
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
              <Command shouldFilter={filter}>{commandContent}</Command>
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
      <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
        <PopoverTrigger asChild className={popoverClassName}>
          <Button
            title={selectedOption ? getOptionLabel(selectedOption) : undefined}
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
            onClick={() => handleOpenChange(!open)}
            ref={ref}
            data-shortcut-id={shortcutId}
          >
            {renderTriggerContent(displayText)}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]",
            popoverContentClassName,
          )}
          align={align}
        >
          <Command shouldFilter={filter}>{commandContent}</Command>
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
