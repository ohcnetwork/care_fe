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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";

const RADIO_THRESHOLD = 5;

export interface GenericAutocompleteOption<T> {
  /** Unique key used for selection comparison and radio group value */
  key: string;
  /** Display label shown in the trigger button when selected */
  label: string;
  /** The actual value object */
  value: T;
}

interface GenericAutocompleteProps<T> {
  options: GenericAutocompleteOption<T>[];
  isLoading?: boolean;
  /** Currently selected value — pass null/undefined to indicate nothing selected */
  value: T | null | undefined;
  /** Called with the full value object, or null when cleared */
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
  closeOnSelect?: boolean;
  /** Called whenever the popover/drawer open state changes */
  onOpenChange?: (open: boolean) => void;
  /**
   * When true, show a "Clear selection" item at the top of the list when a
   * value is selected. Calls onChange(null).
   */
  clearSelection?: boolean;
  /**
   * When true, render options as an inline radio group when the number of
   * options is <= 5 (RADIO_THRESHOLD). No popover/drawer is shown in that case.
   */
  radio?: boolean;
  /**
   * Optional render prop for each option row inside the popover/radio list.
   * Receives the option and whether it is currently selected.
   * Defaults to rendering option.label.
   */
  renderOption?: (
    option: GenericAutocompleteOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
  /**
   * Optional render prop for the trigger button content. Receives the
   * currently selected option (or null) and the placeholder string.
   * Defaults to rendering the label or placeholder.
   */
  renderTrigger?: (
    selected: GenericAutocompleteOption<T> | null,
    placeholder: string,
  ) => React.ReactNode;
}

/**
 * GenericAutocomplete — a generic version of Autocomplete that supports any
 * value type T.  Also supports an optional radio-group mode (radio prop) that
 * renders options inline when there are ≤ 5 of them.
 */
export function GenericAutocomplete<T>({
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
  closeOnSelect = true,
  clearSelection = false,
  radio = false,
  renderOption,
  renderTrigger,
  onOpenChange,
}: GenericAutocompleteProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  // Find the option that matches the current value
  const selectedOption = options.find((o) => o.value === value) ?? null;

  const hasValue =
    value !== null && value !== undefined && value !== ("" as unknown as T);
  const showRadio = radio && !isLoading && options.length <= RADIO_THRESHOLD;

  const defaultRenderTrigger = (
    selected: GenericAutocompleteOption<T> | null,
    ph: string,
  ) =>
    selected ? (
      <span className="truncate">{selected.label}</span>
    ) : (
      <span className="text-gray-500">{ph}</span>
    );

  const triggerContent = renderTrigger
    ? renderTrigger(selectedOption, placeholder)
    : defaultRenderTrigger(selectedOption, placeholder);

  const handleSelect = (option: GenericAutocompleteOption<T>) => {
    onChange(option.value);
    if (closeOnSelect) handleOpenChange(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    handleOpenChange(false);
  };

  // ── Radio mode ──────────────────────────────────────────────────────────────
  if (showRadio) {
    const radioValue = selectedOption?.key ?? "";
    return (
      <RadioGroup
        value={radioValue}
        onValueChange={(key) => {
          const opt = options.find((o) => o.key === key);
          if (opt) onChange(opt.value);
        }}
        disabled={disabled}
        className="flex flex-col gap-2"
      >
        {options.map((option) => {
          const isSelected = option.key === radioValue;
          return (
            <label
              key={option.key}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:bg-gray-50",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              <RadioGroupItem value={option.key} id={option.key} />
              <div className="flex-1 min-w-0">
                {renderOption ? (
                  renderOption(option, isSelected)
                ) : (
                  <span className="text-sm">{option.label}</span>
                )}
              </div>
            </label>
          );
        })}
      </RadioGroup>
    );
  }

  // ── Popover / Drawer mode ────────────────────────────────────────────────────
  const commandContent = (
    <>
      <CommandInput
        placeholder={inputPlaceholder}
        disabled={disabled}
        onValueChange={(v) => onSearch?.(v)}
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
          {hasValue && clearSelection && (
            <CommandItem
              onSelect={() => {
                onChange(null);
                handleOpenChange(false);
              }}
              className="cursor-pointer w-full h-9"
            >
              <Cross2Icon className="mr-2 size-4" />
              <span>{t("clear_selection")}</span>
            </CommandItem>
          )}
          {options.map((option) => {
            const isSelected = selectedOption?.key === option.key;
            return (
              <CommandItem
                key={option.key}
                value={`${option.label} - ${option.key}`}
                onSelect={() => handleSelect(option)}
                className="cursor-pointer w-full"
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
                    {option.label}
                  </>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </>
  );

  const triggerButton = (
    <Button
      variant="outline"
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
      {triggerContent}
      <CaretSortIcon className="ml-auto size-4 shrink-0 opacity-50" />
    </Button>
  );

  if (isMobile) {
    return (
      <div className="flex relative w-full">
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent
            aria-describedby={undefined}
            className="min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg"
          >
            <DrawerTitle className="sr-only">
              {t("autocomplete_options")}
            </DrawerTitle>
            <div className="mt-6 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
              <Command shouldFilter={false}>{commandContent}</Command>
            </div>
          </DrawerContent>
        </Drawer>
        {hasValue && selectedOption && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none border-l-0 text-gray-400 h-auto"
            onClick={handleClear}
            title={t("clear")}
            hidden={disabled}
            type="button"
          >
            <Cross2Icon />
            <span className="sr-only">{t("clear")}</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex relative w-full">
      <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
        <PopoverTrigger asChild className={popoverClassName}>
          {triggerButton}
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]",
            popoverContentClassName,
          )}
          align={align}
        >
          <Command shouldFilter={false}>{commandContent}</Command>
        </PopoverContent>
      </Popover>
      {hasValue && selectedOption && (
        <Button
          variant="outline"
          size="icon"
          className="rounded-l-none border-l-0 text-gray-400 h-auto"
          onClick={handleClear}
          title={t("clear")}
          hidden={disabled}
          type="button"
        >
          <Cross2Icon />
          <span className="sr-only">{t("clear")}</span>
        </Button>
      )}
    </div>
  );
}
