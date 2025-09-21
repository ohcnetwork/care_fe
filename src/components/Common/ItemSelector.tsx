import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
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

export interface SelectOption<T = any> {
  label: string;
  value: string;
  icon?: React.ReactNode;
  details?: string[];
  disabled?: boolean;
  data?: T; // For storing additional data with the option
}

export interface ItemSelectorProps<T = any> {
  // Selection values
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  options: SelectOption<T>[];

  // UI customization
  title?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsMessage?: string;
  triggerButton?: React.ReactNode;
  mobileTrigger?: React.ReactNode;
  className?: string;
  popoverClassName?: string;
  popoverAlign?: "start" | "center" | "end";
  popoverSide?: "top" | "bottom" | "left" | "right";
  popoverSideOffset?: number;
  popoverAvoidCollisions?: boolean;

  // Behavior options
  disabled?: boolean;
  loading?: boolean;
  multiSelect?: boolean;
  closeOnSelect?: boolean;
  clearable?: boolean;

  // Custom rendering
  renderOption?: (
    option: SelectOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
  renderSelection?: (selectedOptions: SelectOption<T>[]) => React.ReactNode;

  // Search handling
  onSearch?: (query: string) => void;

  // Accessibility
  "data-cy"?: string;
  "aria-invalid"?: boolean;

  // Shortcut support
  shortcutId?: string;
  shortcutDisplay?: string;
}

export function ItemSelector<T = any>({
  value,
  onChange,
  options,
  title,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  noResultsMessage = "No results found",
  triggerButton,
  mobileTrigger,
  className,
  popoverClassName,
  popoverAlign = "start",
  popoverSide = "bottom",
  popoverSideOffset = 4,
  popoverAvoidCollisions = true,
  disabled = false,
  loading = false,
  multiSelect = false,
  closeOnSelect = true,
  clearable = true,
  renderOption,
  renderSelection,
  onSearch,
  "data-cy": dataCy,
  "aria-invalid": ariaInvalid,
  shortcutId,
  shortcutDisplay,
}: ItemSelectorProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });

  // Convert value to array for consistent handling
  const selectedValues = React.useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
  }, [value]);

  // Find selected options
  const selectedOptions = React.useMemo(
    () => options.filter((option) => selectedValues.includes(option.value)),
    [options, selectedValues],
  );

  // Filter options based on search input when no external onSearch is provided
  const filteredOptions = React.useMemo(() => {
    if (!searchValue || onSearch) return options; // Don't filter if empty or external filtering

    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [options, searchValue, onSearch]);

  // Handle selection
  const handleSelect = (selectedValue: string) => {
    if (multiSelect) {
      const isSelected = selectedValues.includes(selectedValue);
      const newValue = isSelected
        ? selectedValues.filter((v) => v !== selectedValue)
        : [...selectedValues, selectedValue];

      onChange(newValue.length > 0 ? newValue : null);

      // For multi-select, only close when deselecting an item and closeOnSelect is true
      if (isSelected && closeOnSelect) {
        setOpen(false);
      }
    } else {
      onChange(selectedValue);
      if (closeOnSelect) {
        setOpen(false);
      }
    }
  };

  // Handle clearing the selection
  const handleClear = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    onChange(multiSelect ? [] : null);
    setOpen(false);
  };

  // Create default trigger button if none provided
  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      aria-invalid={ariaInvalid}
      className={cn("w-full justify-between", className)}
      disabled={disabled}
      data-cy={dataCy}
      data-shortcut-id={shortcutId}
      onClick={() => !disabled && setOpen(!open)}
    >
      {selectedOptions.length > 0 ? (
        renderSelection ? (
          renderSelection(selectedOptions)
        ) : (
          <div className="flex items-center gap-2 truncate text-left">
            {multiSelect ? (
              <span className="flex items-center gap-2">
                <span className="font-medium">{selectedOptions.length}</span>
                {t("items_selected")}
              </span>
            ) : (
              <span className="truncate">{selectedOptions[0]?.label}</span>
            )}
          </div>
        )
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}

      {/* Show clear button or shortcut/caret */}
      {selectedOptions.length > 0 && clearable ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent opacity-50"
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
        >
          <Cross2Icon className="h-3 w-3" />
          <span className="sr-only">{t("clear")}</span>
        </Button>
      ) : (
        <>
          {shortcutDisplay ? (
            <div className="flex items-center justify-center gap-1 ml-2">
              <div className="text-xs flex items-center justify-center h-5 w-5 rounded-md border border-gray-200">
                {shortcutDisplay}
              </div>
            </div>
          ) : null}
        </>
      )}
    </Button>
  );

  // Content used in both mobile and desktop views
  const commandContent = (
    <Command filter={onSearch ? () => 1 : undefined}>
      <CommandInput
        placeholder={searchPlaceholder}
        onValueChange={(value) => {
          setSearchValue(value);
          onSearch?.(value); // Call external onSearch if provided
        }}
        className="outline-hidden border-none ring-0 shadow-none text-base"
        autoFocus
      />
      <CommandList className="max-h-[300px] overflow-y-auto">
        {loading ? (
          <CardListSkeleton count={3} />
        ) : filteredOptions.length === 0 ? (
          <CommandEmpty>{noResultsMessage}</CommandEmpty>
        ) : null}

        <CommandGroup>
          {clearable && selectedValues.length > 0 && (
            <CommandItem
              onSelect={() => handleClear()}
              className="cursor-pointer"
            >
              <div className="flex items-center text-destructive">
                <Cross2Icon className="mr-2 h-4 w-4" />
                <span>{t("clear_selection")}</span>
              </div>
            </CommandItem>
          )}

          {filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => handleSelect(option.value)}
                onTouchStart={(e) => {
                  // fix for ios touch event
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                    e.stopPropagation(); //
                    setTimeout(() => handleSelect(option.value), 10); //
                  }
                }}
                className={cn(
                  "cursor-pointer",
                  option.disabled && "opacity-50 pointer-events-none",
                )}
                disabled={option.disabled}
              >
                {renderOption ? (
                  renderOption(option, isSelected)
                ) : (
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </div>
                    {isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
                  </div>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  // Render for mobile using Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerTrigger asChild>
          {mobileTrigger || triggerButton || defaultTrigger}
        </DrawerTrigger>
        <DrawerContent
          aria-describedby={undefined}
          className="min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg"
        >
          <DrawerTitle className="sr-only">{title || t("select")}</DrawerTitle>
          <div className="mt-6 h-full pb-safe flex-1 overflow-y-auto">
            {commandContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Render for desktop using Popover
  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>{triggerButton || defaultTrigger}</PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 w-[var(--radix-popover-trigger-width)] min-w-[300px]",
          popoverClassName,
        )}
        align={popoverAlign}
        side={popoverSide}
        sideOffset={popoverSideOffset}
        avoidCollisions={popoverAvoidCollisions}
      >
        {commandContent}
      </PopoverContent>
    </Popover>
  );
}
