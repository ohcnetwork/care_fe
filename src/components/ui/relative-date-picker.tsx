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
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

const computeDate = (unit: TimeUnit, value: number) => {
  const now = new Date();
  switch (unit) {
    case "days":
      return subDays(now, value);
    case "weeks":
      return subWeeks(now, value);
    case "months":
      return subMonths(now, value);
    case "years":
      return subYears(now, value);
  }
};

const computeTimeUnits = (date?: Date): TimeUnitState => {
  const now = new Date();
  if (!date) {
    return { unit: "days", value: 1 };
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
  disabled,
}: RelativeDatePickerProps) {
  const { t } = useTranslation();
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

  const validateDate = (unit: TimeUnit, value: number) => {
    const selectedDate = computeDate(unit, value);
    const isDisabled = disabled?.(selectedDate) ?? false;
    return !isDisabled;
  };

  // Update result date
  useEffect(() => {
    setResultDate(computeDate(selected.unit, selected.value));
    onDateChange(computeDate(selected.unit, selected.value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handleUnitChange = (newUnit: TimeUnit) => {
    if (validateDate(newUnit, 1)) {
      setSelected((prev) => ({ ...prev, unit: newUnit, value: 1 }));
    } else toast.error(t("select_valid_date"));
  };

  return (
    <div className="flex flex-col h-[200px]">
      <div className="flex flex-col gap-2 p-2 items-center border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={selected.value.toString()}
            onValueChange={(value) => {
              const numValue = Number.parseInt(value) || 0;
              if (validateDate(selected.unit, numValue)) {
                setSelected((prev) => ({
                  ...prev,
                  value: numValue,
                }));
              }
            }}
            disabled={!validateDate(selected.unit, selected.value)}
          >
            <SelectTrigger className="col-span-2">
              <SelectValue placeholder={t("select_a_number")} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: maxValue }, (_, i) => i + 1).map((num) => {
                const isDisabled =
                  disabled?.(computeDate(selected.unit, num)) ?? false;
                return (
                  <SelectItem
                    key={num}
                    value={num.toString()}
                    disabled={isDisabled}
                    className={isDisabled ? "opacity-50" : ""}
                  >
                    {num}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {timeUnits.map((unit) => (
            <Button
              key={unit}
              onClick={() => handleUnitChange(unit)}
              variant={selected.unit === unit ? "default" : "outline"}
              size="sm"
              disabled={!validateDate(unit, 1)}
            >
              {unit.charAt(0).toUpperCase() + unit.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col justify-center">
        <div className="text-xl font-bold mb-1 truncate">
          {format(resultDate, "MMM d, yyyy")}
        </div>
        <div className="text-sm truncate">{format(resultDate, "EEEE")}</div>
      </div>
    </div>
  );
}
