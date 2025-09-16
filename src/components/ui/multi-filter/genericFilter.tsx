import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import FilterHeader from "./filterHeader";
import useMultiFilterNavigationShortcuts from "./utils/useMultiFilterNavigationShortcuts";
import useMultiFilterSearch from "./utils/useMultiFilterSearch";
import {
  FilterConfig,
  FilterMode,
  FilterOption,
  FilterValues,
  getColorForOption,
} from "./utils/utils";

export default function GenericFilter({
  filter,
  selectedValues = [],
  handleBack,
  onFilterChange,
  showColorIndicators = false,
}: {
  filter: FilterConfig;
  selectedValues?: string[];
  handleBack?: () => void;
  onFilterChange?: (filterKey: string, values: FilterValues) => void;
  showColorIndicators?: boolean;
}) {
  const { t } = useTranslation();
  const {
    search,
    setSearch,
    filteredItems: filteredOptions,
  } = useMultiFilterSearch(filter.options);

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

  const handleCheckboxToggle = (value: string, checked: boolean) => {
    if (!onFilterChange) return;
    if (checked) {
      onFilterChange(filter.key, [value]);
    } else {
      onFilterChange(filter.key, []);
    }
  };

  const { focusItemIndex, setFocusItemIndex } =
    useMultiFilterNavigationShortcuts(filteredOptions.length, handleBack);

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
              onOptionToggle={
                filter.mode === "single"
                  ? handleCheckboxToggle
                  : handleOptionToggle
              }
              showColorIndicators={showColorIndicators}
              focusItemIndex={focusItemIndex}
              setFocusItemIndex={setFocusItemIndex}
              mode={filter.mode}
            />
          )}
        </div>
      </div>
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
  mode,
}: {
  options: FilterOption[];
  selectedValues: string[];
  onOptionToggle: (value: string, checked: boolean) => void;
  showColorIndicators?: boolean;
  focusItemIndex: number | null;
  setFocusItemIndex: (index: number) => void;
  mode?: FilterMode;
}) {
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
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          ref={index === focusItemIndex ? setFocusItemRef : null}
          onFocus={() => setFocusItemIndex(index)}
          tabIndex={index}
          onClick={() => {
            onOptionToggle(
              option.value,
              !selectedValues.includes(option.value),
            );
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onOptionToggle(
                option.value,
                !selectedValues.includes(option.value),
              );
            }
          }}
        >
          {mode === "single" ? (
            <RadioGroup
              id={`${option.value}-${index}`}
              value={selectedValues.length > 0 ? selectedValues[0] : ""}
              onValueChange={() => {}}
              className="pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              <RadioGroupItem value={option.value} />
            </RadioGroup>
          ) : (
            <Checkbox
              checked={selectedValues.includes(option.value)}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 pointer-events-none"
            />
          )}
          {showColorIndicators && (
            <div
              className={cn(
                "h-3 w-3 rounded-full flex-shrink-0 border",
                option.color || getColorForOption(index),
              )}
            />
          )}
          <span className="text-sm text-gray-700 flex-1">{option.label}</span>
        </div>
      ))}
    </div>
  );
}

export const GenericSelectedBadge = ({
  selectedValue,
  selectedLength,
  className,
}: {
  selectedValue: string;
  selectedLength: number;
  className?: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
      <Badge
        variant="outline"
        className={cn("text-xs whitespace-nowrap", className)}
      >
        {t(selectedValue)}
      </Badge>
      {selectedLength > 1 && (
        <span className="text-xs bg-gray-100 text-gray-500 px-1 rounded-md whitespace-nowrap">
          +{selectedLength - 1}
        </span>
      )}
    </div>
  );
};
