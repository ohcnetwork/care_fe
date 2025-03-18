import { format } from "date-fns";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";

type DateRangePickerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  date?: DateRange;
  onChange?: (date?: DateRange) => void;
  className?: string;
};

export function DateRangePicker({
  date,
  onChange,
  className,
}: DateRangePickerProps) {
  const inputClasses =
    "border border-gray-200 bg-white shadow-sm rounded-md px-3 py-2 w-full hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 focus:outline-none ";

  const handleChange =
    (field: "from" | "to") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = e.target.value
        ? new Date(e.target.value)
        : undefined;
      onChange?.(
        field === "from"
          ? { from: selectedDate, to: date?.to }
          : { from: date?.from, to: selectedDate },
      );
    };
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex space-x-2">
        <div className="flex flex-col w-full">
          <label
            htmlFor="from-date"
            className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            From Date
          </label>
          <input
            id="from-date"
            type="date"
            className={inputClasses}
            value={date?.from ? format(date.from, "yyyy-MM-dd") : ""}
            max={date?.to ? format(date.to, "yyyy-MM-dd") : undefined}
            onChange={handleChange("from")}
          />
        </div>

        <div className="flex flex-col w-full">
          <label
            htmlFor="to-date"
            className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            To Date
          </label>
          <input
            type="date"
            placeholder="To Date"
            className={inputClasses}
            value={date?.to ? format(date.to, "yyyy-MM-dd") : ""}
            min={date?.from ? format(date.from, "yyyy-MM-dd") : undefined}
            onChange={handleChange("to")}
          />
        </div>
      </div>
    </div>
  );
}
