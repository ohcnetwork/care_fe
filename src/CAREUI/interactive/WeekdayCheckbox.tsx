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
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {Object.values(DAYS_OF_WEEK).map((day) => {
        const isChecked = value.includes(day);

        return (
          <li key={day} className="w-full">
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border px-6 py-4 transition-all duration-200 ease-in-out",
                isChecked
                  ? "border-primary-500 bg-white shadow-md"
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
                className="cursor-pointer text-xs font-semibold uppercase text-center"
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
