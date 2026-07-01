import { format } from "date-fns";
import {
  ArrowLeftRight,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  BoundsDuration,
  dateOnly,
  dateOnlyToIso,
  decodeDurationValue,
  DURATION_UNIT_LABELS,
  formatDurationLabel,
  formatTimingBounds,
  generateDurationSuggestions,
  parseDurationString,
  TimingBounds,
  validateTimingBounds,
} from "@/types/emr/medicationRequest/medicationRequest";

interface DurationInputProps {
  value?: TimingBounds;
  onChange: (bounds?: TimingBounds) => void;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

// The dropdown shows duration suggestions, or hosts the range / period editors.
type View = "list" | "range" | "period";

// Range UI offers day-granularity units only (matches the design).
const RANGE_UNITS = ["d", "wk", "mo"] as const;
type RangeUnit = (typeof RANGE_UNITS)[number];

const BOUND_ICONS = {
  duration: Clock,
  range: ArrowLeftRight,
  period: CalendarIcon,
} as const;

/** Local Date (midnight) from a "YYYY-MM-DD" string, for the calendar. */
function parseLocalDate(ymd: string): Date | undefined {
  return ymd ? new Date(`${ymd}T00:00:00`) : undefined;
}

/**
 * Duration field with scheduling bounds — Duration · Range · Period.
 *
 * Built on {@link ComboboxInput}: the field is a native input where the user
 * types a duration ("5 days") and picks from suggestions, exactly like the
 * dosage field. Two dedicated, visually distinct rows switch to a day-range
 * (`bounds_range`) or fixed start/end dates (`bounds_period`). Reopening a field
 * that already holds a range or period drops straight into that editor, seeded
 * with the current value. The three bounds are mutually exclusive.
 */
export function DurationInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  className,
}: DurationInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  // While the user is actively typing, the field shows their query; otherwise
  // it shows the committed bound's summary.
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState("");

  // Range editor drafts.
  const [rLow, setRLow] = useState("5");
  const [rHigh, setRHigh] = useState("7");
  const [rUnit, setRUnit] = useState<RangeUnit>("d");

  // Period calendar draft.
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();

  const inputValue = typing ? search : value ? formatTimingBounds(value) : "";

  const suggestions = useMemo(() => {
    return generateDurationSuggestions(search)
      .map((s) => ({ label: s.label, decoded: decodeDurationValue(s.value) }))
      .filter(
        (s): s is { label: string; decoded: BoundsDuration } => !!s.decoded,
      );
  }, [search]);

  const customDuration = useMemo(() => {
    const parsed = parseDurationString(search);
    if (!parsed) return null;
    const n = Number(parsed.value);
    // Reject "0.", decimals and non-positive values at the source.
    if (!Number.isInteger(n) || n <= 0) return null;
    if (suggestions.some((s) => s.decoded.value === parsed.value)) return null;
    return parsed;
  }, [search, suggestions]);

  const currentDuration = value?.type === "duration" ? value.value : undefined;
  const isSelected = (d: BoundsDuration) =>
    !!currentDuration &&
    currentDuration.value === d.value &&
    currentDuration.unit === d.unit;

  // Same rule the submit gate enforces, so the editor and validation agree.
  const rangeValid =
    validateTimingBounds({
      type: "range",
      value: {
        low: { value: rLow, unit: rUnit },
        high: { value: rHigh, unit: rUnit },
      },
    }) === null;

  const seedRange = () => {
    if (value?.type === "range") {
      setRLow(value.value.low.value);
      setRHigh(value.value.high.value);
      setRUnit(value.value.high.unit as RangeUnit);
    }
  };

  const seedPeriod = () => {
    setDraftRange(
      value?.type === "period"
        ? {
            from: parseLocalDate(dateOnly(value.value.start)),
            to: parseLocalDate(dateOnly(value.value.end)),
          }
        : undefined,
    );
  };

  // Preload the editor matching the current bound when the dropdown opens.
  const preloadView = () => {
    if (typing) return;
    if (value?.type === "range") {
      seedRange();
      setView("range");
    } else if (value?.type === "period") {
      seedPeriod();
      setView("period");
    } else {
      setView("list");
    }
  };

  const reset = () => {
    setTyping(false);
    setSearch("");
    setView("list");
  };

  const handleValueChange = (next: string) => {
    // Hard-block decimal points (and therefore "0.") in the duration field.
    if (next.includes(".")) return;
    setTyping(true);
    setSearch(next);
    setView("list");
    setOpen(true);
    if (next.trim() === "") onChange(undefined);
  };

  const commitDuration = (d: BoundsDuration) => {
    onChange({ type: "duration", value: d });
    setOpen(false);
    reset();
  };

  const commitRange = () => {
    if (!rangeValid) return;
    onChange({
      type: "range",
      value: {
        low: { value: String(Number(rLow)), unit: rUnit },
        high: { value: String(Number(rHigh)), unit: rUnit },
      },
    });
    setOpen(false);
    reset();
  };

  const commitPeriod = () => {
    if (!draftRange?.from || !draftRange?.to) return;
    onChange({
      type: "period",
      value: {
        start: dateOnlyToIso(format(draftRange.from, "yyyy-MM-dd")),
        end: dateOnlyToIso(format(draftRange.to, "yyyy-MM-dd"), true),
      },
    });
    setOpen(false);
    reset();
  };

  const BoundIcon = value && !typing ? BOUND_ICONS[value.type] : null;

  return (
    <ComboboxInput
      value={inputValue}
      onValueChange={handleValueChange}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) preloadView();
        else reset();
      }}
      inputRef={inputRef}
      type="text"
      inputMode="numeric"
      placeholder={t("duration_placeholder")}
      disabled={disabled}
      aria-invalid={hasError}
      aria-label={t("duration")}
      onFocus={() => inputRef.current?.select()}
      contentClassName="w-72"
      className={cn(
        "h-9 text-sm",
        BoundIcon && "pl-9",
        hasError && "border-red-500",
        className,
      )}
      startAdornment={
        BoundIcon ? (
          <BoundIcon className="pointer-events-none absolute ml-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : null
      }
    >
      {view === "list" && (
        <>
          <div className="max-h-56 overflow-y-auto py-1">
            {customDuration && (
              <button
                type="button"
                onClick={() => commitDuration(customDuration)}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm hover:bg-accent"
              >
                {t("use_duration", {
                  duration: formatDurationLabel(customDuration),
                })}
              </button>
            )}
            {suggestions.map((s) => (
              <button
                type="button"
                key={`${s.decoded.value}-${s.decoded.unit}`}
                onClick={() => commitDuration(s.decoded)}
                className={cn(
                  "flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-accent",
                  isSelected(s.decoded) && "bg-accent",
                )}
              >
                {s.label}
                {isSelected(s.decoded) && (
                  <Check className="size-3.5 shrink-0 text-primary" />
                )}
              </button>
            ))}
            {!customDuration && suggestions.length === 0 && (
              <div className="px-3.5 py-2 text-sm text-muted-foreground">
                {t("no_duration_found")}
              </div>
            )}
          </div>
          {/* Dedicated, visually distinct range & period actions. */}
          <div className="border-t py-1">
            <button
              type="button"
              onClick={() => {
                seedRange();
                setView("range");
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
            >
              <ArrowLeftRight className="size-4 shrink-0" />
              <span className="flex-1">{t("duration_set_range")}</span>
              <ChevronRight className="size-3.5 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => {
                seedPeriod();
                setView("period");
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
            >
              <CalendarIcon className="size-4 shrink-0" />
              <span className="flex-1">{t("duration_set_period")}</span>
              <ChevronRight className="size-3.5 shrink-0" />
            </button>
          </div>
        </>
      )}

      {view === "range" && (
        <>
          <button
            type="button"
            onClick={() => setView("list")}
            className="flex w-full items-center gap-2 border-b px-3 py-2.5 text-left text-sm font-medium"
          >
            <ChevronLeft className="size-4 text-muted-foreground" />
            {t("duration_range_title")}
          </button>
          <div className="flex flex-col gap-3 p-3.5">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                aria-label={t("start")}
                value={rLow}
                onChange={(e) => setRLow(e.target.value)}
                className="h-9 w-12 text-center text-sm"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                aria-label={t("end")}
                value={rHigh}
                onChange={(e) => setRHigh(e.target.value)}
                className="h-9 w-12 text-center text-sm"
              />
              <Select
                value={rUnit}
                onValueChange={(u: RangeUnit) => setRUnit(u)}
              >
                <SelectTrigger className="h-9 flex-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGE_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {DURATION_UNIT_LABELS[u].plural}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              {t("duration_range_help", {
                low: rLow || "—",
                high: rHigh || "—",
                unit: DURATION_UNIT_LABELS[rUnit].plural,
              })}
            </div>
          </div>
          <div className="flex justify-end border-t px-3 py-2.5">
            <Button size="sm" onClick={commitRange} disabled={!rangeValid}>
              {t("done")}
            </Button>
          </div>
        </>
      )}

      {view === "period" && (
        <>
          <button
            type="button"
            onClick={() => setView("list")}
            className="flex w-full items-center gap-2 border-b px-3 py-2.5 text-left text-sm font-medium"
          >
            <ChevronLeft className="size-4 text-muted-foreground" />
            {t("duration_set_period")}
          </button>
          <div className="flex justify-center p-2">
            <Calendar
              mode="range"
              selected={draftRange}
              onSelect={setDraftRange}
              numberOfMonths={1}
              autoFocus
            />
          </div>
          <div className="flex justify-end border-t px-3 py-2.5">
            <Button
              size="sm"
              onClick={commitPeriod}
              disabled={!draftRange?.from || !draftRange?.to}
            >
              {t("done")}
            </Button>
          </div>
        </>
      )}
    </ComboboxInput>
  );
}
