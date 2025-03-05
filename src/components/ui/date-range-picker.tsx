import dayjs from "dayjs";
import { t } from "i18next";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRangePickerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  date?: DateRange;
  onChange?: (date?: DateRange) => void;
  className?: string;
};

export function DateRangePicker({
  date,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-center text-left font-normal",
              !date && "text-gray-500",
            )}
          >
            <CareIcon icon="l-calender" className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {dayjs(date.from).format("MMM DD, YYYY")} -{" "}
                  {dayjs(date.to).format("MMM DD, YYYY")}
                </>
              ) : (
                dayjs(date.from).format("MMM DD, YYYY")
              )
            ) : (
              <span>{t("pick_a_date")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
