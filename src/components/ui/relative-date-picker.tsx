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

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeUnit = "days" | "weeks" | "months" | "years";

interface TimeUnitState {
  unit: TimeUnit;
  value: number;
}

interface RelativeDatePickerProps {
  onDateChange: (date: Date) => void;
  value?: Date;
  disabled?: (date: Date) => boolean;
}

const computeTimeUnits = (date?: Date): TimeUnitState => {
  const now = new Date();
  if (!date) {
    return { unit: "days", value: 1 };
  }
  const daysDiff = differenceInDays(now, date);
  const weeksDiff = differenceInWeeks(now, date);
  const monthsDiff = differenceInMonths(now, date);
  const yearsDiff = differenceInYears(now, date);
  if (yearsDiff > 0) return { unit: "years", value: yearsDiff };
  if (monthsDiff > 0) return { unit: "months", value: monthsDiff };
  if (weeksDiff > 0) return { unit: "weeks", value: weeksDiff };
  return { unit: "days", value: daysDiff };
};

export function RelativeDatePicker({
  onDateChange,
  value,
  disabled,
}: RelativeDatePickerProps) {
  const [selected, setSelected] = useState(() => computeTimeUnits(value));
  const [resultDate, setResultDate] = useState<Date>(value || new Date());

  const timeUnits: TimeUnit[] = ["days", "weeks", "months", "years"];

  const maxValue = useMemo(() => {
    switch (selected.unit) {
      case "days":
        return 31;
      case "weeks":
        return 12;
      case "months":
        return 36;
      case "years":
        return 60;
      default:
        return 31;
    }
  }, [selected.unit]);

  // Map of disabled values per unit
  const disabledValuesByUnit = useMemo(() => {
    const now = new Date();
    const map: Record<TimeUnit, Set<number>> = {
      days: new Set(),
      weeks: new Set(),
      months: new Set(),
      years: new Set(),
    };
    if (!disabled) return map;

    for (const unit of timeUnits) {
      const limit =
        unit === "days"
          ? 31
          : unit === "weeks"
            ? 12
            : unit === "months"
              ? 36
              : 60;
      for (let i = 1; i <= limit; i++) {
        let date: Date;
        switch (unit) {
          case "days":
            date = subDays(now, i);
            break;
          case "weeks":
            date = subWeeks(now, i);
            break;
          case "months":
            date = subMonths(now, i);
            break;
          case "years":
            date = subYears(now, i);
            break;
          default:
            date = now;
        }
        if (disabled(date)) map[unit].add(i);
      }
    }
    return map;
  }, [disabled, timeUnits]);

  // Units where ALL values are disabled
  const fullyDisabledUnits = useMemo(() => {
    return timeUnits.filter((unit) => {
      const limit =
        unit === "days"
          ? 31
          : unit === "weeks"
            ? 12
            : unit === "months"
              ? 36
              : 60;
      return disabledValuesByUnit[unit].size === limit;
    });
  }, [disabledValuesByUnit, timeUnits]);

  const allDisabled = fullyDisabledUnits.length === timeUnits.length;

  // Auto-switch unit if selected unit becomes fully disabled
  useEffect(() => {
    if (fullyDisabledUnits.includes(selected.unit)) {
      const nextAvailable = timeUnits.find(
        (u) => !fullyDisabledUnits.includes(u),
      );
      if (nextAvailable) {
        setSelected({ unit: nextAvailable, value: 1 });
      }
    }
  }, [fullyDisabledUnits, selected.unit, timeUnits]);

  // Validate current value for selected unit
  useEffect(() => {
    const disabledSet = disabledValuesByUnit[selected.unit];
    if (disabledSet.has(selected.value)) {
      const validValue = Array.from({ length: maxValue }, (_, i) => i + 1).find(
        (v) => !disabledSet.has(v),
      );
      if (validValue !== undefined) {
        setSelected((prev) => ({ ...prev, value: validValue }));
      }
    }
  }, [selected.unit, selected.value, disabledValuesByUnit, maxValue]);

  // Update result date
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handleUnitChange = (newUnit: TimeUnit) => {
    if (!fullyDisabledUnits.includes(newUnit)) {
      setSelected((prev) => ({ ...prev, unit: newUnit, value: 1 }));
    }
  };

  return (
    <div className="flex flex-col h-[200px]">
      <div className="flex flex-col gap-2 p-2 items-center border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={selected.value.toString()}
            onValueChange={(value) => {
              const numValue = Number.parseInt(value) || 0;
              if (!disabledValuesByUnit[selected.unit].has(numValue)) {
                setSelected((prev) => ({
                  ...prev,
                  value: numValue,
                }));
              }
            }}
            disabled={allDisabled || fullyDisabledUnits.includes(selected.unit)}
          >
            <SelectTrigger className="col-span-2">
              <SelectValue placeholder="Select a number" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: maxValue }, (_, i) => i + 1).map((num) => {
                const isDisabled = disabledValuesByUnit[selected.unit].has(num);
                return (
                  <SelectItem
                    key={num}
                    value={num.toString()}
                    disabled={isDisabled}
                    className={
                      isDisabled ? "text-muted-foreground opacity-50" : ""
                    }
                  >
                    {num}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {timeUnits.map((unit) => (
            <Badge
              key={unit}
              onClick={() => handleUnitChange(unit)}
              variant={selected.unit === unit ? "default" : "outline"}
              className={
                fullyDisabledUnits.includes(unit)
                  ? "opacity-50 pointer-events-none"
                  : ""
              }
            >
              {unit.charAt(0).toUpperCase() + unit.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

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
