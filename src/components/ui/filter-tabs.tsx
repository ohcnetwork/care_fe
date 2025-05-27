import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FilterTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  label?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  tabsClassName?: string;
  triggerClassName?: string;
}

export function FilterTabs({
  value,
  onValueChange,
  options,
  label,
  showAllOption = true,
  allOptionLabel = "all",
  className = "",
  tabsClassName = "bg-gray-100 p-0 h-8 text-gray-950",
  triggerClassName = "data-[state=active]:bg-white data-[state=active]:text-gray-950 px-3 py-1 text-sm",
}: FilterTabsProps) {
  const { t } = useTranslation();

  const handleValueChange = (newValue: string) => {
    if (newValue === "all") {
      onValueChange("");
    } else {
      onValueChange(newValue);
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {label && (
        <span className="text-sm font-medium text-gray-700">{t(label)}:</span>
      )}
      <Tabs value={value || "all"} onValueChange={handleValueChange}>
        <TabsList className={tabsClassName}>
          {showAllOption && (
            <TabsTrigger value="all" className={triggerClassName}>
              {t(allOptionLabel)}
            </TabsTrigger>
          )}
          {options.map((option) => (
            <TabsTrigger
              key={option}
              value={option}
              className={triggerClassName}
            >
              {t(option)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
