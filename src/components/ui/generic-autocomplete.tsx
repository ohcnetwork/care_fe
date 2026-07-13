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
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

/**
 * Radio mode activates when `enableRadio` is true AND the option count is
 * within this threshold. Exported so consumers can size their queries.
 */
export const RADIO_OPTIONS_THRESHOLD = 5;

export interface GenericAutocompleteOption<T> {
  label: string;
  value: T;
}

export interface GenericAutocompleteProps<T> {
  options: GenericAutocompleteOption<T>[];
  /**
   * The currently selected value, or `null` for no selection.
   *
   * **Migration note (from `Autocomplete`):** `Autocomplete` used `""` as the
   * empty sentinel; `GenericAutocomplete` uses `null`. For a near-zero-diff
   * rename, pass `emptyValue=""` and keep your state as `string`.
   * Remove `emptyValue` once you migrate the state to `null`.
   */
  value: T | null;
  onChange: (value: T | null) => void;
  /**
   * Derives a stable string key from a value for equality comparisons and
   * React keys. Defaults to `String(value)`.
   */
  getOptionKey?: (value: T) => string;
  /**
   * Renders each option row — used in **both** dropdown and radio mode, so
   * rich items (icon + label + subtitle) look identical in both presentations.
   * Receives `isSelected` for optional highlight styling; the selection
   * indicator (checkmark / radio button) is rendered by the component.
   *
   * When omitted, falls back to the plain `option.label` string.
   */
  renderOption?: (
    option: GenericAutocompleteOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
  /**
   * Renders the selected value inside the trigger button (dropdown mode only).
   * When omitted, falls back to the matched option's label.
   */
  renderValue?: (value: T) => React.ReactNode;
  /**
   * Renders an inline `RadioGroup` instead of the searchable dropdown when
   * `options.length <= RADIO_OPTIONS_THRESHOLD`. Ignored when the list is
   * larger than the threshold.
   */
  enableRadio?: boolean;
  /**
   * Show a "None" row (radio mode) or a clear button (dropdown mode) that
   * resets the selection to `null` / `emptyValue`.
   */
  clearSelection?: boolean;
  /**
   * **Migration compat:** When set, `onChange` emits this value instead of
   * `null` when clearing. Use `emptyValue=""` to keep string-typed state
   * working without changes while migrating from `Autocomplete`.
   */
  emptyValue?: T;
  isLoading?: boolean;
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
  showClearButton?: boolean;
  ref?: React.RefCallback<HTMLButtonElement | null>;
  "aria-invalid"?: boolean;
  shortcutId?: string;
}

export default function GenericAutocomplete<T>({
  options,
  value,
  onChange,
  getOptionKey = (v) => String(v),
  renderOption,
  renderValue,
  enableRadio = false,
  clearSelection = false,
  emptyValue,
  isLoading = false,
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
  showClearButton = true,
  ref,
  shortcutId,
  ...props
}: GenericAutocompleteProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  const showRadio =
    enableRadio && options.length > 0 && options.length <= RADIO_OPTIONS_THRESHOLD;

  const selectedOption = React.useMemo(
    () =>
      value !== null
        ? options.find((o) => getOptionKey(o.value) === getOptionKey(value))
        : undefined,
    [options, value, getOptionKey],
  );

  const emitEmpty = () =>
    onChange(emptyValue !== undefined ? emptyValue : null);

  const handleSelect = (option: GenericAutocompleteOption<T>) => {
    onChange(option.value);
    if (closeOnSelect) setOpen(false);
  };

  // ── Radio mode ─────────────────────────────────────────────────────────────
  if (showRadio) {
    const radioKey = value !== null ? getOptionKey(value) : "__none__";

    return (
      <RadioGroup
        value={radioKey}
        onValueChange={(key) => {
          if (key === "__none__") {
            emitEmpty();
            return;
          }
          const opt = options.find((o) => getOptionKey(o.value) === key);
          if (opt) onChange(opt.value);
        }}
        disabled={disabled}
        className="gap-2"
      >
        {clearSelection && (
          <label
            htmlFor="radio-option-none"
            className="flex items-center gap-3 cursor-pointer rounded-md border border-gray-200 px-3 py-2 transition-colors hover:bg-gray-50 has-[[data-state=checked]]:border-primary-200 has-[[data-state=checked]]:bg-primary-50"
          >
            <RadioGroupItem value="__none__" id="radio-option-none" />
            <span className="text-sm text-gray-500">{t("none")}</span>
          </label>
        )}
        {options.map((option) => {
          const key = getOptionKey(option.value);
          const isSelected = value !== null && getOptionKey(value) === key;
          return (
            <label
              key={key}
              htmlFor={`radio-option-${key}`}
              className="flex items-center gap-3 cursor-pointer rounded-md border border-gray-200 px-3 py-2 transition-colors hover:bg-gray-50 has-[[data-state=checked]]:border-primary-200 has-[[data-state=checked]]:bg-primary-50"
            >
              <RadioGroupItem value={key} id={`radio-option-${key}`} />
              <div className="flex-1 min-w-0">
                {renderOption
                  ? renderOption(option, isSelected)
                  : option.label}
              </div>
            </label>
          );
        })}
      </RadioGroup>
    );
  }

  // ── Dropdown mode ───────────────────────────────────────────────────────────
  const triggerContent =
    value !== null
      ? renderValue
        ? renderValue(value)
        : selectedOption?.label ?? placeholder
      : undefined;

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
          {options.map((option) => {
            const key = getOptionKey(option.value);
            const isSelected =
              value !== null && getOptionKey(value) === key;
            return (
              <CommandItem
                key={key}
                value={`${option.label} - ${key}`}
                onSelect={() => handleSelect(option)}
                className="cursor-pointer"
              >
                {renderOption ? (
                  <div className="flex items-center w-full">
                    <div className="flex-1 min-w-0">
                      {renderOption(option, isSelected)}
                    </div>
                    {isSelected && (
                      <CheckIcon className="ml-auto shrink-0 size-4" />
                    )}
                  </div>
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

  const hasSelection = selectedOption !== undefined;

  if (isMobile) {
    return (
      <div className="flex relative w-full">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button
              aria-invalid={props["aria-invalid"]}
              variant="outline"
              ref={ref}
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between",
                className,
                hasSelection && showClearButton && "rounded-r-none",
              )}
              disabled={disabled}
              type="button"
            >
              <span className="overflow-hidden">
                {triggerContent ?? (
                  <span className="text-gray-500">{placeholder}</span>
                )}
              </span>
            </Button>
          </DrawerTrigger>
          <DrawerContent
            aria-describedby={undefined}
            className="min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg"
          >
            <DrawerTitle className="sr-only">{placeholder}</DrawerTitle>
            <div className="mt-6 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
              <Command shouldFilter={false}>{commandContent}</Command>
            </div>
          </DrawerContent>
        </Drawer>
        {hasSelection && showClearButton ? (
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none border-l-0 text-gray-400 h-auto"
            onClick={emitEmpty}
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
            variant="outline"
            role="combobox"
            aria-invalid={props["aria-invalid"]}
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              className,
              hasSelection && showClearButton && "rounded-r-none",
            )}
            disabled={disabled}
            onClick={() => setOpen(!open)}
            ref={ref}
            data-shortcut-id={shortcutId}
          >
            <span
              className={cn(
                "overflow-hidden flex-1 text-left",
                !triggerContent && "text-gray-500",
              )}
            >
              {triggerContent ?? placeholder}
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
          <Command shouldFilter={false}>{commandContent}</Command>
        </PopoverContent>
      </Popover>
      {hasSelection && showClearButton ? (
        <Button
          variant="outline"
          size="icon"
          className="rounded-l-none border-l-0 text-gray-400 h-auto"
          onClick={emitEmpty}
          title={t("clear")}
          hidden={disabled}
        >
          <Cross2Icon />
          <span className="sr-only">{t("clear")}</span>
        </Button>
      ) : (
        <>
          {shortcutId ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
