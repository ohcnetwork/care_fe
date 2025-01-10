import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

// 0 is Monday, 6 is Sunday - Python's convention.
export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

const dayOfWeekKeys = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

interface Props {
  value: DayOfWeek[] | null;
  onChange: (value: DayOfWeek[] | null) => void;
  format?: "alphabet" | "short" | "long";
}

export default function WeekdayCheckbox({
  value = [],
  onChange,
  format = "alphabet",
}: Props) {
  const selectedDays = value ?? [];
  const { t } = useTranslation();

  const handleDayToggle = (day: DayOfWeek) => {
    if (!onChange) return;

    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div className="flex gap-2 md:gap-4">
      {dayOfWeekKeys.map((day) => {
        const dow = DayOfWeek[day as keyof typeof DayOfWeek];
        const isSelected = selectedDays.includes(dow);

        return (
          <Button
            key={dow}
            type="button"
            variant={isSelected ? "outline_primary" : "outline"}
            onClick={() => handleDayToggle(dow)}
            size={format === "alphabet" ? "icon" : "default"}
            aria-pressed={isSelected}
            aria-checked={isSelected}
            aria-label={t(`DAYS_OF_WEEK__${dow}`)}
          >
            {format === "alphabet"
              ? day[0]
              : format === "short"
                ? t(`DAYS_OF_WEEK_SHORT__${dow}`)
                : t(`DAYS_OF_WEEK__${dow}`)}
          </Button>
        );
      })}
    </div>
  );
}
