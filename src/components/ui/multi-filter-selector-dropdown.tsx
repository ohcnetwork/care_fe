import { useQuery } from "@tanstack/react-query";
import {
  format,
  formatDate,
  isBefore,
  isSameDay,
  isValid,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { ChevronDown, ChevronRight, Folder, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import query from "@/Utils/request/query";
import {
  ENCOUNTER_CLASS,
  ENCOUNTER_STATUS,
  ENCOUNTER_STATUS_COLORS,
} from "@/types/emr/encounter/encounter";
import {
  TagConfig,
  TagResource,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

import { Calendar } from "./calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

// Shared utilities and hooks
const getColorForOption = (index: number) => {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

// Shared components and hooks
function FilterHeader({
  label,
  onBack,
}: {
  label: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-6 w-6 p-0"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
      </Button>
      <span className="text-sm font-medium">{t(label)}</span>
    </div>
  );
}

function FilterOptionsList({
  options,
  selectedValues,
  onOptionToggle,
  showColorIndicators,
  focusItemIndex,
  setFocusItemIndex,
}: {
  options: FilterOption[];
  selectedValues: string[];
  onOptionToggle: (value: string, checked: boolean) => void;
  showColorIndicators?: boolean;
  focusItemIndex: number | null;
  setFocusItemIndex: (index: number) => void;
}) {
  const { t } = useTranslation();
  const [focusItemRef, setFocusItemRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (focusItemRef) {
      focusItemRef.focus();
    }
  }, [focusItemRef]);

  return (
    <div className="flex flex-col gap-1">
      {options.map((option, index) => (
        <div
          key={option.value}
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
          ref={index === focusItemIndex ? setFocusItemRef : null}
          onFocus={() => setFocusItemIndex(index)}
          tabIndex={index}
          onKeyDown={(e) => {
            if (e.key === " ") {
              e.preventDefault();
              onOptionToggle(
                option.value,
                !selectedValues.includes(option.value),
              );
            }
          }}
        >
          <Checkbox
            checked={selectedValues.includes(option.value)}
            onCheckedChange={(checked) =>
              onOptionToggle(option.value, checked as boolean)
            }
            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          {showColorIndicators && (
            <div
              className={cn(
                "h-3 w-3 rounded-full flex-shrink-0",
                getColorForOption(index),
              )}
            />
          )}
          <span className="text-sm text-gray-700 flex-1">
            {t(option.label)}
          </span>
        </div>
      ))}
    </div>
  );
}

function useFilterSearch<T extends { value: string }>(items: T[]) {
  const [search, setSearch] = useState("");
  const filteredItems = items.filter((item) =>
    item.value.toLowerCase().includes(search.toLowerCase()),
  );

  return {
    search,
    setSearch,
    filteredItems,
  };
}

// Generic color palette for cycling through options
const COLOR_PALETTE = [
  "bg-blue-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-orange-100",
  "bg-red-100",
  "bg-purple-100",
  "bg-pink-100",
  "bg-indigo-100",
  "bg-teal-100",
  "bg-cyan-100",
  "bg-emerald-100",
  "bg-violet-100",
] as const;

const BADGE_BORDER_COLORS = [
  "border-blue-300",
  "border-green-300",
  "border-yellow-300",
  "border-orange-300",
  "border-red-300",
  "border-purple-300",
  "border-pink-300",
  "border-indigo-300",
  "border-teal-300",
  "border-cyan-300",
  "border-emerald-300",
  "border-violet-300",
] as const;

const BADGE_TEXT_COLORS = [
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-orange-500",
  "text-red-500",
  "text-purple-500",
  "text-pink-500",
  "text-indigo-500",
  "text-teal-500",
  "text-cyan-500",
  "text-emerald-500",
  "text-violet-500",
] as const;

interface FilterOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
  type?: "command" | "tag" | "date";
  resource?: TagResource;
  icon?: React.ReactNode;
  renderSelected?: (
    selected: string[] | TagConfig[] | FilterDateRange,
  ) => React.ReactNode;
  getOperations?: (
    selected: string[] | TagConfig[] | FilterDateRange,
  ) => string[];
}

interface MultiFilterSelectorDropdownProps {
  selectedFilters: Record<string, FilterState>;
  onFilterChange: (
    filterKey: string,
    values: string[] | TagConfig[] | FilterDateRange,
  ) => void;
  onOperationChange: (filterKey: string, operation: string) => void;
  onClearAll: () => void;
  onClearFilter: (filterKey: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export interface OperationConfig {
  selectedOperation: string | null;
  availableOperations: string[];
}

export interface FilterState {
  filter: FilterConfig;
  operation: OperationConfig;
  selected: string[] | TagConfig[] | FilterDateRange;
}

interface FilterDateRange {
  from: Date;
  to: Date;
}

export function useFilterState(filters: FilterConfig[]) {
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, FilterState>
  >(
    filters.reduce(
      (acc, filter) => ({
        ...acc,
        [filter.key]: {
          filter,
          selected: [],
          operation: { selectedOperation: null, availableOperations: [] },
        },
      }),
      {},
    ),
  );

  const handleFilterChange = (
    filterKey: string,
    values: string[] | TagConfig[] | FilterDateRange,
  ) => {
    const filter = selectedFilters[filterKey]?.filter;
    const operations = filter?.getOperations?.(values) ?? [];
    const currentSelectedOperation =
      selectedFilters[filterKey]?.operation.selectedOperation;
    const selectedOperation =
      currentSelectedOperation && operations.includes(currentSelectedOperation)
        ? currentSelectedOperation
        : operations?.[0];
    if (filter) {
      setSelectedFilters((prev) => ({
        ...prev,
        [filterKey]: {
          ...(selectedFilters[filterKey] ?? { filter }),
          selected: values,
          operation: {
            selectedOperation,
            availableOperations: operations,
          },
        },
      }));
    }
  };

  const handleOperationChange = (filterKey: string, operation: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        operation: {
          ...prev[filterKey].operation,
          selectedOperation: operation,
        },
      },
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key].selected = [];
        newState[key].operation.selectedOperation = null;
        newState[key].operation.availableOperations = [];
      });
      return newState;
    });
  };

  const handleClearFilter = (filterKey: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterKey]: { ...prev[filterKey], selected: [] },
    }));
  };

  return {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  };
}

