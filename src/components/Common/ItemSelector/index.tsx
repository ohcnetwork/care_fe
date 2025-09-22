import { Cross2Icon } from "@radix-ui/react-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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

import useBreakpoints from "@/hooks/useBreakpoints";
import { SelectorContent } from "./SelectorContent";
import type { ItemSelectorProps } from "./types";

export type { ItemSelectorProps } from "./types";

export function ItemSelector<T = any>({
  selection,
  ui = {},
  layout = {},
  render = {},
  search = {},
  a11y = {},
  shortcuts = {},
  favorites = {},
}: ItemSelectorProps<T>) {
  // Destructure nested props with defaults
  const {
    value,
    onChange,
    options,
    multiSelect = false,
    clearable = true,
  } = selection;

  const {
    title,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    noResultsMessage = "No results found",
    triggerButton,
    mobileTrigger,
    className,
    disabled = false,
    loading = false,
  } = ui;

  const {
    popoverClassName,
    popoverPosition = {
      align: "start",
      side: "bottom",
      sideOffset: 4,
      avoidCollisions: true,
    },
    closeOnSelect = true,
    open,
    onOpenChange,
    hideTrigger = false,
  } = layout;

  const { renderOption, renderSelection } = render;
  const { onSearch } = search;
  const { "data-cy": dataCy, "aria-invalid": ariaInvalid } = a11y;
  const { shortcutId, shortcutDisplay } = shortcuts;

  const {
    enable: enableFavorites = false,
    items: favoriteItems = [],
    onToggle: onToggleFavorite,
    onClearAll: onClearAllFavorites,
    noItemsMessage: noFavoritesMessage = "No favorites yet",
    layout: favoritesLayout = "none",
  } = favorites;
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("search");
  const isMobile = useBreakpoints({ default: true, sm: false });

  const isIOS = React.useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  }, []);

  // Handle controlled/uncontrolled open state
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  };

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
        handleOpenChange(false);
      }
    } else {
      onChange(selectedValue);
      if (closeOnSelect) {
        handleOpenChange(false);
      }
    }
  };

  // Handle clearing the selection
  const handleClear = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    onChange(multiSelect ? [] : null);
    handleOpenChange(false);
  };

  // Create default trigger button if none provided
  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={isOpen}
      aria-invalid={ariaInvalid}
      className={cn("w-full justify-between", className)}
      disabled={disabled}
      data-cy={dataCy}
      data-shortcut-id={shortcutId}
      onClick={() => !disabled && handleOpenChange(!isOpen)}
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
    <SelectorContent
      title={title}
      searchPlaceholder={searchPlaceholder}
      onSearch={onSearch}
      isIOS={isIOS}
      loading={loading}
      filteredOptions={filteredOptions}
      noResultsMessage={noResultsMessage}
      favoritesLayout={favoritesLayout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      enableFavorites={enableFavorites}
      clearable={clearable}
      selectedValues={selectedValues}
      handleClear={handleClear}
      handleSelect={handleSelect}
      favoriteItems={favoriteItems}
      onToggleFavorite={onToggleFavorite}
      onClearAllFavorites={onClearAllFavorites}
      noFavoritesMessage={noFavoritesMessage}
      renderOption={renderOption}
      searchValue={searchValue}
      setSearchValue={setSearchValue}
    />
  );

  // Render for mobile using Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange} direction="bottom">
        <DrawerTrigger asChild>
          {!hideTrigger && (mobileTrigger || triggerButton || defaultTrigger)}
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
    <Popover open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      {!hideTrigger && (
        <PopoverTrigger asChild>
          {triggerButton || defaultTrigger}
        </PopoverTrigger>
      )}
      <PopoverContent
        className={cn(
          "p-0 w-[var(--radix-popover-trigger-width)] min-w-[300px]",
          popoverClassName,
        )}
        align={popoverPosition.align}
        side={popoverPosition.side}
        sideOffset={popoverPosition.sideOffset}
        avoidCollisions={popoverPosition.avoidCollisions}
      >
        {commandContent}
      </PopoverContent>
    </Popover>
  );
}
