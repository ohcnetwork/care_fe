import { t } from "i18next";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Input } from "./input";
import { Label } from "./label";

type DateRangePickerProps = {
  date?: { from?: string; to?: string };
  onChange?: (date?: { from?: string; to?: string }) => void;
  className?: string;
};

export function DateRangePicker({
  date,
  onChange,
  className,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState(date?.from || "");
  const [endDate, setEndDate] = useState(date?.to || "");

  const handleDateChange = (key: "from" | "to", value: string) => {
    if (key === "from") {
      if (endDate && value > endDate) {
        setEndDate(value);
      }
      setStartDate(value);
      onChange?.({ from: value, to: endDate });
    } else {
      if (value < startDate) {
        toast.error(t("end_date_must_be_after_start_date"));
        return;
      }
      setEndDate(value);
      onChange?.({ from: startDate, to: value });
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-2">
        <Label className="text-gray-700 font-medium">{t("start_date")}</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => handleDateChange("from", e.target.value)}
          className="border px-3 py-2 rounded-md"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-gray-700 font-medium">{t("end_date")}</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => handleDateChange("to", e.target.value)}
          className={cn(
            "border px-3 py-2 rounded-md",
            endDate && endDate < startDate ? "border-red-500" : "",
          )}
        />
      </div>
    </div>
  );
}
