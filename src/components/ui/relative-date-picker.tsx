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
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [selected, setSelected] = useState(() => {
    const initialState = computeTimeUnits(value);
    return {
      unit: initialState.unit,
      value: initialState.value,
    };
  });

  const timeUnits: TimeUnit[] = ["days", "weeks", "months", "years"];

  // Calculate and memoize the result date based on selected
  const resultDate = useMemo(() => {
    const now = new Date();

    switch (selected.unit) {
      case "days":
        return subDays(now, selected.value);
      case "weeks":
        return subWeeks(now, selected.value);
      case "months":
        return subMonths(now, selected.value);
      case "years":
        return subYears(now, selected.value);
      default:
        return now;
    }
  }, [selected.unit, selected.value]);

  useEffect(() => {
    onDateChange(resultDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultDate]);

  const handleValueChange = (newValue: string) => {
    const numValue = parseInt(newValue) || 0;
    setSelected((prev) => ({ ...prev, value: numValue }));
  };

  const handleUnitChange = (newUnit: TimeUnit) => {
    setSelected((prev) => ({ ...prev, unit: newUnit }));
  };

  return (
    <div className="flex flex-col h-[200px]">
      {/* Input and Unit Selection */}
      <div className="flex flex-col gap-2 p-2 items-center border-b border-gray-200">
        <div className="w-full h-full"></div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={selected.value.toString()}
            onValueChange={(value) => handleValueChange(value)}
          >
            <SelectTrigger className="col-span-2">
              <SelectValue placeholder={t("select_number")} />
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
