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
    <div
      className={
        format === "alphabet" ? "flex flex-col gap-2" : "flex gap-2 md:gap-4"
      }
    >
      <div className="flex gap-2 md:gap-4">
        {dayOfWeekKeys.map((day) => {
          const dow = DayOfWeek[day as keyof typeof DayOfWeek];
          const isSelected = selectedDays.includes(dow);

          return (
            <Button
              key={dow}
              type="button"
              variant={isSelected ? "primary" : "outline"}
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
      <div>
        <Button
          type="button"
          // variant={selectedDays.length === dayOfWeekKeys.length ? "primary" : "outline" }
          variant={"outline_primary"}
          onClick={() => {
            if (selectedDays.length === dayOfWeekKeys.length) {
              onChange([]);
            } else {
              onChange(dayOfWeekKeys.map((day) => DayOfWeek[day]));
            }
          }}
        >
          {selectedDays.length === dayOfWeekKeys.length
            ? t(`unselect_all`)
            : t(`select_all`)}
        </Button>
      </div>
    </div>
  );
}
