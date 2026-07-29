import { ChevronLeft, ChevronRight, ListFilter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

import FilterRenderer from "./filterRenderer";
import { SelectedFilterBar } from "./selectedFilterBar";
import NavigationHelper from "./utils/navigation-helper";
import useMultiFilter from "./utils/useMultiFilter";
import useMultiFilterNavigationShortcuts from "./utils/useMultiFilterNavigationShortcuts";
import { FilterState, FilterValues, Operation } from "./utils/Utils";

interface MultiFilterProps {
  selectedFilters: Record<string, FilterState>;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  onOperationChange: (filterKey: string, operation: string) => void;
  onClearAll: () => void;
  onClearFilter: (filterKey: string) => void;
  placeholder?: string;
  className?: string;
  triggerButtonClassName?: string;
  clearAllButtonClassName?: string;
  selectedBarClassName?: string;
  facilityId?: string;
  disabled?: boolean;
  align?: "start" | "end";
}
export default function MultiFilter({
  selectedFilters,
  onFilterChange,
  onOperationChange,
  onClearAll,
  onClearFilter,
  placeholder = "Filter",
  className,
  triggerButtonClassName,
  clearAllButtonClassName,
  selectedBarClassName,
  facilityId,
  disabled = false,
  align = "start",
}: MultiFilterProps) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [operationPickerKey, setOperationPickerKey] = useState<string | null>(
    null,
  );
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const activeFiltersCount = Object.values(selectedFilters).reduce(
    (sum, filterState) => {
      if (Array.isArray(filterState.selected)) {
        if (filterState.selected.length === 0) {
          return sum;
        }
      }
      return sum + 1;
    },
    0,
  );

  const nonClearableFilterCount = Object.values(selectedFilters).reduce(
    (sum, filterState) => {
      if (filterState.filter.disableClear) {
        return sum;
      }
      if (Array.isArray(filterState.selected)) {
        if (filterState.selected.length === 0) {
          return sum;
        }
      }
      return sum + 1;
    },
    0,
  );

  const hasAnyFilters = nonClearableFilterCount > 0;

  const handleFilterSelect = (filterKey: string) => {
    setOperationPickerKey(null);
    setActiveFilter(filterKey);
    setOpen(true);
  };

  const handleSelectedFilterClick = (filterKey: string) => {
    if (isMobile) {
      setOperationPickerKey(null);
      setActiveFilter(filterKey);
      setOpen(true);
      return;
    }
    setActiveFilter(filterKey);
    setOpenStates((prev) => ({ ...prev, [filterKey]: true }));
  };

  const handleOpenOperationPicker = (filterKey: string) => {
    setActiveFilter(null);
    setOperationPickerKey(filterKey);
    setOpen(true);
  };

  const handleBack = () => {
    setActiveFilter(null);
    setOperationPickerKey(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setActiveFilter(null);
      setOperationPickerKey(null);
    }
  };

  const handleClearAll = () => {
    onClearAll();
    handleOpenChange(false);
  };

  useKeyboardShortcut(
    ["ArrowLeft"],
    () => {
      if (!activeFilter && !operationPickerKey) {
        handleOpenChange(false);
      }
    },
    {
      overrideSystem: true,
    },
  );

  const triggerButton = (
    <Button
      variant="outline"
      className={cn(
        "justify-between font-semibold",
        hasAnyFilters && "border-blue-300 bg-blue-50",
        triggerButtonClassName,
      )}
      disabled={disabled}
    >
      <ListFilter className="h-3 w-3" />
      <span className="truncate">{placeholder}</span>
    </Button>
  );

  const clearAllButton = activeFiltersCount > 1 && (
    <Button
      variant="ghost"
      onClick={handleClearAll}
      className={cn(
        "text-sm text-gray-950 underline items-center w-auto self-start",
        clearAllButtonClassName,
      )}
    >
      <X strokeWidth={1.5} />
      {t("clear_all")}
    </Button>
  );

  const drawerBody = (() => {
    if (operationPickerKey) {
      return (
        <OperationPickerPanel
          filterKey={operationPickerKey}
          selectedFilters={selectedFilters}
          onBack={handleBack}
          onSelect={(operation) => {
            onOperationChange(
              operationPickerKey,
              operation.value || operation.label,
            );
            setOperationPickerKey(null);
            setActiveFilter(operationPickerKey);
          }}
        />
      );
    }

    if (activeFilter) {
      return (
        <div className="flex-1 overflow-y-auto min-h-0">
          <DrawerTitle className="sr-only">
            {t(selectedFilters[activeFilter]?.filter.label ?? "filters")}
          </DrawerTitle>
          <FilterRenderer
            activeFilter={activeFilter}
            selectedFilters={selectedFilters}
            handleBack={handleBack}
            onFilterChange={onFilterChange}
            facilityId={facilityId}
            presentation="drawer"
          />
        </div>
      );
    }

    return (
      <>
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle>{placeholder || t("filters")}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto min-h-0">
          <FilterList
            variant="drawer"
            handleFilterSelect={handleFilterSelect}
            selectedFilters={selectedFilters}
            setActiveFilter={setActiveFilter}
          />
        </div>
        {activeFiltersCount > 1 && (
          <DrawerFooter className="border-t border-gray-200 py-2">
            <Button
              variant="ghost"
              onClick={handleClearAll}
              className="text-sm text-gray-950 underline items-center w-auto self-start"
            >
              <X strokeWidth={1.5} />
              {t("clear_all")}
            </Button>
          </DrawerFooter>
        )}
      </>
    );
  })();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange} repositionInputs>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent className="flex flex-col min-h-[50vh] max-h-[85vh] pb-[env(safe-area-inset-bottom)]">
            {drawerBody}
          </DrawerContent>
        </Drawer>
      ) : (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[calc(100vw)] max-w-[calc(100vw-3rem)] sm:max-w-xs p-0"
            align={align}
          >
            {activeFilter ? (
              <FilterRenderer
                activeFilter={activeFilter}
                selectedFilters={selectedFilters}
                handleBack={handleBack}
                onFilterChange={onFilterChange}
                facilityId={facilityId}
                presentation="menu"
              />
            ) : (
              <FilterList
                variant="menu"
                handleFilterSelect={handleFilterSelect}
                selectedFilters={selectedFilters}
                setActiveFilter={setActiveFilter}
              />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {Object.entries(selectedFilters).map(([key, _]) => {
        const filterState = selectedFilters[key];
        if (
          (Array.isArray(filterState.selected) &&
            filterState.selected.length === 0) ||
          (!Array.isArray(filterState.selected) &&
            !("from" in filterState.selected) &&
            !("to" in filterState.selected)) ||
          !filterState
        ) {
          return null;
        }
        return (
          <SelectedFilterBar
            key={key}
            selectedFilterKey={key}
            selectedFilters={selectedFilters}
            onClick={() => handleSelectedFilterClick(key)}
            onOpenOperationPicker={() => handleOpenOperationPicker(key)}
            clearFilter={() => onClearFilter(key)}
            openState={openStates[key] || false}
            setOpenState={(isOpen) =>
              setOpenStates((prev) => ({ ...prev, [key]: isOpen }))
            }
            onFilterChange={onFilterChange}
            onOperationChange={onOperationChange}
            selectedBarClassName={selectedBarClassName}
            facilityId={facilityId}
            isMobile={isMobile}
          />
        );
      })}
      {clearAllButton}
    </div>
  );
}

function OperationPickerPanel({
  filterKey,
  selectedFilters,
  onBack,
  onSelect,
}: {
  filterKey: string;
  selectedFilters: Record<string, FilterState>;
  onBack: () => void;
  onSelect: (operation: Operation) => void;
}) {
  const { t } = useTranslation();
  const { filter, selectedOperation, availableOperations } = useMultiFilter(
    filterKey,
    selectedFilters,
  );

  return (
    <>
      <DrawerHeader className="pb-2 text-left border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <DrawerTitle className="text-base">{t(filter.label)}</DrawerTitle>
        </div>
      </DrawerHeader>
      <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2">
        {(availableOperations ?? []).map((option) => {
          const isSelected =
            selectedOperation?.value === option.value ||
            selectedOperation?.label === option.label;
          return (
            <button
              type="button"
              key={option.value || option.label}
              onClick={() => onSelect(option)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-3 min-h-11 text-left text-sm hover:bg-gray-50",
                isSelected && "bg-gray-50 font-medium",
              )}
            >
              {t(option.label)}
            </button>
          );
        })}
      </div>
    </>
  );
}

