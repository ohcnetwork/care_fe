import { format } from "date-fns";
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
}

export function DatePicker({ date, onChange, disabled }: DatePickerProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-gray-500",
            "sm:w-auto",
          )}
        >
          <CareIcon
            icon="l-calender"
            className="mr-0 sm:mr-2 size-4 shrink-0"
          />
          <span className="truncate">
            {date ? (
              <>
                <span className="block sm:hidden">
                  {format(date, "MMM d, yyyy")}
                </span>
                <span className="hidden sm:block">{format(date, "PPP")}</span>
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
          initialFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
