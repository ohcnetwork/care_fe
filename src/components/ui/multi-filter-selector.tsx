import { ChevronDown, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagFilterContent } from "@/components/ui/tag-filter-content";

import {
  ENCOUNTER_CLASS,
  ENCOUNTER_STATUS,
  ENCOUNTER_STATUS_COLORS,
} from "@/types/emr/encounter/encounter";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";

// Base filter interface
interface FilterOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

// Filter configuration
interface FilterConfig {
  key: string;
  options: FilterOption[];
  placeholder?: string;
  type?: "command" | "tag";
  resource?: TagResource;
}

// Component props
interface MultiFilterSelectorProps {
  filters: FilterConfig[];
  selectedFilters: Record<string, string[] | TagConfig[]>;
  onFilterChange: (filterKey: string, values: string[] | TagConfig[]) => void;
  onClearAll: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  selectedTags?: TagConfig[];
}
// Generic color palette for cycling through options
const COLOR_PALETTE = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-violet-500",
] as const;

// Filter options list component (renamed from InnerFilter)
function FilterOptionsList({
  filterOptions,
  placeholder,
  selectedValues = [],
  onValueChange,
  showColorIndicators = false,
}: {
  filterOptions: string[];
  placeholder?: string;
  selectedValues?: string[];
  onValueChange?: (values: string[]) => void;
  showColorIndicators?: boolean;
}) {
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  const filteredOptions = filterOptions.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (!onValueChange) return;

    const newValues = checked
      ? [...selectedValues, value]
      : selectedValues.filter((v) => v !== value);

    onValueChange(newValues);
  };

  const getColorForOption = (option: string, index: number) => {
    if (!showColorIndicators) return "";
    // Cycle through the color palette based on index
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  return (
    <div className="space-y-4 px-2">
      <div className="space-y-3">
        <div className="relative">
          <Input
            placeholder={placeholder ?? t("filter")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-sm pl-3 pr-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              ×
            </Button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {filteredOptions.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">
              {t("no_results_found")}
            </div>
          ) : (
            <div>
              {filteredOptions.map((option, index) => (
                <div
                  key={option}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(option, checked as boolean)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  {showColorIndicators && (
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full flex-shrink-0",
                        getColorForOption(option, index),
                      )}
                    />
                  )}
                  <span className="text-sm text-gray-700 flex-1">
                    {t(option)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main component that uses FilterOptionsList for rendering filters
export function MultiFilterSelector({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll,
  placeholder = "Filter",
  className,
  disabled = false,
  selectedTags = [],
}: MultiFilterSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const { t } = useTranslation();

  const totalSelectedCount = Object.values(selectedFilters).reduce(
    (sum, values) => sum + values.length,
    0,
  );

  const hasAnyFilters = totalSelectedCount > 0;

  const handleFilterSelect = (filterKey: string) => {
    setActiveFilter(filterKey);
  };

  const handleBack = () => {
    setActiveFilter(null);
  };

  const handleClearAll = () => {
    onClearAll();
    setOpen(false);
  };

  const getFilterDisplay = () => {
    if (!hasAnyFilters) return placeholder;

    const filterLabels = filters
      .filter((filter) => selectedFilters[filter.key]?.length > 0)
      .map((filter) => {
        const count = selectedFilters[filter.key]?.length || 0;
        return `${t(`${filter.key}`)} (${count})`;
      });

    return filterLabels.join(", ");
  };

  const renderFilterContent = () => {
    if (activeFilter) {
      const filter = filters.find((f) => f.key === activeFilter);
      if (!filter) return null;

      // Handle tag filters
      if (filter.type === "tag" && filter.resource) {
        return (
          <div>
            <div className="flex items-center gap-0 px-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-4 w-4 p-0 hover:bg-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleBack}
                  className="p-0"
                >
                  {t("back")}
                </Button>
                {"/"}
                <span className="text-xs font-medium text-gray-500">
                  {t(`${filter.key}`)}
                </span>
              </div>
            </div>

            <TagFilterContent
              selectedTags={selectedTags}
              onTagsChange={(tags) => {
                onFilterChange(filter.key, tags);
              }}
              resource={filter.resource}
              placeholder={
                filter.placeholder ? t(filter.placeholder) : undefined
              }
            />
          </div>
        );
      }

      // Handle regular filters
      const filteredValues = selectedFilters[filter.key] || [];

      // Convert selected values back to labels for display
      const selectedLabels = filteredValues.map((value) => {
        if (filter.type !== "tag" && typeof value === "string") {
          const option = filter.options.find((opt) => opt.value === value);
          return option?.label || value;
        }
        return (value as TagConfig).display;
      });

      // Get all option labels for the FilterOptionsList
      const filterOptionLabels = filter.options.map((option) => option.label);

      return (
        <div>
          <div className="flex items-center gap-0 px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-4 w-4 p-0 hover:bg-gray-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="link"
                size="sm"
                onClick={handleBack}
                className="p-0"
              >
                {t("back")}
              </Button>
              {"/"}
              <span className="text-xs font-medium text-gray-500">
                {t(`${filter.key}`)}
              </span>
            </div>
          </div>

          <FilterOptionsList
            filterOptions={filterOptionLabels}
            placeholder={filter.placeholder}
            selectedValues={selectedLabels}
            showColorIndicators={true}
            onValueChange={(selected) => {
              // Convert labels back to values for the parent
              const selectedValues = selected.map((value) => {
                const option = filter.options.find(
                  (opt) => opt.value === value,
                );
                return option?.value || value;
              });
              onFilterChange(filter.key, selectedValues);
            }}
          />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <span className="text-sm font-medium text-gray-900">
            {t("filters")}
          </span>
          {hasAnyFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            >
              Clear all
            </Button>
          )}
        </div>

        <Command>
          <CommandInput placeholder="Search filters" className="h-9" />
          <CommandList>
            <CommandEmpty>No filters found</CommandEmpty>
            <CommandGroup>
              {filters.map((filter) => {
                const selectedCount = selectedFilters[filter.key]?.length || 0;
                return (
                  <CommandItem
                    key={filter.key}
                    onSelect={() => handleFilterSelect(filter.key)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-700">
                        {t(`${filter.key}`)}
                      </span>
                      {selectedCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedCount}
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between min-w-[200px]",
            hasAnyFilters && "border-blue-300 bg-blue-50",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="truncate">{getFilterDisplay()}</span>
          </div>
          {hasAnyFilters && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {totalSelectedCount}
            </Badge>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        {renderFilterContent()}
      </PopoverContent>
    </Popover>
  );
}

// Helper function to create encounter status filter
export function createEncounterStatusFilter(): FilterConfig {
  return {
    key: "status",
    placeholder: "filter_by_status",
    type: "command",
    options: ENCOUNTER_STATUS.map((status) => ({
      value: status,
      label: `encounter_status__${status}`,
      color: ENCOUNTER_STATUS_COLORS[status],
    })),
  };
}

// Helper function to create encounter class filter
export function createEncounterClassFilter(): FilterConfig {
  return {
    key: "encounter_class",
    placeholder: "Filter by encounter class",
    type: "command",
    options: ENCOUNTER_CLASS.map((encounterClass) => ({
      value: encounterClass,
      label: `encounter_class__${encounterClass}`,
    })),
  };
}

// Helper function to create tag filter
export function createTagFilter(resource: TagResource): FilterConfig {
  return {
    key: "tags",
    placeholder: "filter_by_tags",
    type: "tag",
    resource,
    options: [],
  };
}

// Export the FilterOptionsList for use in custom filter implementations
export { FilterOptionsList };

/*
Usage Example:

import { MultiFilterSelector, createEncounterStatusFilter, createEncounterClassFilter } from "@/components/ui/multi-filter-selector";

function MyComponent() {
  const { t } = useTranslation();
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const filters = [
    createEncounterStatusFilter(t),
    createEncounterClassFilter(t),
  ];

  const handleFilterChange = (filterKey: string, values: string[]) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: values,
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters({});
  };

  return (
    <MultiFilterSelector
      filters={filters}
      selectedFilters={selectedFilters}
      onFilterChange={handleFilterChange}
      onClearAll={handleClearAll}
      placeholder="Filter encounters"
    />
  );
}
*/
