import { Separator } from "@radix-ui/react-separator";
import {
  format,
  isToday,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangeFilterProps {
  dateFrom?: Date;
  dateTo?: Date;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onDateRangeChange?: (from: Date | undefined, to: Date | undefined) => void;
  onClear: () => void;
  className?: string;
  popoverPlaceholder?: string;
}

interface DateRangeOption {
  label: string;
  getDateRange: () => { from: Date; to: Date };
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onDateRangeChange,
  onClear,
  className,
  popoverPlaceholder,
}: DateRangeFilterProps) {
  const { t } = useTranslation();
  const hasDateFilter = dateFrom || dateTo;
  const [open, setOpen] = useState(false);

  const dateRangeOptions: DateRangeOption[] = [
    {
      label: t("last_count_days", { count: 7 }),
      getDateRange: () => ({
        from: subDays(new Date(), 7),
        to: new Date(),
      }),
    },
    {
      label: t("last_count_weeks", { count: 3 }),
      getDateRange: () => ({
        from: subWeeks(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: t("last_month"),
      getDateRange: () => ({
        from: subMonths(new Date(), 1),
        to: new Date(),
      }),
    },
    {
      label: t("last_count_months", { count: 3 }),
      getDateRange: () => ({
        from: subMonths(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: t("last_count_months", { count: 6 }),
      getDateRange: () => ({
        from: subMonths(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: t("last_year"),
      getDateRange: () => ({
        from: subYears(new Date(), 1),
        to: new Date(),
      }),
    },
  ];

  const handleDateRangeSelect = (option: DateRangeOption) => {
    const { from, to } = option.getDateRange();
    if (onDateRangeChange) {
      onDateRangeChange(from, to);
    } else {
      onDateFromChange(from);
      onDateToChange(to);
    }
    setOpen(false);
  };

  const formatDateRange = () => {
    if (dateFrom && dateTo) {
      const fromText = isToday(dateFrom)
        ? t("today")
        : format(dateFrom, "dd MMM yyyy");
      const toText = isToday(dateTo)
        ? t("today")
        : format(dateTo, "dd MMM yyyy");
      return `${fromText} - ${toText}`;
    } else if (dateFrom) {
      const fromText = isToday(dateFrom)
        ? t("today")
        : format(dateFrom, "dd MMM yyyy");
      return `${fromText} - ${t("today")}`;
    } else if (dateTo) {
      const toText = isToday(dateTo)
        ? t("today")
        : format(dateTo, "dd MMM yyyy");
      return `${t("until")} - ${toText}`;
    }
    return t("date_range");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between bg-transparent overflow-hidden",
            className,
          )}
        >
          <div className="flex items-center justify-between w-full gap-2 -mr-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-gray-600" />
              <span
                className={cn(
                  "text-sm",
                  hasDateFilter ? "text-gray-950 underline" : "text-gray-500",
                )}
              >
                {formatDateRange()}
              </span>
            </div>
            {hasDateFilter && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                size="icon"
                variant="ghost"
                className="pl-2 size-8 border-l border-gray-400 rounded-none"
                title={t("clear")}
              >
                <X className="text-gray-950" />
              </Button>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
      >
        <div className="p-2 pb-1">
          <span className="text-sm text-gray-950">
            {popoverPlaceholder || t("select_date_range")}
          </span>
        </div>
        <div className="p-2 pt-0">
          <div className="grid grid-cols-2 gap-2 p-0 pb-2">
            <div>
              <label className="text-xs text-gray-600 mb-1 block capitalize">
                {t("from")}
              </label>
              <CombinedDatePicker
                value={dateFrom}
                onChange={(date) => {
                  onDateFromChange(date);
                }}
                placeholder={t("start_date")}
                buttonClassName="truncate"
                dateFormat="dd MMM yyyy"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block capitalize">
                {t("to")}
              </label>
              <CombinedDatePicker
                value={dateTo}
                onChange={(date) => {
                  onDateToChange(date);
                }}
                placeholder={t("end_date")}
                dateFormat="dd MMM yyyy"
              />
            </div>
          </div>
          <div className="my-2">
            <Separator orientation="horizontal" className="bg-gray-200 h-px" />
          </div>
          {dateRangeOptions.map((option, index) => (
            <Button
              key={index}
              onClick={() => handleDateRangeSelect(option)}
              variant="ghost"
              className="w-full justify-start px-3 font-medium text-sm text-gray-950"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
