import {
  ArrowLeftRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  BoundsDuration,
  decodeDurationValue,
  DURATION_UNIT_LABELS,
  formatDurationLabel,
  formatTimingBounds,
  generateDurationSuggestions,
  parseDurationString,
  TimingBounds,
} from "@/types/emr/medicationRequest/medicationRequest";

interface DurationInputProps {
  value?: TimingBounds;
  onChange: (bounds: TimingBounds) => void;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

type View = "list" | "range" | "period";

// ponytail: range UI offers day-granularity units only (matches the design).
const RANGE_UNITS = ["d", "wk", "mo"] as const;
type RangeUnit = (typeof RANGE_UNITS)[number];

const BOUND_ICONS = {
  duration: Clock,
  range: ArrowLeftRight,
  period: Calendar,
} as const;

/** "YYYY-MM-DD" from a stored ISO timestamp, for <input type="date">. */
function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : "";
}

/** A <input type="date"> value to a tz-aware ISO timestamp. */
function fromDateInput(date: string, endOfDay = false): string | undefined {
  if (!date) return undefined;
  return new Date(
    `${date}T${endOfDay ? "23:59:59" : "00:00:00"}`,
  ).toISOString();
}

function summarize(value?: TimingBounds) {
  if (!value) return null;
  return { icon: BOUND_ICONS[value.type], text: formatTimingBounds(value) };
}

/**
 * Duration field with scheduling bounds — Duration · Range · Period.
 *
 * Default flow types/picks a single duration (`bounds_duration`). The foot of
 * the dropdown switches to a range of days (`bounds_range`) or fixed start/end
 * dates (`bounds_period`). The three are mutually exclusive.
 */
export function DurationInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  className,
}: DurationInputProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");

  // Drafts for the range / period sub-views, seeded from the current value.
  const [rLow, setRLow] = useState("5");
  const [rHigh, setRHigh] = useState("7");
  const [rUnit, setRUnit] = useState<RangeUnit>("d");
  const [pStart, setPStart] = useState("");
  const [pEnd, setPEnd] = useState("");

  const summary = summarize(value);

  const presets = useMemo(() => {
    const suggestions = generateDurationSuggestions(search);
    const current = value?.type === "duration" ? value.value : undefined;
    return suggestions.map((s) => {
      const decoded = decodeDurationValue(s.value);
      const selected =
        !!current &&
        !!decoded &&
        current.value === decoded.value &&
        current.unit === decoded.unit;
      return { ...s, selected };
    });
  }, [search, value]);

  const customPreset = useMemo(() => {
    const parsed = parseDurationString(search);
    if (!parsed) return null;
    if (presets.some((p) => p.value === `${parsed.value}-${parsed.unit}`)) {
      return null;
    }
    return parsed;
  }, [search, presets]);

  const openPopover = () => {
    setSearch("");
    if (value?.type === "range") {
      setRLow(value.value.low.value);
      setRHigh(value.value.high.value);
      setRUnit(value.value.high.unit as RangeUnit);
      setView("range");
    } else if (value?.type === "period") {
      setPStart(toDateInput(value.value.start));
      setPEnd(toDateInput(value.value.end));
      setView("period");
    } else {
      setView("list");
    }
    setOpen(true);
  };

  const pickDuration = (duration: BoundsDuration) => {
    onChange({ type: "duration", value: duration });
    setOpen(false);
  };

  const commitRange = () => {
    onChange({
      type: "range",
      value: {
        low: { value: rLow, unit: rUnit },
        high: { value: rHigh, unit: rUnit },
      },
    });
    setOpen(false);
  };

  const commitPeriod = () => {
    onChange({
      type: "period",
      value: {
        start: fromDateInput(pStart),
        end: fromDateInput(pEnd, true),
      },
    });
    setOpen(false);
  };

  const SummaryIcon = summary?.icon;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => (o ? openPopover() : setOpen(false))}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50",
            hasError && "border-red-500",
            className,
          )}
        >
          <span className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            {SummaryIcon && (
              <SummaryIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span
              className={cn("truncate", !summary && "text-muted-foreground")}
            >
              {summary?.text ?? t("duration_placeholder")}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-66 p-0">
        {view === "list" && (
          <>
            <div className="flex items-center gap-2 border-b px-3 py-2.5">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("duration_input_placeholder")}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {customPreset && (
                <button
                  type="button"
                  onClick={() => pickDuration(customPreset)}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm hover:bg-accent"
                >
                  <Plus className="size-3.5 shrink-0 text-primary" />
                  {t("use_duration", {
                    duration: formatDurationLabel(customPreset),
                  })}
                </button>
              )}
              {presets.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => {
                    const decoded = decodeDurationValue(p.value);
                    if (decoded) pickDuration(decoded);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-accent",
                    p.selected && "bg-accent",
                  )}
                >
                  {p.label}
                  {p.selected && (
                    <Check className="size-3.5 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t py-1">
              <button
                type="button"
                onClick={() => setView("range")}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
              >
                <ArrowLeftRight className="size-4 shrink-0" />
                <span className="flex-1">{t("duration_set_range")}</span>
                <ChevronRight className="size-3.5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setView("period")}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
              >
                <Calendar className="size-4 shrink-0" />
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
                  value={rLow}
                  onChange={(e) => setRLow(e.target.value)}
                  className="h-9 w-12 text-center text-sm"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  min={1}
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
              <Button size="sm" onClick={commitRange}>
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
              {t("duration_period_title")}
            </button>
            <div className="flex flex-col gap-3 p-3.5">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium">{t("start")}</span>
                <Input
                  type="date"
                  value={pStart}
                  onChange={(e) => setPStart(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium">{t("end")}</span>
                <Input
                  type="date"
                  value={pEnd}
                  onChange={(e) => setPEnd(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end border-t px-3 py-2.5">
              <Button
                size="sm"
                onClick={commitPeriod}
                disabled={!pStart || !pEnd}
              >
                {t("done")}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
