import { t } from "i18next";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DateRange = { from?: Date; to?: Date };

type NativeDatePickerRangeProps = {
  date?: DateRange;
  onChange?: (date?: DateRange) => void;
  className?: string;
};

export function NativeDatePickerRange({
  date,
  onChange,
  className,
}: NativeDatePickerRangeProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(date?.from);
  const [endDate, setEndDate] = useState<Date | undefined>(date?.to);

  const handleDateChange = (key: "from" | "to", value: string) => {
    const parsedDate = value ? new Date(value) : undefined;

    if (!parsedDate) return;

    if (key === "from") {
      if (endDate && parsedDate > endDate) {
        toast.error(t("start_date_must_be_before_end_date"));
        return;
      }
      setStartDate(parsedDate);
      onChange?.({ from: parsedDate, to: endDate });
    } else {
      if (startDate && parsedDate < startDate) {
        toast.error(t("end_date_must_be_after_start_date"));
        return;
      }
      setEndDate(parsedDate);
      onChange?.({ from: startDate, to: parsedDate });
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-2">
        <Label className="text-gray-700 font-medium">{t("start_date")}</Label>
        <Input
          type="date"
          value={startDate ? startDate.toISOString().split("T")[0] : ""}
          onChange={(e) => handleDateChange("from", e.target.value)}
          className="border px-3 py-2 rounded-md"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-gray-700 font-medium">{t("end_date")}</Label>
        <Input
          type="date"
          value={endDate ? endDate.toISOString().split("T")[0] : ""}
          onChange={(e) => handleDateChange("to", e.target.value)}
          className={cn(
            "border px-3 py-2 rounded-md",
            endDate && startDate && endDate < startDate ? "border-red-500" : "",
          )}
        />
      </div>
    </div>
  );
}
