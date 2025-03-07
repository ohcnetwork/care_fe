import { format } from "date-fns";
import { useState } from "react";

import { Input } from "@/components/ui/input";

interface DatePickerProps {
  date?: Date;
  onChange?: (date?: Date) => void;
  disabled?: boolean;
}

export function DatePicker({ date, onChange, disabled }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(
    date ? format(date, "yyyy-MM-dd") : "",
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;

    setSelectedDate(e.target.value);
    onChange?.(newDate);
  };

  return (
    <Input
      type="date"
      value={selectedDate}
      onChange={handleDateChange}
      disabled={disabled}
    />
  );
}
