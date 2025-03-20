"use client";

import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  format,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
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

interface TimeUnitState {
  unit: TimeUnit;
  value: number;
}

interface RelativeDatePickerProps {
  onDateChange: (date: Date) => void;
  value?: Date;
}

const computeTimeUnits = (date?: Date): TimeUnitState => {
  const now = new Date();
  console.log(date);
  if (!date) {
    return {
      unit: "days",
      value: 1,
    };
  }
  const daysDiff = differenceInDays(now, date);
  const weeksDiff = differenceInWeeks(now, date);
  const monthsDiff = differenceInMonths(now, date);
  const yearsDiff = differenceInYears(now, date);
  if (yearsDiff > 0) {
    return {
      unit: "years",
      value: yearsDiff,
    };
  } else if (monthsDiff > 0) {
    return {
      unit: "months",
      value: monthsDiff,
    };
  } else if (weeksDiff > 0) {
    return {
      unit: "weeks",
      value: weeksDiff,
    };
  } else {
    return {
      unit: "days",
      value: daysDiff,
    };
  }
};

export function RelativeDatePicker({
  onDateChange,
  value,
}: RelativeDatePickerProps) {
  const [selected, setSelected] = useState(() => {
    const initialState = computeTimeUnits(value);
    console.log(initialState);
    return {
      unit: initialState.unit,
      value: initialState.value,
    };
  });
  const [resultDate, setResultDate] = useState<Date>(new Date());

  const timeUnits: TimeUnit[] = ["days", "weeks", "months", "years"];

  // Update result date when value or unit changes
  useEffect(() => {
    const now = new Date();
    let newDate: Date;

    switch (selected.unit) {
      case "days":
        newDate = subDays(now, selected.value);
        break;
      case "weeks":
        newDate = subWeeks(now, selected.value);
        break;
      case "months":
        newDate = subMonths(now, selected.value);
        break;
      case "years":
        newDate = subYears(now, selected.value);
        break;
      default:
        newDate = now;
    }

    setResultDate(newDate);
    onDateChange(newDate);
  }, [selected, onDateChange]);

  const handleUnitChange = (newUnit: TimeUnit) => {
    setSelected((prev) => ({ ...prev, unit: newUnit }));
  };

  return (
    <div className="flex flex-col h-[200px]">
      {/* Input and Unit Selection */}
      <div className="flex flex-col gap-2 p-2 items-center border-b">
        <div className="w-full h-full"></div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={selected.value.toString()}
            onValueChange={(value) =>
              setSelected((prev) => ({
                ...prev,
                value: Number.parseInt(value) || 0,
              }))
            }
          >
            <SelectTrigger className="col-span-2">
              <SelectValue placeholder="Select a number" />
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
              variant={selected.unit === timeUnit ? "default" : "outline"}
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