function FilterList({
  handleFilterSelect,
  selectedFilters,
  setActiveFilter,
  variant = "menu",
}: {
  handleFilterSelect: (filterKey: string) => void;
  selectedFilters: Record<string, FilterState>;
  setActiveFilter: (filterKey: string | null) => void;
  variant?: "menu" | "drawer";
}) {
  const { t } = useTranslation();
  const [focusItemRef, setFocusItemRef] = useState<HTMLDivElement | null>(null);
  const isDrawer = variant === "drawer";

  const { focusItemIndex, setFocusItemIndex } =
    useMultiFilterNavigationShortcuts(Object.keys(selectedFilters).length, () =>
      setActiveFilter(null),
    );

  useKeyboardShortcut(
    ["ArrowRight"],
    () => {
      if (focusItemIndex !== null) {
        handleFilterSelect(Object.keys(selectedFilters)[focusItemIndex]);
      }
    },
    {
      overrideSystem: true,
    },
  );

  useEffect(() => {
    if (focusItemRef) {
      focusItemRef.focus();
    }
  }, [focusItemRef]);

  const rowContent = (
    filter: FilterState["filter"],
    selectedLength: number,
  ) => (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className="border border-dotted border-gray-600 rounded w-3 h-3 mb-0.5 shrink-0"></span>
        <span className="text-sm truncate">{t(filter.label)}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {selectedLength > 0 && (
          <span className="text-xs text-gray-500">{selectedLength}</span>
        )}
        <ChevronRight className="h-4 w-4" />
      </div>
    </>
  );

  return (
    <div className={cn("px-2", isDrawer ? "pt-1 pb-2" : "pt-2")}>
      {Object.values(selectedFilters).map(({ filter }, index) => {
        const selected = selectedFilters[filter.key]?.selected;
        const selectedLength = Array.isArray(selected) ? selected.length : 0;

        if (isDrawer) {
          return (
            <button
              type="button"
              key={filter.key}
              onClick={() => handleFilterSelect(filter.key)}
              className="flex w-full items-center justify-between px-3 py-3 min-h-11 rounded-md cursor-pointer hover:bg-gray-50"
            >
              {rowContent(filter, selectedLength)}
            </button>
          );
        }

        return (
          <DropdownMenuItem
            key={filter.key}
            ref={index === focusItemIndex ? setFocusItemRef : null}
            onSelect={(e) => {
              e.preventDefault();
              handleFilterSelect(filter.key);
            }}
            className={cn(
              "flex items-center justify-between px-3 py-2 cursor-pointer",
            )}
            onFocus={() => setFocusItemIndex(index)}
          >
            {rowContent(filter, selectedLength)}
          </DropdownMenuItem>
        );
      })}
      {!isDrawer && <NavigationHelper isActiveFilter={false} />}
    </div>
  );
}