function useNavigationShortcuts(
  optionsLength: number,
  handleBack?: () => void,
) {
  const [focusItemIndex, setFocusItemIndex] = useState<number | null>(null);

  useKeyboardShortcut(
    ["ArrowUp"],
    () => {
      if (focusItemIndex === null) {
        setFocusItemIndex(optionsLength - 1);
      } else {
        const newIndex = (focusItemIndex - 1 + optionsLength) % optionsLength;
        setFocusItemIndex(newIndex);
      }
    },
    {
      overrideSystem: true,
    },
  );

  useKeyboardShortcut(
    ["ArrowDown"],
    () => {
      if (focusItemIndex === null) {
        setFocusItemIndex(0);
      } else {
        const newIndex = (focusItemIndex + 1) % optionsLength;
        setFocusItemIndex(newIndex);
      }
    },
    {
      overrideSystem: true,
    },
  );

  useKeyboardShortcut(
    ["ArrowLeft"],
    () => {
      handleBack?.();
    },
    {
      overrideSystem: true,
    },
  );

  return { focusItemIndex, setFocusItemIndex };
}

function RenderNavigationHelper({
  isActiveFilter,
}: {
  isActiveFilter?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Separator orientation="horizontal" className="bg-gray-200 h-px" />
      <div className="flex justify-between">
        <div className="flex gap-1 my-2 mx-2">
          {isActiveFilter && (
            <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
              <CareIcon icon="l-arrow-left" className="h-4 w-4" />
            </div>
          )}
          <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
            <CareIcon icon="l-arrow-down" className="h-4 w-4" />
          </div>
          <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
            <CareIcon icon="l-arrow-up" className="h-4 w-4" />
          </div>
          {!isActiveFilter && (
            <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
              <CareIcon icon="l-arrow-right" className="h-4 w-4" />
            </div>
          )}
          <span className="text-xs text-gray-500 self-center">
            {t("navigate")}
          </span>
        </div>
        {isActiveFilter ? (
          <div className="flex gap-1 my-2 mx-2">
            <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
              <CareIcon icon="l-space-key" className="h-4 w-4" />
            </div>
            <span className="text-xs text-gray-500 self-center">
              {t("select")}
            </span>
          </div>
        ) : (
          <div className="flex gap-1 my-2 mx-2">
            <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
              <CareIcon icon="l-enter" className="h-4 w-4" />
            </div>
            <span className="text-xs text-gray-500 self-center">
              {t("open")}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export function MultiFilterSelectorDropdown({
  selectedFilters,
  onFilterChange,
  onOperationChange,
  onClearAll,
  onClearFilter,
  placeholder = "Filter",
  className,
  disabled = false,
}: MultiFilterSelectorDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  const totalSelectedCount = Object.values(selectedFilters).reduce(
    (sum, filterState) => {
      if (Array.isArray(filterState.selected)) {
        return sum + filterState.selected.length;
      }
      return sum + 1;
    },
    0,
  );

  const hasAnyFilters = totalSelectedCount > 0;

  const handleFilterSelect = (filterKey: string) => {
    setActiveFilter(filterKey);
    setOpen(true);
  };

  const handleSelectedFilterClick = (filterKey: string) => {
    setActiveFilter(filterKey);
    setOpenStates((prev) => ({ ...prev, [filterKey]: true }));
  };

  const handleBack = () => {
    setActiveFilter(null);
  };

  const _handleClearAll = () => {
    onClearAll();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      setActiveFilter(null);
    }
  }, [open]);

  useKeyboardShortcut(
    ["ArrowLeft"],
    () => {
      if (!activeFilter) {
        setOpen(false);
      }
    },
    {
      overrideSystem: true,
    },
  );

  return (
    <div className="flex flex-col gap-2 px-1">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-between min-w-[200px]",
              hasAnyFilters && "border-blue-300 bg-blue-50",
              className,
            )}
            disabled={disabled}
          >
            <span className="truncate">{placeholder}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[320px] p-0" align="start">
          {activeFilter ? (
            <RenderFilter
              activeFilter={activeFilter}
              selectedFilters={selectedFilters}
              handleBack={handleBack}
              onFilterChange={onFilterChange}
            />
          ) : (
            <RenderFilterList
              handleFilterSelect={handleFilterSelect}
              selectedFilters={selectedFilters}
              setActiveFilter={setActiveFilter}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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
          return <></>;
        }
        return (
          <SelectedFilterBar
            key={key}
            selectedFilterKey={key}
            selectedFilters={selectedFilters}
            onClick={() => handleSelectedFilterClick(key)}
            clearFilter={() => onClearFilter(key)}
            openState={openStates[key] || false}
            setOpenState={(isOpen) =>
              setOpenStates((prev) => ({ ...prev, [key]: isOpen }))
            }
            onFilterChange={onFilterChange}
            onOperationChange={onOperationChange}
          />
        );
      })}
    </div>
  );
}

