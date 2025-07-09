import { ChevronDown } from "lucide-react";
import { useState } from "react";
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

interface FilterTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
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

  // State for managing visible tabs when using dropdown
  const [visibleOptions, setVisibleOptions] = useState<string[]>(() => {
    if (!showMoreDropdown) return options;

    if (defaultVisibleOptions) {
      // Validate and respect maxVisibleTabs even with defaultVisibleOptions
      const validDefaultOptions = defaultVisibleOptions.filter((option) =>
        options.includes(option),
      );
      return validDefaultOptions.slice(0, maxVisibleTabs);
    }

    return options.slice(0, maxVisibleTabs);
  });

  const [dropdownOptions, setDropdownOptions] = useState<string[]>(() => {
    if (!showMoreDropdown) return [];

    if (defaultVisibleOptions) {
      const validDefaultOptions = defaultVisibleOptions
        .filter((option) => options.includes(option))
        .slice(0, maxVisibleTabs);

      return options.filter((option) => !validDefaultOptions.includes(option));
    }

    return options.slice(maxVisibleTabs);
  });

  const handleValueChange = (newValue: string) => {
    if (newValue === "all") {
      onValueChange("");
    } else {
      onValueChange(newValue);
    }
  };

  const handleDropdownSelect = (selectedOption: string) => {
    if (!showMoreDropdown) return;

    // Safety check: ensure we have visible options to swap
    if (visibleOptions.length === 0) {
      // If no visible options, just add the selected option to visible
      setVisibleOptions([selectedOption]);
      setDropdownOptions(
        dropdownOptions.filter((option) => option !== selectedOption),
      );
      onValueChange(selectedOption);
      return;
    }

    // Swap the last visible tab with the selected dropdown option
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
    return "bg-gray-100 p-0 h-8 text-gray-950 overflow-x-auto";
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
    return "text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50 px-3 py-1 text-sm h-8 bg-gray-100 rounded-md border-0 ring-0 focus:ring-0 focus:outline-none transition-colors duration-200";
  };

  const tabsToShow = showMoreDropdown ? visibleOptions : options;

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
          {tabsToShow.map((option) => (
            <TabsTrigger
              key={option}
              value={option}
              className={getTriggerClassName()}
            >
              {t(option)}
            </TabsTrigger>
          ))}
          {showMoreDropdown && dropdownOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={getMoreButtonClassName()}>
                  {t("more")}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {dropdownOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => handleDropdownSelect(option)}
                    className="text-gray-950 font-medium text-sm"
                  >
                    {t(option)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
}
