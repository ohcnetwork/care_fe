import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string | undefined;
  onDateChange: (val: string | undefined) => void;
  disabled?: boolean;
  blockDate?: (date: Date) => boolean;
  className?: string;
  dateFormat?: string;
  id?: string;
}

function formatTime(date: Date | undefined): string {
  if (!date) return "";
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function parseIso(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (isNaN(date.getTime())) return undefined;
  return date;
}

export function DateTimePicker({
  value,
  onDateChange,
  disabled,
  blockDate,
  className,
  dateFormat,
  id,
}: DateTimePickerProps) {
  const currentValue = parseIso(value);

  const emit = (date: Date) => {
    onDateChange(date.toISOString());
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      onDateChange(undefined);
      return;
    }
    if (currentValue) {
      date.setHours(currentValue.getHours());
      date.setMinutes(currentValue.getMinutes());
      date.setSeconds(currentValue.getSeconds());
    } else {
      const now = new Date();
      date.setHours(now.getHours());
      date.setMinutes(now.getMinutes());
      date.setSeconds(0);
    }
    emit(date);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = event.target.value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;
    const date = currentValue ? new Date(currentValue) : new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    emit(date);
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <DatePicker
        date={currentValue}
        onChange={handleDateChange}
        disablePicker={disabled}
        disabled={blockDate}
        className="flex-1"
        dateFormat={dateFormat}
      />
      <Input
        id={id}
        type="time"
        className="sm:w-[140px] text-sm sm:text-base"
        value={formatTime(currentValue)}
        onChange={handleTimeChange}
        disabled={disabled || !currentValue}
      />
    </div>
  );
}
