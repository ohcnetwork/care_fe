"use client";

import { format, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

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
      <div className="flex flex-col gap-2 p-2 items-center border-b">
        <div className="w-full h-full"></div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={value.toString()}
            onValueChange={(value) => setValue(Number.parseInt(value) || 0)}
          >
            <SelectTrigger className="col-span-2">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((timeUnit) => (
                <SelectItem key={timeUnit} value={timeUnit.toString()}>
                  {timeUnit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {timeUnits.map((timeUnit) => (
            <Badge
              key={timeUnit}
              onClick={() => handleUnitChange(timeUnit)}
              variant={unit === timeUnit ? "default" : "outline"}
            >
              {timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1)}
            </Badge>
          ))}
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
