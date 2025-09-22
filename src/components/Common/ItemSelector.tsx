import {
  CheckIcon,
  Cross2Icon,
  StarFilledIcon,
  StarIcon,
} from "@radix-ui/react-icons";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;

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

  // Favorites support
  enableFavorites?: boolean;
  favoriteItems?: SelectOption<T>[];
  onToggleFavorite?: (item: SelectOption<T>) => void;
  onClearAllFavorites?: () => void;
  noFavoritesMessage?: string;

  // Layout options
  showTabs?: boolean;
  useSideBySide?: boolean;
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
  open,
  onOpenChange,
  hideTrigger = false,
  renderOption,
  renderSelection,
  onSearch,
  "data-cy": dataCy,
  "aria-invalid": ariaInvalid,
  shortcutId,
  shortcutDisplay,
  enableFavorites = false,
  favoriteItems = [],
  onToggleFavorite,
  onClearAllFavorites,
  noFavoritesMessage = "No favorites yet",
  showTabs = false,
  useSideBySide = false,
}: ItemSelectorProps<T>) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("search");
  const isMobile = useBreakpoints({ default: true, sm: false });

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
    <Command filter={onSearch ? () => 1 : undefined} className="rounded-t-3xl">
      <div className="py-3 px-3 border-b border-gray-200 flex justify-between items-center">
        {title && <h3 className="text-base font-semibold">{title}</h3>}
        {showTabs && enableFavorites && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full md:hidden"
          >
            <TabsList className="flex w-full">
              <TabsTrigger value="search" className="flex-1">
                {t("search")}
              </TabsTrigger>
              <TabsTrigger value="starred" className="flex-1">
                {t("starred")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      <CommandInput
        placeholder={searchPlaceholder}
        onValueChange={(value) => {
          setSearchValue(value);
          onSearch?.(value); // Call external onSearch if provided
        }}
        className="outline-hidden border-none ring-0 shadow-none text-base md:text-sm"
        autoFocus
      />
      <CommandList className="overflow-hidden h-[300px]">
        {loading ? (
          <CardListSkeleton count={3} />
        ) : filteredOptions.length === 0 &&
          (!showTabs || activeTab === "search") ? (
          <CommandEmpty>{noResultsMessage}</CommandEmpty>
        ) : null}

        {useSideBySide && enableFavorites ? (
          <div className="flex" style={{ height: "300px" }}>
            <div className="w-1/2 overflow-auto">
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
                  const isFavorite =
                    enableFavorites &&
                    favoriteItems?.some((item) => item.value === option.value);

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                      onTouchStart={(e) => {
                        // fix for ios touch event
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                          e.stopPropagation();
                          setTimeout(() => handleSelect(option.value), 10);
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
                          <div className="flex items-center gap-2">
                            {enableFavorites && onToggleFavorite && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onToggleFavorite(option);
                                }}
                                className="hover:text-primary-500 transition-all text-secondary-900 cursor-pointer"
                              >
                                {isFavorite ? (
                                  <StarFilledIcon className="h-4 w-4" />
                                ) : (
                                  <StarIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            {isSelected && (
                              <CheckIcon className="h-4 w-4 shrink-0" />
                            )}
                          </div>
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>

            <div className="w-1/2 border-l border-gray-200">
              <CommandGroup className="h-full overflow-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-normal text-gray-700 p-1">
                    {t("starred")}
                  </span>
                  {favoriteItems &&
                    favoriteItems.length > 0 &&
                    onClearAllFavorites && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onClearAllFavorites();
                        }}
                        className="h-6 px-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        {t("clear")}
                      </Button>
                    )}
                </div>
                {!favoriteItems || favoriteItems.length === 0 ? (
                  <div className="flex items-center flex-col justify-center h-[200px] text-xs text-gray-500 p-4">
                    <p>{noFavoritesMessage}</p>
                    <p>{t("click_star_to_add")}</p>
                  </div>
                ) : (
                  favoriteItems
                    .filter(
                      (option) =>
                        !searchValue ||
                        option.label
                          .toLowerCase()
                          .includes(searchValue.toLowerCase()),
                    )
                    .map((option) => {
                      const isSelected = selectedValues.includes(option.value);

                      return (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => handleSelect(option.value)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {option.icon}
                              <span className="truncate">{option.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {onToggleFavorite && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleFavorite(option);
                                  }}
                                  className="hover:text-primary-500 transition-all text-secondary-900 cursor-pointer"
                                >
                                  <StarFilledIcon className="h-4 w-4" />
                                </button>
                              )}
                              {isSelected && (
                                <CheckIcon className="h-4 w-4 shrink-0" />
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })
                )}
              </CommandGroup>
            </div>
          </div>
        ) : (
          <>
            {(!showTabs || activeTab === "search") && (
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
                  const isFavorite =
                    enableFavorites &&
                    favoriteItems?.some((item) => item.value === option.value);

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                      onTouchStart={(e) => {
                        // fix for ios touch event
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                          e.stopPropagation();
                          setTimeout(() => handleSelect(option.value), 10);
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
                          <div className="flex items-center gap-2">
                            {enableFavorites && onToggleFavorite && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onToggleFavorite(option);
                                }}
                                className="hover:text-primary-500 transition-all text-secondary-900 cursor-pointer"
                              >
                                {isFavorite ? (
                                  <StarFilledIcon className="h-4 w-4" />
                                ) : (
                                  <StarIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            {isSelected && (
                              <CheckIcon className="h-4 w-4 shrink-0" />
                            )}
                          </div>
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {showTabs && enableFavorites && activeTab === "starred" && (
              <CommandGroup>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-normal text-gray-700 p-1">
                    {t("starred")}
                  </span>
                  {favoriteItems &&
                    favoriteItems.length > 0 &&
                    onClearAllFavorites && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onClearAllFavorites();
                        }}
                        className="h-6 px-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        {t("clear")}
                      </Button>
                    )}
                </div>
                {!favoriteItems || favoriteItems.length === 0 ? (
                  <div className="flex items-center flex-col justify-center h-[200px] text-xs text-gray-500 p-4">
                    <p>{noFavoritesMessage}</p>
                    <p>{t("click_star_to_add")}</p>
                  </div>
                ) : (
                  favoriteItems
                    .filter(
                      (option) =>
                        !searchValue ||
                        option.label
                          .toLowerCase()
                          .includes(searchValue.toLowerCase()),
                    )
                    .map((option) => {
                      const isSelected = selectedValues.includes(option.value);

                      return (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => handleSelect(option.value)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {option.icon}
                              <span className="truncate">{option.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {onToggleFavorite && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleFavorite(option);
                                  }}
                                  className="hover:text-primary-500 transition-all text-secondary-900 cursor-pointer"
                                >
                                  <StarFilledIcon className="h-4 w-4" />
                                </button>
                              )}
                              {isSelected && (
                                <CheckIcon className="h-4 w-4 shrink-0" />
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })
                )}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </Command>
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
          "p-0 w-[var(--radix-popover-trigger-width)] min-w-[300px] transition-all",
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
