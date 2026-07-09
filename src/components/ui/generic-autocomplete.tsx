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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { X } from "lucide-react";
import { useState } from "react";

interface GenericAutoCompleteOptionBase<T> {
  label: string;
  value: T;
}
export type GenericAutoCompleteOption<T = string> =
  GenericAutoCompleteOptionBase<T> &
    (T extends string ? { key?: string } : { key: string });

interface GenericAutocompleteBaseProps<T = string> {
  options: GenericAutoCompleteOption<T>[];
  isLoading?: boolean;
  value: T | null;
  onChange: (value: T | null) => void;
  onSearch?: (value: string) => void;
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
  /** Custom renderer for options. Used by both dropdown and radio unless overridden. */
  renderOption?: (
    option: GenericAutoCompleteOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
  /** Optional override for radio variant. If not provided, uses renderOption. */
  renderRadioOption?: (
    option: GenericAutoCompleteOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
  /** Custom renderer for the selected value in the dropdown trigger button */
  renderSelected?: (option: GenericAutoCompleteOption<T>) => React.ReactNode;
  /** Function to compare values for equality. Defaults to === for primitives */
  ref?: React.RefCallback<HTMLButtonElement | null>;
  enableRadio?: boolean;
  "aria-invalid"?: boolean;
  shortcutId?: string;
}
export type GenericAutocompleteProps<T = string> =
  GenericAutocompleteBaseProps<T> &
    (T extends string
      ? { valueCompare?: (a: T | null, b: T | null) => boolean }
      : { valueCompare: (a: T | null, b: T | null) => boolean });

// Default value comparison function
function defaultValueCompare<T>(a: T | null, b: T | null): boolean {
  return a === b;
}

// Default option renderer
function defaultRenderDropdownOption<T>(
  option: GenericAutoCompleteOption<T>,
  isSelected: boolean,
): React.ReactNode {
  return (
    <>
      <CheckIcon
        className={cn("mr-2 size-4", isSelected ? "opacity-100" : "opacity-0")}
      />
      {option.label}
    </>
  );
}

// Default selected renderer
function defaultRenderDropdownSelected<T>(
  option: GenericAutoCompleteOption<T>,
): React.ReactNode {
  return <span className="truncate">{option.label}</span>;
}

// Helper to get option key
function getOptionKey<T>(option: GenericAutoCompleteOption<T>): string {
  if (option.key) return option.key;
  if (typeof option.value === "string")
    return `${option.label}-${option.value}`;
  return option.label;
}

function getOptionDomId(groupId: string, optionKey: string): string {
  return `ga-${groupId}-${encodeURIComponent(optionKey).replace(/%/g, "_")}`;
}

interface GenericAutocompleteRadioProps<T> {
  options: GenericAutoCompleteOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  renderOption?: (
    option: GenericAutoCompleteOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
  disabled?: boolean;
  showClearButton?: boolean;
  valueCompare: (a: T | null, b: T | null) => boolean;
  className?: string;
}

function GenericAutocompleteRadio<T>({
  options,
  value,
  onChange,
  disabled,
  showClearButton,
  valueCompare,
  renderOption,
  className,
}: GenericAutocompleteRadioProps<T>) {
  const { t } = useTranslation();
  const groupId = React.useId();

  const selectedOption = options.find((opt) => valueCompare(opt.value, value));
  const selectedKey = selectedOption ? getOptionKey(selectedOption) : null;

  const handleValueChange = (key: string) => {
    const selected = options.find((opt) => getOptionKey(opt) === key);
    if (selected) {
      onChange(selected.value);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value && showClearButton && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="h-7 px-2 text-gray-500"
          >
            <X className="h-3 w-3 mr-1" />
            {t("clear")}
          </Button>
        </div>
      )}
      <RadioGroup
        value={selectedKey ?? ""}
        onValueChange={handleValueChange}
        disabled={disabled}
        className="flex flex-row flex-wrap gap-1"
      >
        {options.map((option) => {
          const itemKey = getOptionKey(option);
          const itemId = getOptionDomId(groupId, itemKey);
          const isSelected = valueCompare(option.value, value);
          return (
            <Label
              key={itemKey}
              htmlFor={itemId}
              className={cn(
                "border rounded-md p-2 w-full cursor-pointer sm:w-auto sm:max-w-xs hover:border-primary-500 group text-left",
                isSelected
                  ? "bg-primary-100 border-primary-500"
                  : "bg-white border-gray-300",
              )}
            >
              <RadioGroupItem
                value={itemKey}
                id={itemId}
                className="h-4 w-4 text-primary focus:ring-primary group-hover:border-primary-500"
              />
              {renderOption?.(option, isSelected) ?? (
                <span className="text-sm font-normal">{option.label}</span>
              )}
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

interface GenericAutocompleteDropdownProps<T> {
  options: GenericAutoCompleteOption<T>[];
  isLoading: boolean;
  value: T | null;
  onChange: (value: T | null) => void;
  onSearch?: (value: string) => void;
  placeholder: string;
  inputPlaceholder: string;
  noOptionsMessage: string;
  disabled?: boolean;
  align: "start" | "center" | "end";
  className?: string;
  popoverClassName?: string;
  popoverContentClassName?: string;
  freeInput: boolean;
  closeOnSelect: boolean;
  showClearButton: boolean;
  renderOption: (
    option: GenericAutoCompleteOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
  renderSelected: (option: GenericAutoCompleteOption<T>) => React.ReactNode;
  valueCompare: (a: T | null, b: T | null) => boolean;
  buttonRef?: React.RefCallback<HTMLButtonElement | null>;
  shortcutId?: string;
  "aria-invalid"?: boolean;
}

function GenericAutocompleteDropdown<T>({
  options,
  isLoading,
  value,
  onChange,
  onSearch,
  placeholder,
  inputPlaceholder,
  noOptionsMessage,
  disabled,
  align,
  className,
  popoverClassName,
  popoverContentClassName,
  freeInput,
  closeOnSelect,
  showClearButton,
  renderOption,
  renderSelected,
  valueCompare,
  buttonRef,
  shortcutId,
  ...props
}: GenericAutocompleteDropdownProps<T>) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const { t } = useTranslation();

  // Maintain an internal state for the input text when freeInput is enabled.
  const [inputValue, setInputValue] = React.useState(
    typeof value === "string" ? value : "",
  );

  // Find a matching option from the options list
  const selectedOption = options.find((option) =>
    valueCompare(option.value, value),
  );

  // Sync the inputValue when the value prop changes (only for string/freeInput
  // mode). Adjusting state during render avoids a setState-in-effect cascade.
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (typeof value === "string") {
      setInputValue(value ? (selectedOption?.label ?? value) : "");
    }
  }

  // Handle changes in the CommandInput.
  const handleInputChange = (newValue: string) => {
    if (freeInput && typeof value === "string") {
      setInputValue(newValue);
      const matchingOption = options.find(
        (option) => option.label.toLowerCase() === newValue.toLowerCase(),
      );
      if (matchingOption) {
        onChange(matchingOption.value);
      } else {
        onChange(newValue as T);
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
    onChange(null);
    if (freeInput) {
      setInputValue("");
    }
    onSearch?.("");
    setOpen(false);
  };

  // Reset search on close
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && !freeInput) {
      onSearch?.("");
    }
  };

  const commandContent = (
    <>
      <CommandInput
        placeholder={inputPlaceholder}
        disabled={disabled}
        value={freeInput && typeof value === "string" ? inputValue : undefined}
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
            const itemKey = getOptionKey(option);
            const isSelected = valueCompare(option.value, value);
            return (
              <CommandItem
                key={itemKey}
                value={itemKey}
                onSelect={() => {
                  onChange(option.value);
                  // If freeInput is enabled, update the input text with the selected option's label.
                  if (freeInput) {
                    setInputValue(option.label);
                  }
                  if (closeOnSelect) {
                    setOpen(false);
                  }
                }}
              >
                {renderOption(option, isSelected)}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </>
  );

  const renderTriggerContent = () => {
    if (selectedOption) {
      return renderSelected(selectedOption);
    }
    if (freeInput && inputValue) {
      return <span className="truncate">{inputValue}</span>;
    }
    return <span className="text-gray-500">{placeholder}</span>;
  };

  const getTriggerTitle = (): string | undefined => {
    if (selectedOption) {
      return selectedOption.label;
    }
    if (freeInput && inputValue) {
      return inputValue;
    }
    return undefined;
  };

  if (isMobile) {
    return (
      <div className="flex relative w-full min-w-0">
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>
            <Button
              aria-invalid={props["aria-invalid"]}
              title={getTriggerTitle()}
              variant="outline"
              ref={buttonRef}
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full min-w-0 justify-between",
                className,
                value && showClearButton && "rounded-r-none",
              )}
              disabled={disabled}
              type="button"
            >
              <span className="min-w-0 flex-1 overflow-hidden text-left">
                {renderTriggerContent()}
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
              <Command shouldFilter={!onSearch}>{commandContent}</Command>
            </div>
          </DrawerContent>
        </Drawer>
        {value && showClearButton ? (
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
    <div className="flex relative w-full min-w-0">
      <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
        <PopoverTrigger asChild className={popoverClassName}>
          <Button
            title={getTriggerTitle()}
            variant="outline"
            role="combobox"
            aria-invalid={props["aria-invalid"]}
            aria-expanded={open}
            className={cn(
              "w-full min-w-0 justify-between",
              className,
              value && showClearButton && "rounded-r-none",
            )}
            disabled={disabled}
            onClick={() => setOpen(!open)}
            ref={buttonRef}
            data-shortcut-id={shortcutId}
          >
            <span className="min-w-0 flex-1 overflow-hidden text-left">
              {renderTriggerContent()}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]",
            popoverContentClassName,
          )}
          align={align}
        >
          <Command shouldFilter={!onSearch}>{commandContent}</Command>
        </PopoverContent>
      </Popover>
      {value && showClearButton ? (
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

const DEFAULT_INLINE_OPTIONS_LIMIT = 5;

export default function GenericAutocomplete<T = string>({
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
  popoverContentClassName,
  freeInput = false,
  closeOnSelect = true,
  showClearButton = true,
  renderOption,
  renderRadioOption,
  renderSelected,
  valueCompare = defaultValueCompare<T>,
  ref,
  enableRadio = false,
  shortcutId,
  ...props
}: GenericAutocompleteProps<T>) {
  // Capture initial options count to determine variant (radio vs dropdown)
  // This prevents switching variants when search results change
  const [initialOptionsCount, setInitialOptionsCount] = useState<number | null>(
    null,
  );
  if (initialOptionsCount === null && options.length > 0) {
    setInitialOptionsCount(options.length);
  }

  // Use radio buttons if:
  // - Initial options count is within limit
  // - freeInput is disabled (radio doesn't support free text)
  const useRadioButtons =
    !freeInput &&
    enableRadio &&
    initialOptionsCount !== null &&
    initialOptionsCount > 0 &&
    initialOptionsCount <= DEFAULT_INLINE_OPTIONS_LIMIT;

  if (useRadioButtons) {
    return (
      <GenericAutocompleteRadio<T>
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        showClearButton={showClearButton}
        valueCompare={valueCompare}
        renderOption={renderRadioOption ?? renderOption}
        className={className}
      />
    );
  }

  return (
    <GenericAutocompleteDropdown<T>
      options={options}
      isLoading={isLoading}
      value={value}
      onChange={onChange}
      onSearch={onSearch}
      placeholder={placeholder}
      inputPlaceholder={inputPlaceholder}
      noOptionsMessage={noOptionsMessage}
      disabled={disabled}
      align={align}
      className={className}
      popoverClassName={popoverClassName}
      popoverContentClassName={popoverContentClassName}
      freeInput={freeInput}
      closeOnSelect={closeOnSelect}
      showClearButton={showClearButton}
      renderOption={renderOption ?? defaultRenderDropdownOption}
      renderSelected={renderSelected ?? defaultRenderDropdownSelected}
      valueCompare={valueCompare}
      buttonRef={ref}
      shortcutId={shortcutId}
      aria-invalid={props["aria-invalid"]}
    />
  );
}
