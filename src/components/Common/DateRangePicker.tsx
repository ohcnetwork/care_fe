import { t } from "i18next";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";

import DatePicker from "./DatePicker";

type DateRange = { from?: Date; to?: Date };

type DateRangePickerProps = {
  date?: DateRange;
  onChange?: (date?: DateRange) => void;
  className?: string;
};

export function DateRangePicker({
  date,
  onChange,
  className,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(date?.from);
  const [endDate, setEndDate] = useState<Date | undefined>(date?.to);
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});

  const handleDateChange = (key: "from" | "to", value: Date | undefined) => {
    const parsedDate = value ? value : undefined;

    if (!parsedDate) return;

    if (key === "from") {
      if (endDate && parsedDate > endDate) {
        setErrors((prev) => ({
          ...prev,
          from: t("start_date_must_be_before_end_date"),
        }));
        setStartDate(parsedDate);
        return;
      } else {
        setErrors((prev) => ({ ...prev, from: undefined }));
      }
      setStartDate(parsedDate);
      onChange?.({ from: parsedDate, to: endDate });
    } else {
      if (startDate && parsedDate < startDate) {
        setErrors((prev) => ({
          ...prev,
          to: t("end_date_must_be_after_start_date"),
        }));
        setEndDate(parsedDate);
        return;
      } else {
        setErrors((prev) => ({ ...prev, to: undefined }));
      }
      setEndDate(parsedDate);
      onChange?.({ from: startDate, to: parsedDate });
    }
  };

  return (
    <div className={cn("grid gap-2 py-2", className)}>
      <div className="flex flex-col gap-2">
        <Label className="text-gray-700 font-medium">{t("start_date")}</Label>
        <DatePicker
          value={startDate ? startDate : undefined}
          onChange={(date) => handleDateChange("from", date)}
        />
        {errors.from && (
          <span className="text-red-500 text-sm">{errors.from}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-gray-700 font-medium">{t("end_date")}</Label>
        <DatePicker
          value={endDate ? endDate : undefined}
          onChange={(date) => handleDateChange("to", date)}
        />
        {errors.to && <span className="text-red-500 text-sm">{errors.to}</span>}
      </div>
    </div>
  );
}
