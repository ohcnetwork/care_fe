import { format } from "date-fns";
import * as React from "react";

import { Input } from "@/components/ui/input";

function toISOWithTimezone(localVal: string): string | undefined {
  if (!localVal) return undefined;
  const localDate = new Date(localVal);
  if (isNaN(localDate.getTime())) return undefined;
  return localDate.toISOString();
}

function toLocalDateTimeString(
  isoString: string | undefined,
): string | undefined {
  if (!isoString) return undefined;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return undefined;
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

type DateTimeInputProps = React.ComponentProps<typeof Input> & {
  onDateChange: (val: string | undefined) => void;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function DateTimeInput({
  value,
  onDateChange,
  ...props
}: DateTimeInputProps & React.ComponentProps<"input">) {
  const localValue =
    !value || typeof value !== "string"
      ? undefined
      : toLocalDateTimeString(value);

  return (
    <Input
      {...props}
      type="datetime-local"
      value={localValue}
      onChange={(e) => {
        onDateChange(toISOWithTimezone(e.target.value));
      }}
    />
  );
}
