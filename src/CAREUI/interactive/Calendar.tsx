import React from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { getMonthStartAndEnd } from "@/Utils/utils";

interface Props {
  className?: string;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  renderDay?: (date: Date) => React.ReactNode;
  highlightToday?: boolean;
}

export default function Calendar(props: Props) {
  const currentMonth = props.month ?? new Date();
  const highlightToday = props.highlightToday ?? true;
  const currentMonthRange = getMonthStartAndEnd(currentMonth);

  // Calculate days to display from previous month
  const startingDayOfWeek = currentMonthRange.start.getDay();

  // Generate calendar days array for current month only
  const calendarDays: Date[] = [];

  // Add empty slots for previous month days
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null as unknown as Date);
  }

  // Add current month's days
  for (let i = 1; i <= currentMonthRange.end.getDate(); i++) {
    calendarDays.push(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
    );
  }

  const handlePrevMonth = () => {
    const prevMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
    );
    props.onMonthChange?.(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
    );
    props.onMonthChange?.(nextMonth);
  };

  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className={`${props.className} w-full`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200"
          >
            <CareIcon icon="l-angle-left" />
          </button>
          <button
            onClick={handleNextMonth}
            className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200"
          >
            <CareIcon icon="l-angle-right" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 md:gap-1.5">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-medium">
            {day}
          </div>
        ))}

        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-16" />;
          }

          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={cn(
                "relative min-h-16 rounded-lg",
                isToday && highlightToday && "ring-2 ring-primary-400",
              )}
            >
              {props.renderDay?.(date) ?? (
                <span className="block text-right p-2 transition-all rounded-lg bg-white text-gray-900">
                  {date.getDate()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
