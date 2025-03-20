"use client";

import { format, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

type TimeUnit = "days" | "weeks" | "months" | "years";

interface RelativeDatePickerProps {
  onDateChange: (date: Date) => void;
  initialValue?: number;
  initialUnit?: TimeUnit;
}

export function RelativeDatePicker({
  onDateChange,
  initialValue = 1,
  initialUnit = "days",
}: RelativeDatePickerProps) {
  const [value, setValue] = useState<number>(initialValue);
  const [unit, setUnit] = useState<TimeUnit>(initialUnit);
  const [resultDate, setResultDate] = useState<Date>(new Date());

  const timeUnits: TimeUnit[] = ["days", "weeks", "months", "years"];
  const currentIndex = timeUnits.indexOf(unit);

  useEffect(() => {
    const now = new Date();
    let newDate: Date;

    switch (unit) {
      case "days":
        newDate = subDays(now, value);
        break;
      case "weeks":
        newDate = subWeeks(now, value);
        break;
      case "months":
        newDate = subMonths(now, value);
        break;
      case "years":
        newDate = subYears(now, value);
        break;
      default:
        newDate = now;
    }

    setResultDate(newDate);
    onDateChange(newDate);
  }, [value, unit, onDateChange]);

  const handleUnitChange = (newUnit: TimeUnit) => {
    setUnit(newUnit);
  };

  return (
    <div className="flex flex-col h-[200px]">
      {/* Input and Unit Selection */}
      <div className="flex items-center border-b h-[120px]">
        <div className="w-24 h-full">
          <Input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(Number.parseInt(e.target.value) || 0)}
            className="h-full rounded-none border-0 focus-visible:ring-0 text-end px-0 text-lg font-medium"
          />
        </div>

        <div className="flex-1 h-full overflow-hidden">
          <div className="h-full relative">
            <div
              className="absolute w-full transition-transform duration-200 ease-in-out"
              style={{ transform: `translateY(${40 + -currentIndex * 40}px)` }}
            >
              {timeUnits.map((timeUnit) => (
                <button
                  key={timeUnit}
                  onClick={() => handleUnitChange(timeUnit)}
                  className={cn(
                    "h-[40px] flex items-center justify-center text-base font-medium transition-colors",
                    unit === timeUnit
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Date Preview */}
      <div className="flex-1 p-4 flex flex-col justify-center overflow-hidden">
        <div className="text-xl font-bold mb-1 truncate">
          {format(resultDate, "MMM d, yyyy")}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {format(resultDate, "EEEE")}
        </div>
      </div>
    </div>
  );
}
