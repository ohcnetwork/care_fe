import { format } from "date-fns";
import * as React from "react";

import { Input } from "@/components/ui/input";

function toISOWithTimezone(localVal: string): string {
  const localDate = new Date(localVal);
  return localDate.toISOString();
}

function toLocalDateTimeString(isoString: string): string {
  const date = new Date(isoString);
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

type DateTimeInputProps = {
  value?: string;
  onDateChange?: (val: string) => void;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function DateTimeInput({
  value,
  onDateChange,
  ...props
}: DateTimeInputProps & React.ComponentProps<"input">) {
  const localValue = value ? toLocalDateTimeString(value) : "";

  return (
    <Input
      type="datetime-local"
      value={localValue}
      onChange={(e) => {
        const newLocalVal = e.target.value;
        if (onDateChange) onDateChange(toISOWithTimezone(newLocalVal));
      }}
      {...props}
    />
  );
}
