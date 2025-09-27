import { format } from "date-fns";
import { useState } from "react";
import "react-day-picker/style.css";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FilterTabs } from "@/components/ui/filter-tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RelativeDatePicker } from "@/components/ui/relative-date-picker";

interface CombinedDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  buttonClassName?: string;
  popoverAlign?: "start" | "center" | "end";
  defaultTab?: "absolute" | "relative";
  classes?: string;
  dateFormat?: string;
  disabled?: boolean;
  blockDate?: (date: Date) => boolean;
}

export function CombinedDatePicker({
  value,
  onChange,
  disabled,
  placeholder,
  buttonClassName,
  popoverAlign = "start",
  defaultTab = "absolute",
  classes,
  dateFormat = "PPP",
  blockDate,
}: CombinedDatePickerProps) {
  const { t } = useTranslation();

  placeholder = placeholder ?? t("pick_a_date");

  const [activeTab, setActiveTab] = useState<"absolute" | "relative">(
    defaultTab,
  );

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(date);
  };

  const handleRelativeDateChange = (date: Date) => {
    handleSelect(date);
  };

  return (
    <div className="flex sm:gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !value && "text-gray-500",
              classes,
              buttonClassName,
            )}
            disabled={disabled}
          >
            <CareIcon icon="l-calender" className="size-4" />
            {value ? format(value, dateFormat) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={popoverAlign}>
          <FilterTabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "absolute" | "relative")}
            options={[
              { value: "absolute", label: "absolute_date" },
              { value: "relative", label: "quick_finder" },
            ]}
            variant="underline"
            showAllOption={false}
            className="grid w-full grid-cols-2"
          />
          {activeTab === "absolute" && (
            <div className="p-0">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleSelect}
                disabled={blockDate}
              />
            </div>
          )}
          {activeTab === "relative" && (
            <div className="p-0">
              <RelativeDatePicker
                value={value}
                onDateChange={handleRelativeDateChange}
                disabled={blockDate}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
