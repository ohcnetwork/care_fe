import { CircleStop } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

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
  const { t } = useTranslation();
  const todayRef = useRef<HTMLDivElement>(null);

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

  const handleToday = () => {
    const today = new Date();
    props.onMonthChange?.(today);

    // Scroll to today's date after a short delay to ensure the calendar has updated
    setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  // Effect to scroll to today when the month changes to current month
  useEffect(() => {
    const today = new Date();
    const isCurrentMonth =
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();

    if (isCurrentMonth && todayRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (todayRef.current) {
          todayRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 50);
    }
  }, [currentMonth]);

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
          <Button variant="ghost" size="lg" onClick={handleToday}>
            <CircleStop className="size-4" />
            <span className="text-xs font-semibold underline">
              {t("today")}
            </span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevMonth}
            className="rounded-lg bg-white py-2 px-2.5"
          >
            <CareIcon icon="l-angle-left" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleNextMonth}
            className="rounded-lg bg-white py-2 px-2.5"
          >
            <CareIcon icon="l-angle-right" />
          </Button>
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
              ref={isToday ? todayRef : null}
              className={cn(
                "relative min-h-16 rounded-lg transition-all",
                isToday &&
                  highlightToday &&
                  "ring-2 ring-primary-400 shadow-lg",
              )}
            >
              {props.renderDay?.(date) ?? (
                <span
                  className={cn(
                    "block text-right p-2 transition-all rounded-lg bg-white text-gray-900",
                    isToday &&
                      highlightToday &&
                      "bg-primary-50 font-bold text-primary-900",
                  )}
                >
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
