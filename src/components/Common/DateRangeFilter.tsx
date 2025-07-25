import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import { Label } from "@/components/ui/label";
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
  onClear: () => void;
  className?: string;
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  className,
}: DateRangeFilterProps) {
  const { t } = useTranslation();

  const hasDateFilter = dateFrom || dateTo;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            " justify-between bg-transparent overflow-hidden",
            className,
          )}
        >
          <div className="flex items-center justify-between w-full gap-2 -mr-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-gray-600" />
              {hasDateFilter ? (
                <div className="flex items-center gap-1">
                  <div className="text-sm font-medium text-gray-950">
                    {t("date_range")}
                  </div>
                  <span className="text-sm text-gray-600 lowercase">
                    {t("is")}
                  </span>
                  <span className="text-sm text-gray-950 underline">
                    {dateFrom && dateTo
                      ? `${format(dateFrom, "dd MMM")} - ${format(dateTo, "dd MMM yyyy")}`
                      : dateFrom
                        ? `${format(dateFrom, "dd MMM")} - ${t("ongoing")}`
                        : `${t("before")} ${format(dateTo!, "dd MMM yyyy")}`}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500 mr-2">
                  {t("date_range")}
                </span>
              )}
            </div>
            {hasDateFilter && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                size="icon"
                variant="ghost"
                className={cn(
                  "pl-2 size-8 border-l border-gray-400 rounded-none",
                )}
              >
                <X className="text-gray-950" />
              </Button>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium mb-1 block text-gray-700">
              {t("start_date")}
            </Label>
            <CombinedDatePicker
              value={dateFrom}
              onChange={onDateFromChange}
              placeholder={t("pick_a_date")}
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block text-gray-700">
              {t("end_date")}
            </Label>
            <CombinedDatePicker
              value={dateTo}
              onChange={onDateToChange}
              placeholder={t("pick_a_date")}
              blockDate={(date) => (dateFrom ? date < dateFrom : false)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
