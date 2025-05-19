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

type DateTimeInputProps = { value?: string; onChange?: (val: string) => void };

export function DateTimeInput({
  value,
  onChange,
  ...props
}: DateTimeInputProps & React.ComponentProps<"input">) {
  const localValue = value ? toLocalDateTimeString(value) : "";

  return (
    <Input
      type="datetime-local"
      value={localValue}
      onChange={(e) => {
        const newLocalVal = e.target.value;
        if (onChange) onChange(toISOWithTimezone(newLocalVal));
      }}
      {...props}
    />
  );
}
