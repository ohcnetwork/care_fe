import { format } from "date-fns";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Input } from "./input";

interface DateTimePickerProps {
  value?: string;
  onChange?: (date?: string) => void;
  className?: string;

  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [dateTime, setDateTime] = useState(value || "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateTime = e.target.value;
    setDateTime(newDateTime);
    onChange?.(newDateTime);
  };

  const formattedDateTime = dateTime
    ? format(new Date(dateTime), "yyyy-MM-dd'T'HH:mm")
    : "";

  return (
    <div className={cn(className)}>
      <Input
        type="datetime-local"
        value={formattedDateTime}
        disabled={disabled}
        onChange={handleChange}
      />
    </div>
  );
}
