import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { DatePicker } from "@/components/ui/date-picker";

type DateRangePickerProps = {
  date?: { from?: Date; to?: Date };
  onChange?: (date?: { from?: Date; to?: Date }) => void;
  className?: string;
};

export function DateRangePicker({
  date,
  onChange,
  className,
}: DateRangePickerProps) {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState<Date | undefined>(date?.from);
  const [endDate, setEndDate] = useState<Date | undefined>(date?.to);

  useEffect(() => {
    setStartDate(date?.from);
    setEndDate(date?.to);
  }, [date]);

  const handleStartDateChange = (date?: Date) => {
    setStartDate(date);

    // If end date exists and is before the new start date, clear it
    if (date && endDate && endDate < date) {
      setEndDate(undefined);
      onChange?.({ from: date, to: undefined });
    } else {
      onChange?.({ from: date, to: endDate });
    }
  };

  const handleEndDateChange = (date?: Date) => {
    setEndDate(date);
    onChange?.({ from: startDate, to: date });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t("start_date")}</span>
          <DatePicker date={startDate} onChange={handleStartDateChange} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t("end_date")}</span>
          <DatePicker
            date={endDate}
            onChange={handleEndDateChange}
            disabled={(date) => (startDate ? date < startDate : false)}
          />
        </div>
      </div>
    </div>
  );
}
