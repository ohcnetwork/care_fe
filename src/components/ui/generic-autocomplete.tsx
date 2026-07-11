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
 * When `enableRadio` is true, radio buttons render only if the option count is
 * at or below this threshold; otherwise the component falls back to the
 * searchable dropdown.
 */
export const RADIO_TRIGGER_MAX_OPTIONS = 5;

export interface GenericAutocompleteOption<T> {
  label: string;
  value: T;
}

interface GenericAutocompleteProps<T> {
  options: GenericAutocompleteOption<T>[];
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
  closeOnSelect?: boolean;
  showClearButton?: boolean;
  /** When true and options.length <= RADIO_THRESHOLD, renders as RadioGroup */
  enableRadio?: boolean;
  radioClassName?: string;
  /**
   * Custom content rendered inside each option row (dropdown CommandItem and
   * radio label). Receives the option and whether it is currently selected.
   * Falls back to `option.label` when omitted.
   */
  renderOption?: (
    option: GenericAutocompleteOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
  /**
   * Custom content for the trigger button (dropdown mode only).
   * Receives the currently selected option, or null when nothing is selected.
   * Falls back to `selected.label` / `placeholder` when omitted.
   */
  renderTrigger?: (
    selected: GenericAutocompleteOption<T> | null,
  ) => React.ReactNode;
  ref?: React.RefCallback<HTMLButtonElement | null>;
  "aria-invalid"?: boolean;
  shortcutId?: string;
}

function GenericAutocompleteInner<T>(
  {
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
    showClearButton = true,
    enableRadio = false,
    radioClassName,
    renderOption,
    renderTrigger,
    ref,
    shortcutId,
    ...props
  }: GenericAutocompleteProps<T>,
  _ref: React.Ref<HTMLButtonElement | null>,
) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });
  const { t } = useTranslation();

  const selectedOption =
    value !== null && value !== undefined
      ? (options.find((o) => o.value === value) ?? null)
      : null;

  // Decide radio vs dropdown against the eager-fetched (unfiltered) option
  // count. While a search term is active the list is server-filtered, so a
  // narrowed result must not collapse an open dropdown into radios.
  const showRadio =
    enableRadio && !searchTerm && options.length <= RADIO_TRIGGER_MAX_OPTIONS;

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    onSearch?.("");
    setSearchTerm("");
    setOpen(false);
  };

  // ── Radio mode ────────────────────────────────────────────────────────────
  if (showRadio) {
    return (
      <div
        className={cn("flex flex-col gap-2", radioClassName)}
        data-testid="autocomplete-radio-group"
      >
        <RadioGroup
          value={
            value !== null && value !== undefined ? String(value) : undefined
          }
          // RadioGroup itself does not fire for the already-selected value;
          // toggle-to-deselect is handled by the wrapper click below.
          onValueChange={(v) => {
            const match = options.find((o) => String(o.value) === v);
            if (match) onChange(match.value);
          }}
          disabled={disabled}
        >
          {options.map((option, i) => {
            const isSelected = selectedOption?.value === option.value;
            const id = `radio-option-${i}`;
            return (
              <div
                key={id}
                data-testid="autocomplete-radio-option"
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:bg-gray-50",
                  disabled && "cursor-not-allowed opacity-50",
                )}
                onClick={
                  // Toggle-to-deselect: clicking the selected option clears it.
                  isSelected && !disabled
                    ? (e) => {
                        e.preventDefault();
                        onChange(null);
                      }
                    : undefined
                }
              >
                <RadioGroupItem
                  value={String(option.value)}
                  id={id}
                  aria-label={option.label}
                />
                <label
                  htmlFor={id}
                  className={cn(
                    "flex-1 min-w-0 cursor-pointer",
                    disabled && "cursor-not-allowed",
                  )}
                >
                  {renderOption ? (
                    renderOption(option, isSelected)
                  ) : (
                    <span className="text-sm font-medium">{option.label}</span>
                  )}
                </label>
              </div>
            );
          })}
        </RadioGroup>
        {selectedOption && showClearButton && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-gray-400 px-0 h-auto"
            onClick={handleClear}
            disabled={disabled}
            type="button"
          >
            <Cross2Icon className="mr-1 size-3" />
            {t("clear")}
          </Button>
        )}
      </div>
    );
  }

  // ── Combobox mode ─────────────────────────────────────────────────────────
  const defaultTriggerContent = selectedOption ? (
    <span className="truncate">{selectedOption.label}</span>
  ) : (
    <span className="text-gray-500">{placeholder}</span>
  );

  const triggerContent = renderTrigger
    ? renderTrigger(selectedOption)
    : defaultTriggerContent;

  const commandContent = (
    <>
      <CommandInput
        placeholder={inputPlaceholder}
        disabled={disabled}
        onValueChange={(v) => {
          setSearchTerm(v);
          onSearch?.(v);
        }}
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
          {options.map((option, i) => {
            const isSelected = selectedOption?.value === option.value;
            return (
              <CommandItem
                key={i}
                value={`${option.label} - ${String(option.value)}`}
                onSelect={() => {
                  onChange(option.value);
                  if (closeOnSelect) setOpen(false);
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
                selectedOption && showClearButton && "rounded-r-none",
              )}
              disabled={disabled}
              type="button"
            >
              {triggerContent}
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
              selectedOption && showClearButton && "rounded-r-none",
            )}
            disabled={disabled}
            onClick={() => setOpen(!open)}
            ref={ref}
            data-shortcut-id={shortcutId}
          >
            {triggerContent}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]",
            popoverContentClassName,
          )}
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

const GenericAutocomplete = React.forwardRef(GenericAutocompleteInner) as <T>(
  props: GenericAutocompleteProps<T> & {
    ref?: React.Ref<HTMLButtonElement | null>;
  },
) => React.ReactElement;

export default GenericAutocomplete;