interface DateRangeOption {
  label: string;
  getDateRange: () => { from: Date; to: Date };
}

function RenderDateFilter({
  filter,
  selected,
  onFilterChange,
  handleBack,
}: {
  filter: FilterConfig;
  selected: FilterDateRange;
  onFilterChange: (
    filterKey: string,
    values: FilterDateRange | TagConfig[] | string[],
  ) => void;
  handleBack?: () => void;
}) {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(selected.from);
  const [dateTo, setDateTo] = useState<Date | undefined>(selected.to);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  const dateRangeOptions: DateRangeOption[] = [
    {
      label: t("last_count_days", { count: 7 }),
      getDateRange: () => ({
        from: subDays(new Date(), 7),
        to: new Date(),
      }),
    },
    {
      label: t("last_count_weeks", { count: 3 }),
      getDateRange: () => ({
        from: subWeeks(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: t("last_month"),
      getDateRange: () => ({
        from: subMonths(new Date(), 1),
        to: new Date(),
      }),
    },
    {
      label: t("last_count_months", { count: 3 }),
      getDateRange: () => ({
        from: subMonths(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: t("last_count_months", { count: 6 }),
      getDateRange: () => ({
        from: subMonths(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: t("last_year"),
      getDateRange: () => ({
        from: subYears(new Date(), 1),
        to: new Date(),
      }),
    },
  ];

  const handleDateRangeSelect = (option: DateRangeOption) => {
    const { from, to } = option.getDateRange();
    setDateFrom(from);
    setDateTo(to);
    onFilterChange(filter.key, { from, to });
  };

  const handleDateChange = (date: { from?: Date; to?: Date }) => {
    setDateFrom(date?.from);
    setDateTo(date?.to);
  };

  const isSameRange = (option: DateRangeOption) => {
    const { from, to } = option.getDateRange();
    return (
      dateFrom && isSameDay(dateFrom, from) && dateTo && isSameDay(dateTo, to)
    );
  };

  const isCustomDateRangeSelected =
    selected.from &&
    selected.to &&
    !dateRangeOptions.some((option) => isSameRange(option));

  const [focusItemRef, setFocusItemRef] = useState<HTMLButtonElement | null>(
    null,
  );
  const { focusItemIndex, setFocusItemIndex } = useNavigationShortcuts(
    dateRangeOptions.length + 1,
    handleBack,
  );

  useEffect(() => {
    if (focusItemRef) {
      focusItemRef.focus();
    }
  }, [focusItemRef]);

  useEffect(() => {
    setDateFrom(selected.from);
    setDateTo(selected.to);
  }, [selected]);

  return (
    <div className="pt-0">
      {handleBack && !isCustomDateRange && (
        <FilterHeader label={filter.label} onBack={handleBack} />
      )}
      {isCustomDateRange && (
        <FilterHeader
          label={"custom_date_range"}
          onBack={() => setIsCustomDateRange(false)}
        />
      )}
      <div className="px-2 pt-2 max-h-[calc(100vh-30rem)] overflow-y-auto">
        {isCustomDateRange ? (
          <div className="flex flex-col gap-2 p-0 pb-2">
            <Calendar
              mode="range"
              selected={{ from: dateFrom, to: dateTo }}
              onSelect={(date) => {
                if (date) {
                  handleDateChange(date);
                }
              }}
              className="w-full"
              styles={{
                day: {
                  width: "40px",
                },
                weekdays: {
                  width: "100%",
                  justifyContent: "space-between",
                },
                nav: {
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: "0.5rem",
                },
              }}
            />
            <div className="my-2">
              <Separator
                orientation="horizontal"
                className="bg-gray-200 h-px"
              />
            </div>
            <div className="flex flex-col gap-2 p-0 pb-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block capitalize">
                  {t("from")}
                </label>
                <Input
                  type="date"
                  value={dateFrom ? format(dateFrom, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setDateFrom(new Date(e.target.value));
                    } else {
                      setDateFrom(undefined);
                    }
                  }}
                  placeholder={t("start_date")}
                  className="flex flex-col justify-between"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block capitalize">
                  {t("to")}
                </label>
                <Input
                  type="date"
                  value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setDateTo(new Date(e.target.value));
                    } else {
                      setDateTo(undefined);
                    }
                  }}
                  placeholder={t("end_date")}
                  className="flex flex-col justify-between"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              {dateRangeOptions.map((option, index) => (
                <Button
                  key={index}
                  ref={index === focusItemIndex ? setFocusItemRef : null}
                  onFocus={() => setFocusItemIndex(index)}
                  onClick={() => handleDateRangeSelect(option)}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-3 font-medium text-sm text-gray-950",
                    isSameRange(option) &&
                      "bg-gray-100 border-green-500 border",
                  )}
                >
                  {option.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                ref={
                  dateRangeOptions.length === focusItemIndex
                    ? setFocusItemRef
                    : null
                }
                className={cn(
                  "w-full justify-between px-3 font-medium text-sm text-gray-950",
                  isCustomDateRangeSelected &&
                    "bg-gray-100 border-green-500 border",
                )}
                onClick={() => setIsCustomDateRange(true)}
                onFocus={() => setFocusItemIndex(dateRangeOptions.length)}
              >
                {t("custom_date_range")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <RenderNavigationHelper isActiveFilter={true} />
          </>
        )}
      </div>
      {isCustomDateRange && (
        <div className="px-2 pb-2">
          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={() => {
              if (dateFrom && dateTo) {
                onFilterChange(filter.key, { from: dateFrom, to: dateTo });
                setIsCustomDateRange(false);
              } else if (dateFrom) {
                onFilterChange(filter.key, { from: dateFrom, to: dateFrom });
                setIsCustomDateRange(false);
              } else if (dateTo) {
                onFilterChange(filter.key, { from: dateTo, to: dateTo });
                setIsCustomDateRange(false);
              }
            }}
          >
            {t("confirm")}
          </Button>
        </div>
      )}
    </div>
  );
}

function RenderFilterList({
  handleFilterSelect,
  selectedFilters,
  setActiveFilter,
}: {
  handleFilterSelect: (filterKey: string) => void;
  selectedFilters: Record<string, FilterState>;
  setActiveFilter: (filterKey: string | null) => void;
}) {
  const { t } = useTranslation();
  const [focusItemRef, setFocusItemRef] = useState<HTMLDivElement | null>(null);

  const { focusItemIndex, setFocusItemIndex } = useNavigationShortcuts(
    Object.keys(selectedFilters).length,
    () => setActiveFilter(null),
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

  return (
    <div className="px-2 pt-2">
      {Object.values(selectedFilters).map(({ filter }, index) => {
        const selected = selectedFilters[filter.key]?.selected as string[];
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
            <div className="flex items-center gap-2">
              <span className="border border-dotted border-gray-600 rounded w-3 h-3 mb-0.5"></span>
              <span className="text-sm">{t(filter.label)}</span>
            </div>
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <span className="text-xs text-gray-500">{selected.length}</span>
              )}
              <ChevronRight className="h-4 w-4" />
            </div>
          </DropdownMenuItem>
        );
      })}
      <RenderNavigationHelper isActiveFilter={false} />
    </div>
  );
}

function RenderTagFilter({
  filter,
  selectedTags,
  onFilterChange,
  handleBack,
}: {
  filter: FilterConfig;
  selectedTags: TagConfig[];
  onFilterChange: (
    filterKey: string,
    values: string[] | TagConfig[] | FilterDateRange,
  ) => void;
  handleBack?: () => void;
}) {
  return (
    <div className="p-0">
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <TagFilterDropdown
        selectedTags={selectedTags}
        onTagsChange={(tags) => {
          onFilterChange(filter.key, tags);
        }}
        resource={filter.resource!}
        placeholder={filter.placeholder}
        handleBack={handleBack}
      />
    </div>
  );
}

function RenderFilter({
  activeFilter,
  selectedFilters,
  onFilterChange,
  handleBack,
}: {
  activeFilter: string;
  selectedFilters: Record<string, FilterState>;
  onFilterChange: (
    filterKey: string,
    values: string[] | TagConfig[] | FilterDateRange,
  ) => void;
  handleBack?: () => void;
}) {
  const filterState = selectedFilters[activeFilter];
  const filter = filterState?.filter;
  if (!filter) return null;

  const selected = selectedFilters[filter.key].selected || [];
  const commonProps = {
    filter,
    handleBack,
    onFilterChange,
  };

  switch (filter.type) {
    case "date":
      return (
        <RenderDateFilter
          {...commonProps}
          selected={selected as FilterDateRange}
        />
      );
    case "tag":
      return (
        <>
          <RenderTagFilter
            {...commonProps}
            selectedTags={selected as TagConfig[]}
          />
          <RenderNavigationHelper isActiveFilter={true} />
        </>
      );
    default:
      return (
        <>
          <FilterOptionsDropdown
            {...commonProps}
            selectedValues={selected as string[]}
            showColorIndicators={true}
          />
          <RenderNavigationHelper isActiveFilter={true} />
        </>
      );
  }
}

// Component for regular filter options
function FilterOptionsDropdown({
  filter,
  selectedValues = [],
  handleBack,
  onFilterChange,
  showColorIndicators = false,
}: {
  filter: FilterConfig;
  selectedValues?: string[];
  handleBack?: () => void;
  onFilterChange?: (
    filterKey: string,
    values: string[] | TagConfig[] | FilterDateRange,
  ) => void;
  showColorIndicators?: boolean;
}) {
  const { t } = useTranslation();
  const {
    search,
    setSearch,
    filteredItems: filteredOptions,
  } = useFilterSearch(filter.options);

  const handleOptionToggle = (value: string, checked: boolean) => {
    if (!onFilterChange) return;

    if (checked) {
      onFilterChange(filter.key, [...selectedValues, value]);
    } else {
      onFilterChange(
        filter.key,
        selectedValues.filter((v) => v !== value),
      );
    }
  };

  const { focusItemIndex, setFocusItemIndex } = useNavigationShortcuts(
    filteredOptions.length,
    handleBack,
  );

  return (
    <div className="p-0">
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <div className="p-3 max-h-[calc(100vh-28rem)] overflow-y-auto">
        <Input
          placeholder="Search options..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm mb-3"
        />
        <div className="">
          {filteredOptions.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              {t("no_results_found")}
            </div>
          ) : (
            <FilterOptionsList
              options={filteredOptions}
              selectedValues={selectedValues}
              onOptionToggle={handleOptionToggle}
              showColorIndicators={showColorIndicators}
              focusItemIndex={focusItemIndex}
              setFocusItemIndex={setFocusItemIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Component for tag filter dropdown
function TagFilterDropdown({
  selectedTags,
  onTagsChange,
  resource,
  placeholder: _placeholder,
  handleBack,
}: {
  selectedTags: TagConfig[];
  onTagsChange: (tags: TagConfig[]) => void;
  resource: TagResource;
  placeholder?: string;
  handleBack?: () => void;
}) {
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  // Fetch root-level tags
  const { data: rootTags, isLoading } = useQuery({
    queryKey: ["tags", resource, search],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent_is_null: true,
        status: "active",
        ordering: "priority",
        ...(search ? { search } : {}),
      },
    }),
    enabled: true,
  });

  const getColorForTag = (tagId: string, index: number) => {
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  const handleTagToggle = (tag: TagConfig) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const filteredTags =
    rootTags?.results?.filter((tag) =>
      tag.display.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  // Separate tags into groups
  const rootLevelGroupTags = filteredTags.filter((tag) => tag.has_children);
  const nonSelectedRootLevelTags = filteredTags.filter(
    (tag) => !tag.has_children && !selectedTags.some((t) => t.id === tag.id),
  );

  const [hasOpenSubmenu, setHasOpenSubmenu] = useState(false);

  useKeyboardShortcut(
    ["ArrowLeft"],
    () => {
      if (!hasOpenSubmenu) {
        handleBack?.();
      }
    },
    {
      overrideSystem: true,
    },
  );

  return (
    <div className="p-3 max-h-[calc(100vh-28rem)] overflow-y-auto">
      <Input
        placeholder="Search tags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm mb-3"
      />
      <div>
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("selected_tags")}
            </div>
            {selectedTags.map((tag, index) => (
              <DropdownMenuItem
                key={tag.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleTagToggle(tag);
                }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
              >
                <Checkbox checked={true} className="h-4 w-4" />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0",
                      getColorForTag(tag.id, index),
                    )}
                  />
                  <span className="text-sm">
                    {tag.parent ? `${tag.parent.display} > ` : ""}
                    {tag.display}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Groups */}
        {rootLevelGroupTags.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("tag_groups")}
            </div>
            {rootLevelGroupTags.map((group) => (
              <GroupSubmenu
                key={group.id}
                group={group}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                resource={resource}
                getColorForTag={getColorForTag}
                onSubMenuOpen={(open) => {
                  setHasOpenSubmenu(open);
                }}
              />
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Other Tags */}
        {nonSelectedRootLevelTags.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("other_tags")}
            </div>
            {nonSelectedRootLevelTags.map((tag, index) => (
              <DropdownMenuItem
                key={tag.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleTagToggle(tag);
                }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
              >
                <Checkbox checked={false} className="h-4 w-4" />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0",
                      getColorForTag(tag.id, index),
                    )}
                  />
                  <span className="text-sm">{tag.display}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {isLoading && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            {t("loading")}
          </div>
        )}

        {!isLoading && filteredTags.length === 0 && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            {t("no_tags_group")}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for group submenu with children
function GroupSubmenu({
  group,
  selectedTags,
  onTagToggle,
  resource,
  getColorForTag,
  onSubMenuOpen,
}: {
  group: TagConfig;
  selectedTags: TagConfig[];
  onTagToggle: (tag: TagConfig) => void;
  resource: TagResource;
  getColorForTag: (tagId: string, index: number) => string;
  onSubMenuOpen: (isOpen: boolean) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["tags", resource, "parent", group.id],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent: group.id,
        status: "active",
        ordering: "priority",
      },
    }),
    enabled: true,
  });

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        onSubMenuOpen(false);
      }, 100);
    } else {
      onSubMenuOpen(true);
    }
  }, [open, onSubMenuOpen]);

  return (
    <DropdownMenuSub
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1">
        <div className="flex items-center gap-2 flex-1">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{group.display}</span>
          <Badge variant="outline" className="text-xs">
            {t("group")}
          </Badge>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-[280px]">
        <div className="p-2 border-b border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {group.display}
          </div>
        </div>
        {loadingChildren ? (
          <div className="p-2 text-sm text-gray-500">{t("loading")}</div>
        ) : children?.results?.length ? (
          children.results.map((childTag: TagConfig, index: number) => {
            const isSelected = selectedTags.some((t) => t.id === childTag.id);
            return (
              <DropdownMenuItem
                key={childTag.id}
                onSelect={(e) => {
                  e.preventDefault();
                  onTagToggle(childTag);
                }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
              >
                <Checkbox checked={isSelected} className="h-4 w-4" />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0",
                      getColorForTag(childTag.id, index),
                    )}
                  />
                  <span className="text-sm">{childTag.display}</span>
                </div>
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="p-2 text-sm text-gray-500">{t("no_tags")}</div>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function createFilterConfig(
  key: string,
  label: string,
  type: "command" | "tag" | "date",
  options: FilterOption[],
  resource?: TagResource,
  renderSelected?: (
    selected: string[] | TagConfig[] | FilterDateRange,
  ) => React.ReactNode,
  getOperations?: (
    selected: string[] | TagConfig[] | FilterDateRange,
  ) => string[],
): FilterConfig {
  return {
    key,
    label,
    type,
    options,
    resource,
    renderSelected,
    getOperations,
  };
}

function SubMenuFilter({
  selectedOption,
  setSelectedOption,
  availableOptions,
}: {
  selectedOption: string;
  setSelectedOption: (option: string) => void;
  availableOptions: string[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 underline cursor-pointer text-xs">
          {t(selectedOption ?? "")}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
        align="start"
      >
        {availableOptions.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => setSelectedOption(option)}
          >
            {t(option)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useFilter(key: string, selectedFilters: Record<string, FilterState>) {
  const filterState = selectedFilters[key];
  const filter = filterState.filter;
  const selected = filterState.selected;
  const { selectedOperation, availableOperations } = filterState.operation;

  return {
    filter,
    selected,
    selectedOperation,
    availableOperations,
  };
}

function SelectedFilterBar({
  selectedFilterKey,
  selectedFilters,
  onClick,
  clearFilter,
  openState,
  setOpenState,
  onFilterChange,
  onOperationChange,
}: {
  selectedFilterKey: string;
  selectedFilters: Record<string, FilterState>;
  onClick: () => void;
  clearFilter: () => void;
  openState: boolean;
  setOpenState: (open: boolean) => void;
  onFilterChange: (
    filterKey: string,
    values: string[] | TagConfig[] | FilterDateRange,
  ) => void;
  onOperationChange: (filterKey: string, operation: string) => void;
}) {
  const { t } = useTranslation();
  const { filter, selected, selectedOperation, availableOperations } =
    useFilter(selectedFilterKey, selectedFilters);

  return (
    <DropdownMenu
      open={openState || false}
      onOpenChange={(isOpen) => setOpenState(isOpen)}
    >
      <div className="flex items-center bg-white rounded-md border border-gray-200 w-fit">
        <DropdownMenuTrigger asChild>
          <div
            className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 text-sm max-w-20"
            onClick={onClick}
          >
            {filter?.icon}
            <span className="truncate">{t(filter.label)}</span>
          </div>
        </DropdownMenuTrigger>
        <SubMenuFilter
          selectedOption={selectedOperation ?? ""}
          setSelectedOption={(operation) =>
            onOperationChange(filter.key, operation)
          }
          availableOptions={availableOperations ?? []}
        />
        <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200">
          {filter.renderSelected?.(selected)}
        </div>
        <Button
          variant="ghost"
          onClick={clearFilter}
          className="px-3 py-2 hover:bg-gray-50"
        >
          <X className="h-5 w-5 text-gray-600" />
        </Button>
      </div>
      <DropdownMenuContent className="w-[320px] p-0" align="start">
        <RenderFilter
          activeFilter={filter.key}
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper functions

const RenderSelectedBadge = ({
  selectedValue,
  selectedLength,
  color,
  borderColor,
  textColor,
}: {
  selectedValue: string;
  selectedLength: number;
  color: string;
  borderColor: string;
  textColor: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1">
      <Badge
        variant="outline"
        className={cn("text-xs", color, borderColor, textColor)}
      >
        {t(selectedValue)}
      </Badge>
      {selectedLength > 1 && (
        <span className="text-xs bg-gray-100 text-gray-500 px-1 rounded-md">
          +{selectedLength - 1}
        </span>
      )}
    </div>
  );
};

const RenderSelectedTagBadge = ({ selected }: { selected: TagConfig[] }) => {
  const { t } = useTranslation();
  const firstColor = COLOR_PALETTE[0];
  const secondColor = COLOR_PALETTE[1];
  return (
    <div className="flex items-center gap-2">
      {selected.length === 1 ? (
        <span className={cn(firstColor, "rounded-full w-2 h-2")}></span>
      ) : (
        <div className="relative w-4 h-2">
          <span
            className={cn(
              firstColor,
              "rounded-full w-2 h-2 absolute left-0 opacity-75",
            )}
          />
          <span
            className={cn(
              secondColor,
              "rounded-full w-2 h-2 absolute left-1 opacity-75",
            )}
          />
        </div>
      )}
      <Tooltip>
        <TooltipTrigger>
          <span className="text-sm">
            {selected.length} {t("tags", { count: selected.length })}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {selected.map((tag) => (
            <div key={tag.id}>{getTagHierarchyDisplay(tag)}</div>
          ))}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

const RenderSelectedDateBadge = ({
  selected,
}: {
  selected: FilterDateRange;
}) => {
  if (!isValid(selected.from) || !isValid(selected.to)) return <></>;
  const isSameDates =
    selected.from && selected.to && isSameDay(selected.from, selected.to);
  return (
    <div className="text-xs">
      {selected.from &&
      selected.to &&
      (selected.from === selected.to || isSameDates) ? (
        <span>{formatDate(selected.from, "d MMM yyyy")}</span>
      ) : (
        <span>
          {[selected.from, selected.to].map((date, index) => (
            <span key={date.toISOString() + index}>
              {index > 0 && "-"}
              <span>{formatDate(date, "d MMM yy")}</span>
            </span>
          ))}
        </span>
      )}
    </div>
  );
};

export const encounterStatusFilter = createFilterConfig(
  "encounter_status",
  "status",
  "command",
  Object.entries(ENCOUNTER_STATUS).map(([key, value]) => ({
    value: key,
    label: value,
    color: ENCOUNTER_STATUS_COLORS[key as keyof typeof ENCOUNTER_STATUS_COLORS],
  })),
  undefined,
  (selected: string[] | TagConfig[] | FilterDateRange) => {
    const selectedStatus = selected as string[];
    if (typeof selectedStatus[0] === "string") {
      const option = ENCOUNTER_STATUS[
        selectedStatus[0] as keyof typeof ENCOUNTER_STATUS
      ] as string;
      const firstSelectedIndex = Object.values(ENCOUNTER_STATUS).findIndex(
        (o) => o === option,
      );
      const color = COLOR_PALETTE[firstSelectedIndex % COLOR_PALETTE.length];
      const borderColor =
        BADGE_BORDER_COLORS[firstSelectedIndex % BADGE_BORDER_COLORS.length];
      const textColor =
        BADGE_TEXT_COLORS[firstSelectedIndex % BADGE_TEXT_COLORS.length];
      return (
        <RenderSelectedBadge
          selectedValue={option}
          selectedLength={selectedStatus.length}
          color={color}
          borderColor={borderColor}
          textColor={textColor}
        />
      );
    }
    return <></>;
  },
  () => ["is", "is_not"],
);

export const encounterClassFilter = createFilterConfig(
  "encounter_class",
  "class",
  "command",
  Object.entries(ENCOUNTER_CLASS).map(([key, value]) => ({
    value: key,
    label: `encounter_class__${value}`,
  })),
  undefined,
  (selected: string[] | TagConfig[] | FilterDateRange) => {
    const selectedClass = selected as string[];
    if (typeof selectedClass[0] === "string") {
      const option = ENCOUNTER_CLASS[
        selectedClass[0] as keyof typeof ENCOUNTER_CLASS
      ] as string;
      const firstSelectedIndex = Object.values(ENCOUNTER_CLASS).findIndex(
        (o) => o === option,
      );
      const color = COLOR_PALETTE[firstSelectedIndex % COLOR_PALETTE.length];
      const borderColor =
        BADGE_BORDER_COLORS[firstSelectedIndex % BADGE_BORDER_COLORS.length];
      const textColor =
        BADGE_TEXT_COLORS[firstSelectedIndex % BADGE_TEXT_COLORS.length];
      return (
        <RenderSelectedBadge
          selectedValue={`encounter_class__${option}`}
          selectedLength={selectedClass.length}
          color={color}
          borderColor={borderColor}
          textColor={textColor}
        />
      );
    }
    return <></>;
  },
  () => ["is", "is_not"],
);

export const tagFilter = createFilterConfig(
  "tags",
  "tags",
  "tag",
  [],
  TagResource.ENCOUNTER,
  (selected: string[] | TagConfig[] | FilterDateRange) => {
    return <RenderSelectedTagBadge selected={selected as TagConfig[]} />;
  },
  (selected: string[] | TagConfig[] | FilterDateRange) => {
    const selectedTags = selected as TagConfig[];
    if (selectedTags.length === 1) return ["includes", "does_not_include"];
    return ["has_all_of", "has_any_of", "exclude_if_any", "exclude_if_all"];
  },
);

const getDateOperations = (selected: FilterDateRange) => {
  if (
    isBefore(selected.from, new Date()) &&
    isSameDay(selected.from, selected.to)
  )
    return ["since", "on_or_before"];
  else if (isSameDay(selected.from, selected.to)) return ["is_on"];
  else return ["b/w"];
};

export const startedDateFilter = createFilterConfig(
  "started_date",
  "started_date",
  "date",
  [],
  undefined,
  (selected: string[] | TagConfig[] | FilterDateRange) => {
    return <RenderSelectedDateBadge selected={selected as FilterDateRange} />;
  },
  (selected: string[] | TagConfig[] | FilterDateRange) =>
    getDateOperations(selected as FilterDateRange),
);

export const completedDateFilter = createFilterConfig(
  "completed_date",
  "completed_date",
  "date",
  [],
  undefined,
  (selected: string[] | TagConfig[] | FilterDateRange) => {
    return <RenderSelectedDateBadge selected={selected as FilterDateRange} />;
  },
  (selected: string[] | TagConfig[] | FilterDateRange) =>
    getDateOperations(selected as FilterDateRange),
);
