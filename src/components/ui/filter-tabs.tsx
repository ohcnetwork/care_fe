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

  const tabsToShow = showMoreDropdown ? visibleOptions : options;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {label && (
        <span className="text-sm font-medium text-gray-700">{t(label)}:</span>
      )}
      <Tabs
        value={value || "all"}
        onValueChange={handleValueChange}
        className="min-w-0"
      >
        <div
          className={
            variant === "underline"
              ? "max-w-full overflow-x-auto pb-1"
              : undefined
          }
        >
          <TabsList
            variant={variant === "underline" ? "line" : "default"}
            className={
              variant === "underline" ? "w-full justify-start" : undefined
            }
          >
            {showAllOption && (
              <TabsTrigger value="all">{t(allOptionLabel)}</TabsTrigger>
            )}
            {tabsToShow.map((option) => (
              <TabsTrigger key={option} value={option}>
                {t(option)}
              </TabsTrigger>
            ))}
            {showMoreDropdown && dropdownOptions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-full">
                    {t("more")}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {dropdownOptions.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onSelect={() => handleDropdownSelect(option)}
                    >
                      {t(option)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}
