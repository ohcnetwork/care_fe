import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  value?: string | null; // ISO string
  onChange?: (val: string | null) => void;
  placeholder?: string;
  className?: string;
  min?: string; // ISO string
  max?: string; // ISO string
  disabled?: boolean;
};

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  className,
  min,
  max,
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsedDate = value ? new Date(value) : undefined;

  const [date, setDate] = React.useState<Date | undefined>(parsedDate);
  const [hour, setHour] = React.useState<string>(
    parsedDate ? format(parsedDate, "HH") : "12",
  );
  const [minute, setMinute] = React.useState<string>(
    parsedDate ? format(parsedDate, "mm") : "00",
  );

  // Update internal state when `value` prop changes
  React.useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setDate(d);
        setHour(format(d, "HH"));
        setMinute(format(d, "mm"));
      }
    } else {
      setDate(undefined);
    }
  }, [value]);

  // Generate hours and minutes list
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  // Sync changes → return ISO string
  React.useEffect(() => {
    if (date) {
      const updated = new Date(date);
      updated.setHours(Number(hour), Number(minute), 0, 0);

      // Respect min/max bounds if passed
      if (min && updated < new Date(min)) return;
      if (max && updated > new Date(max)) return;

      onChange?.(updated.toISOString());
    } else {
      onChange?.(null);
    }
  }, [date, hour, minute]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <>
              {format(date, "dd-MM-yyyy")} {hour}:{minute}
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-3 w-auto p-3">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => setDate(d)}
          disabled={(d) => {
            const minDate = min ? new Date(min) : undefined;
            const maxDate = max ? new Date(max) : undefined;

            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
          autoFocus
        />

        <div className="flex gap-4 items-end">
          {/* Hour Select */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">HH</label>
            <Select value={hour} onValueChange={setHour} disabled={!date}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {hours.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Minute Select */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">MM</label>
            <Select value={minute} onValueChange={setMinute} disabled={!date}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {minutes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
