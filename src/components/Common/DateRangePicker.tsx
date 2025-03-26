import { t } from "i18next";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";

import DatePickerInput from "./DatePicker";

type DateRange = { from?: Date; to?: Date };

type DateRangePickerRangeProps = {
  date?: DateRange;
  onChange?: (date?: DateRange) => void;
  className?: string;
};

export function DateRangePickerRange({
  date,
  onChange,
  className,
}: DateRangePickerRangeProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(date?.from);
  const [endDate, setEndDate] = useState<Date | undefined>(date?.to);

  const handleDateChange = (key: "from" | "to", value: Date | undefined) => {
    const parsedDate = value ? value : undefined;

    if (!parsedDate) return;

    if (key === "from") {
      if (endDate && parsedDate > endDate) {
        toast.error(t("start_date_must_be_before_end_date"));
        return;
      }
      setStartDate(parsedDate);
      onChange?.({ from: parsedDate, to: endDate });
    } else {
      if (startDate && parsedDate < startDate) {
        toast.error(t("end_date_must_be_after_start_date"));
        return;
      }
      setEndDate(parsedDate);
      onChange?.({ from: startDate, to: parsedDate });
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-2">
        <Label className="text-gray-700 font-medium">{t("start_date")}</Label>
        <DatePickerInput
          value={startDate ? startDate : undefined}
          onChange={(date) => handleDateChange("from", date)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-gray-700 font-medium">{t("end_date")}</Label>
        <DatePickerInput
          value={endDate ? endDate : undefined}
          onChange={(date) => handleDateChange("to", date)}
        />
      </div>
    </div>
  );
}
