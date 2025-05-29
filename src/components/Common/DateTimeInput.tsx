import { format } from "date-fns";
import * as React from "react";

import { Input } from "@/components/ui/input";

function toISOWithTimezone(localVal: string): string {
  if (!localVal) return "";
  const localDate = new Date(localVal);
  if (isNaN(localDate.getTime())) return "";
  return localDate.toISOString();
}

function toLocalDateTimeString(isoString: string | undefined): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

type DateTimeInputProps = React.ComponentProps<typeof Input> & {
  onDateChange?: (val: string) => void;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function DateTimeInput({
  value,
  onDateChange,
  ...props
}: DateTimeInputProps & React.ComponentProps<"input">) {
  const localValue = React.useMemo(() => {
    if (!value || typeof value !== "string") return "";
    return toLocalDateTimeString(value);
  }, [value]);

  return (
    <Input
      {...props}
      type="datetime-local"
      value={localValue}
      onChange={(e) => {
        const newLocalVal = e.target.value;
        if (onDateChange) {
          const iso = toISOWithTimezone(newLocalVal);
          if (iso) {
            onDateChange(iso);
          } else {
            onDateChange("");
          }
        }
      }}
    />
  );
}
