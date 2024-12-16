import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";

// 0 is Monday, 6 is Sunday - Python's convention.
const DAYS_OF_WEEK = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
} as const;

export type DayOfWeekValue = (typeof DAYS_OF_WEEK)[keyof typeof DAYS_OF_WEEK];

interface Props {
  value?: DayOfWeekValue[];
  onChange?: (value: DayOfWeekValue[]) => void;
}

export default function WeekdayCheckbox({ value = [], onChange }: Props) {
  const { t } = useTranslation();

  const handleDayToggle = (day: DayOfWeekValue) => {
    if (!onChange) return;

    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <ul className="flex justify-between">
      {Object.values(DAYS_OF_WEEK).map((day) => {
        const isChecked = value.includes(day);

        return (
          <li key={day}>
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border px-8 py-6 transition-all duration-200 ease-in-out",
                isChecked
                  ? "border-primary-500 bg-white shadow"
                  : "border-gray-300",
              )}
            >
              <Checkbox
                id={`day_of_week_checkbox_${day}`}
                checked={isChecked}
                onCheckedChange={() => handleDayToggle(day)}
              />
              <label
                htmlFor={`day_of_week_checkbox_${day}`}
                className="cursor-pointer text-xs font-semibold uppercase"
                onClick={(e) => e.stopPropagation()}
              >
                {t(`DAYS_OF_WEEK_SHORT__${day}`)}
              </label>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
