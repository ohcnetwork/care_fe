import { format } from "date-fns";
import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onChange?: (date?: Date) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  disablePicker?: boolean;
  dateFormat?: string;
  onClear?: () => void;
}

export function DatePicker({
  date,
  onChange,
  disabled,
  className,
  disablePicker,
  dateFormat = "PPP",
  onClear,
}: DatePickerProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const picker = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-gray-500",
            "sm:w-auto",
            onClear && date && "rounded-r-none border-r-0",
            className,
          )}
          disabled={disablePicker}
        >
          <CareIcon icon="l-calender" className="mr-0 size-4 shrink-0" />
          <span className="truncate">
            {date ? (
              <>
                <span className="block sm:hidden">
                  {format(date, "MMM d, yyyy")}
                </span>
                <span className="hidden sm:block">
                  {format(date, dateFormat)}
                </span>
              </>
            ) : (
              <span>{t("pick_a_date")}</span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 sm:w-64" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          captionLayout="dropdown"
          endMonth={new Date(2100, 11, 31)}
          autoFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );

  // Only introduce the clear affordance (and its wrapper) when a caller opts in
  // via `onClear`; other callers keep the original single-trigger structure.
  if (!onClear) {
    return picker;
  }

  return (
    <div className="flex flex-1 items-center">
      {picker}
      {date && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={disablePicker}
          data-testid="datetime-picker-clear"
          aria-label={t("clear")}
          className="h-8 border-l hover:bg-transparent w-9 rounded-none text-gray-400 border-gray-400"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
