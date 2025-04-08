import { format } from "date-fns";
import { useState } from "react";
import "react-day-picker/style.css";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RelativeDatePicker } from "@/components/ui/relative-date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CombinedDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  buttonClassName?: string;
  popoverAlign?: "start" | "center" | "end";
  defaultTab?: "absolute" | "relative";
  classes?: string;
  dateFormat?: string;
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
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "absolute" | "relative")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="absolute">{t("absolute_date")}</TabsTrigger>
              <TabsTrigger value="relative">{t("relative_date")}</TabsTrigger>
            </TabsList>
            <TabsContent value="absolute" className="p-0">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleSelect}
              />
            </TabsContent>
            <TabsContent value="relative" className="p-0">
              <RelativeDatePicker
                value={value}
                onDateChange={handleRelativeDateChange}
              />
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}
