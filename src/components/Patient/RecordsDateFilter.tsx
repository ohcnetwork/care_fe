import { format, isSameDay } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FilterDateRange,
  longDateRangeOptions,
} from "@/components/ui/multi-filter/utils/Utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function RecordsDateFilter({
  value,
  onChange,
  className,
}: {
  value: FilterDateRange;
  onChange: (range: FilterDateRange) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDateRange>(value);

  // Discard any unconfirmed calendar drag every time the popover re-opens.
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(value);
    setOpen(next);
  };

  const hasValue = !!value.from || !!value.to;

  const label = !hasValue
    ? t("date")
    : value.from && value.to && !isSameDay(value.from, value.to)
      ? `${format(value.from, "d MMM")} – ${format(value.to, "d MMM yyyy")}`
      : format((value.from ?? value.to) as Date, "d MMM yyyy");

  const applyPreset = (range: FilterDateRange) => {
    onChange(range);
    setOpen(false);
  };

  const applyCustom = () => {
    onChange(draft);
    setOpen(false);
  };

  const clear = () => {
    onChange({});
    setOpen(false);
  };

  const trigger = (
    <Button
      aria-pressed={hasValue}
      className={cn(
        "flex gap-2.5 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-2xs",
        hasValue
          ? "bg-gray-900 text-white"
          : "border border-gray-200 bg-white text-gray-900 hover:border-gray-300",
        className,
      )}
    >
      <CalendarDays className="size-3.5" strokeWidth={2} />
      {label}
    </Button>
  );

  const presets = (
    <div className="flex flex-wrap justify-evenly gap-2 border-t border-gray-100 px-4 py-3">
      {longDateRangeOptions.map((option) => (
        <Button
          key={option.label + (option.count ?? "")}
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full flex-1 font-semibold"
          onClick={() => applyPreset(option.getDateRange())}
        >
          {option.count
            ? t(option.label, { count: option.count })
            : t(option.label)}
        </Button>
      ))}
    </div>
  );

  const calendar = (
    <Calendar
      mode="range"
      numberOfMonths={1}
      disabled={{ after: new Date() }}
      selected={{ from: draft.from, to: draft.to }}
      onSelect={(range) => setDraft({ from: range?.from, to: range?.to })}
      className="self-center"
    />
  );

  const footer = (
    <div className="flex gap-2 px-4 py-3">
      <Button variant="outline" className="flex-1" onClick={clear}>
        {t("clear")}
      </Button>
      <Button
        className="flex-1"
        onClick={applyCustom}
        disabled={!draft.from && !draft.to}
      >
        {t("apply")}
      </Button>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[calc(100vw-2rem)] max-h-[60vh] max-w-80 overflow-auto overscroll-contain rounded-2xl p-0 pt-3"
      >
        {calendar}
        {footer}
        {presets}
      </PopoverContent>
    </Popover>
  );
}
