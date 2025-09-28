import { ChevronDown } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Support both string and { value, label } option
type FilterTabOption =
  | string
  | { value: string; label: string; icon?: React.ReactNode };

interface FilterTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterTabOption[];
  label?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  variant?: "background" | "underline";
  maxVisibleTabs?: number;
  showMoreDropdown?: boolean;
  defaultVisibleOptions?: string[];
}

export function FilterTabs({
  value,
  onValueChange,
  options,
  label,
  showAllOption = true,
  allOptionLabel = "all",
  className = "",
  variant = "background",
  maxVisibleTabs = 4,
  showMoreDropdown = false,
  defaultVisibleOptions,
}: FilterTabsProps) {
  const { t } = useTranslation();

  // Helpers to extract value and label
  const getOptionValue = (option: FilterTabOption) =>
    typeof option === "string" ? option : option.value;
  const getOptionLabel = (option: FilterTabOption) =>
    typeof option === "string" ? t(option) : t(option.label);

  // Prepare arrays of values for visible/dropdown logic
  const optionValues = useMemo(() => options.map(getOptionValue), [options]);

  // State for managing visible tabs when using dropdown
  const [visibleOptions, setVisibleOptions] = useState<string[]>(() => {
    if (!showMoreDropdown) return optionValues;

    if (defaultVisibleOptions) {
      const validDefaultOptions = defaultVisibleOptions.filter((option) =>
        optionValues.includes(option),
      );
      return validDefaultOptions.slice(0, maxVisibleTabs);
    }

    return optionValues.slice(0, maxVisibleTabs);
  });

  const [dropdownOptions, setDropdownOptions] = useState<string[]>(() => {
    if (!showMoreDropdown) return [];

    if (defaultVisibleOptions) {
      const validDefaultOptions = defaultVisibleOptions
        .filter((option) => optionValues.includes(option))
        .slice(0, maxVisibleTabs);

      return optionValues.filter(
        (option) => !validDefaultOptions.includes(option),
      );
    }

    return optionValues.slice(maxVisibleTabs);
  });

  // Keep derived state in sync when inputs change
  useEffect(() => {
    if (!showMoreDropdown) {
      setVisibleOptions(optionValues);
      setDropdownOptions([]);
      return;
    }
    const baseVisible =
      (defaultVisibleOptions &&
        defaultVisibleOptions
          .filter((opt) => optionValues.includes(opt))
          .slice(0, maxVisibleTabs)) ||
      optionValues.slice(0, maxVisibleTabs);
    setVisibleOptions(baseVisible);
    setDropdownOptions(
      optionValues.filter((opt) => !baseVisible.includes(opt)),
    );
  }, [optionValues, showMoreDropdown, defaultVisibleOptions, maxVisibleTabs]);

  const handleValueChange = (newValue: string) => {
    if (showAllOption && newValue === "all") {
      onValueChange("");
      return;
    }
    onValueChange(newValue);
  };

  const handleDropdownSelect = (selectedOption: string) => {
    if (!showMoreDropdown) return;

    if (visibleOptions.length === 0) {
      setVisibleOptions([selectedOption]);
      setDropdownOptions(
        dropdownOptions.filter((option) => option !== selectedOption),
      );
      onValueChange(selectedOption);
      return;
    }

    const lastVisibleOption = visibleOptions[visibleOptions.length - 1];
    const newVisibleOptions = [...visibleOptions.slice(0, -1), selectedOption];
    const newDropdownOptions = [
      ...dropdownOptions.filter((option) => option !== selectedOption),
      lastVisibleOption,
    ];

    setVisibleOptions(newVisibleOptions);
    setDropdownOptions(newDropdownOptions);
    onValueChange(selectedOption);
  };

  // Styling variants
  const getTabsClassName = () => {
    if (variant === "underline") {
      return "w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto";
    }
  };

  const getTriggerClassName = () => {
    if (variant === "underline") {
      return "border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none";
    }
    return "data-[state=active]:bg-white data-[state=active]:text-gray-950 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:shadow-sm";
  };

  const getMoreButtonClassName = () => {
    if (variant === "underline") {
      return "text-gray-500 font-semibold hover:text-gray-900 hover:bg-transparent pb-2.5 px-2.5 rounded-none";
    }
    return "text-gray-500 font-medium text-sm px-3 flex items-center";
  };

  // Find the option object by value
  const findOption = (val: string) =>
    options.find((opt) => getOptionValue(opt) === val);

  const tabsToShow = showMoreDropdown ? visibleOptions : optionValues;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {label && (
        <span className="text-sm font-medium text-gray-700">{t(label)}:</span>
      )}
      <Tabs value={value || "all"} onValueChange={handleValueChange}>
        <TabsList className={getTabsClassName()}>
          {showAllOption && (
            <TabsTrigger value="all" className={getTriggerClassName()}>
              {t(allOptionLabel)}
            </TabsTrigger>
          )}
          {tabsToShow.map((val) => {
            const option = findOption(val);
            return (
              <TabsTrigger
                key={val}
                value={val}
                className={getTriggerClassName()}
              >
                {option && typeof option === "object" && option.icon}
                {option ? getOptionLabel(option) : t(val)}
              </TabsTrigger>
            );
          })}
          {showMoreDropdown && dropdownOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={getMoreButtonClassName()}>
                  {t("more")}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {dropdownOptions.map((val) => {
                  const option = findOption(val);
                  return (
                    <DropdownMenuItem
                      key={val}
                      onClick={() => handleDropdownSelect(val)}
                      className="text-gray-950 font-medium text-sm"
                    >
                      <span className="flex items-center gap-1">
                        {option && typeof option === "object" && option.icon}
                        {option ? getOptionLabel(option) : t(val)}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
}
