import {
  addMonths,
  differenceInCalendarDays,
  format,
  isSameMonth,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  type AriaAttributes,
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import FilterHeader from "@/components/ui/multi-filter/filterHeader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SegmentedDateInput } from "@/components/ui/segmented-date-input";
import { cn } from "@/lib/utils";

export interface DateRangeValue {
  from?: Date;
  to?: Date;
}

export interface DateRangePickerProps {
  variant?: "panel" | "popover";
  value?: DateRangeValue;
  onApply: (range: DateRangeValue) => void;
  minDate?: Date;
  maxDate?: Date;
  allowOpenEnded?: boolean;
  title?: string;
  onBack?: () => void;
  /** Focus the start date when a `panel` mounts; popovers always do this on open. */
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  /** Forwarded to the popover trigger so `FormControl` can label and describe it. */
  id?: string;
  /** Names the popover trigger; the current range is appended to this label. */
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  /** Lets a `panel` host apply the draft when it closes, as the popover does. */
  ref?: Ref<DateRangePickerHandle>;
}

export interface DateRangePickerHandle {
  /**
   * The draft to apply when the picker closes for any reason except Escape:
   * a complete, valid range that differs from `value`, otherwise undefined.
   */
  readonly dismissRange?: DateRangeValue;
}

type Edge = "from" | "to";
type FieldText = Record<Edge, string>;
const YEARS_PER_PAGE = 12;

const fieldDate = (date?: Date) => (date ? format(date, "dd/MM/yyyy") : "");
const localDate = (date?: Date) =>
  date && isValid(date) ? startOfDay(date) : undefined;
const sameDay = (a?: Date, b?: Date) =>
  localDate(a)?.getTime() === localDate(b)?.getTime();

function parseDate(text: string): Date | undefined {
  const value = text.trim().toLowerCase();
  if (value === "t" || value === "today") return startOfDay(new Date());
  if (value === "y" || value === "yesterday") {
    return startOfDay(subDays(new Date(), 1));
  }
  const patterns = [
    { expression: /^\d{1,2}\/\d{1,2}\/\d{4}$/, pattern: "d/M/yyyy" },
    { expression: /^\d{1,2}-\d{1,2}-\d{4}$/, pattern: "d-M-yyyy" },
    { expression: /^\d{1,2}\.\d{1,2}\.\d{4}$/, pattern: "d.M.yyyy" },
    { expression: /^\d{8}$/, pattern: "ddMMyyyy" },
    { expression: /^\d{1,2}\/\d{1,2}\/\d{2}$/, pattern: "d/M/yy" },
    { expression: /^\d{1,2}-\d{1,2}-\d{2}$/, pattern: "d-M-yy" },
    { expression: /^\d{1,2}\.\d{1,2}\.\d{2}$/, pattern: "d.M.yy" },
    { expression: /^\d{6}$/, pattern: "ddMMyy" },
  ];
  for (const { expression, pattern } of patterns) {
    if (!expression.test(value)) continue;
    const date = parse(value, pattern, new Date());
    if (isValid(date) && date.getFullYear() >= 1900) return startOfDay(date);
  }
  return undefined;
}

function maskDate(next: string, previous: string) {
  if (previous.endsWith("/") && next === `${previous}/`) return previous;
  if (next.length <= previous.length) return next;
  if (/^\d{2}$/.test(next) || /^\d{2}\/\d{2}$/.test(next)) {
    return `${next}/`;
  }
  if (/^\d{8}$/.test(next)) {
    return `${next.slice(0, 2)}/${next.slice(2, 4)}/${next.slice(4)}`;
  }
  return next;
}

function hasFullYear(text: string) {
  return /^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$/.test(text) || /^\d{8}$/.test(text);
}

function rangeText(
  range: DateRangeValue,
  dateLabel: (date: Date, year?: boolean) => string,
) {
  if (!range.from || !range.to) return "";
  return `${dateLabel(range.from, range.from.getFullYear() !== range.to.getFullYear())} – ${dateLabel(range.to)}`;
}

/**
 * A local-date range editor. Apply commits any valid draft. Closing the
 * picker for any reason except Escape applies a complete, changed range:
 * popovers do this themselves; `panel` hosts read `dismissRange` via `ref`.
 */
export function DateRangePicker({
  variant = "popover",
  className,
  id,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ref,
  ...props
}: DateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<DateRangePickerHandle>(null);
  useImperativeHandle(
    ref,
    () => ({
      get dismissRange() {
        return panelRef.current?.dismissRange;
      },
    }),
    [],
  );
  const valueId = useId();
  const dateLabel = (date: Date, year = true) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: "numeric",
      month: "short",
      ...(year ? { year: "numeric" } : {}),
    }).format(date);
  const { from, to } = props.value ?? {};
  const label =
    from && to
      ? rangeText({ from, to }, dateLabel)
      : from
        ? t("date_range_on_or_after", { date: dateLabel(from) })
        : to
          ? t("date_range_on_or_before", { date: dateLabel(to) })
          : (props.placeholder ?? t("select_date_range"));
  const panel = (
    <RangePanel
      key={`${from?.getTime() ?? ""}:${to?.getTime() ?? ""}:${props.minDate?.getTime() ?? ""}:${props.maxDate?.getTime() ?? ""}`}
      {...props}
      ref={panelRef}
      className={variant === "panel" ? className : undefined}
      onApply={(range) => {
        props.onApply(range);
        setOpen(false);
      }}
    />
  );
  if (variant === "panel") return panel;
  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        if (!next && details.reason !== "escape-key") {
          const range = panelRef.current?.dismissRange;
          if (range) props.onApply(range);
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger
        appearance="field"
        id={id}
        aria-labelledby={labelledBy && `${labelledBy} ${valueId}`}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className={cn(
          "max-w-full justify-start font-normal",
          !from && !to && "text-placeholder-foreground",
          className,
        )}
      >
        <CalendarIcon aria-hidden="true" className="size-4 shrink-0" />
        <span id={valueId} className="truncate">
          {label}
        </span>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        align="start"
        initialFocus={() =>
          contentRef.current?.querySelector<HTMLInputElement>(
            'input[data-range-edge="from"]',
          ) ?? false
        }
        className="max-h-(--available-height) w-80 max-w-[calc(100vw-1rem)] gap-0 overflow-y-auto p-0"
      >
        {open && panel}
      </PopoverContent>
    </Popover>
  );
}

function RangePanel({
  value,
  onApply,
  minDate,
  maxDate,
  allowOpenEnded = true,
  title,
  onBack,
  autoFocus,
  className,
  ref,
}: Omit<DateRangePickerProps, "variant" | "placeholder">) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const applyRef = useRef<HTMLButtonElement>(null);
  const captionRef = useRef<HTMLButtonElement>(null);
  const initial = { from: localDate(value?.from), to: localDate(value?.to) };
  const [range, setRange] = useState<DateRangeValue>(initial);
  // A commit can trigger another field's blur commit within one event,
  // before React re-renders, so handlers read the latest draft from here.
  const latestRange = useRef<DateRangeValue>(initial);
  const saveRange = (next: DateRangeValue) => {
    latestRange.current = next;
    setRange(next);
  };
  const [text, setText] = useState<FieldText>({
    from: fieldDate(initial.from),
    to: fieldDate(initial.to),
  });
  const [errors, setErrors] = useState<FieldText>({ from: "", to: "" });
  const [activeEdge, setActiveEdge] = useState<Edge>("from");
  const [hovered, setHovered] = useState<Date>();

  useEffect(() => {
    if (autoFocus) fromRef.current?.focus();
  }, [autoFocus]);
  // Apply may only become enabled once the completed range renders.
  const focusApply = useRef(false);
  useLayoutEffect(() => {
    if (!focusApply.current) return;
    focusApply.current = false;
    applyRef.current?.focus({ preventScroll: true });
  });
  const minimum = minDate?.getTime();
  const maximum = maxDate?.getTime();
  const bounds = useMemo(
    () => ({
      min: localDate(minimum === undefined ? undefined : new Date(minimum)),
      max: localDate(maximum === undefined ? undefined : new Date(maximum)),
    }),
    [minimum, maximum],
  );
  const today = startOfDay(new Date());
  const firstMonth = startOfMonth(bounds.min ?? new Date(1900, 0, 1));
  const lastMonth = bounds.max && startOfMonth(bounds.max);
  const clampMonth = (date: Date) => {
    const month = startOfMonth(date);
    if (month < firstMonth) return firstMonth;
    if (lastMonth && month > lastMonth) return lastMonth;
    return month;
  };
  const [month, setMonth] = useState(() =>
    clampMonth(initial.from ?? initial.to ?? today),
  );
  const [view, setView] = useState<"days" | "years" | "months">("days");
  const [year, setYear] = useState(month.getFullYear());
  const firstYear = year - (YEARS_PER_PAGE / 2 - 1);
  const lastYear = firstYear + YEARS_PER_PAGE - 1;
  const gridRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const target =
      grid.querySelector<HTMLButtonElement>(
        'button[aria-pressed="true"]:enabled',
      ) ?? grid.querySelector<HTMLButtonElement>("button:enabled");
    target?.focus({ preventScroll: true });
  }, [view]);
  const showDate = (date: Date) => {
    setMonth(clampMonth(date));
    setView("days");
  };
  // Set while a day click moves focus to End, so the calendar stays put.
  const keepMonth = useRef(false);

  const dateLabel = (date: Date, includeYear = true) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: "numeric",
      month: "short",
      ...(includeYear ? { year: "numeric" } : {}),
    }).format(date);
  const validate = (input: string) => {
    if (!input.trim()) return "";
    const date = parseDate(input);
    if (!date) return t("date_format_hint_dd_mm_yyyy");
    if (bounds.min && date < bounds.min) {
      return t("date_range_before_min", { date: dateLabel(bounds.min) });
    }
    if (bounds.max && date > bounds.max) {
      return t("date_range_after_max", { date: dateLabel(bounds.max) });
    }
    return "";
  };
  const updateRange = (next: DateRangeValue) => {
    saveRange(next);
    setText({ from: fieldDate(next.from), to: fieldDate(next.to) });
    setErrors({ from: "", to: "" });
    setHovered(undefined);
  };
  const commit = (edge: Edge, input: string) => {
    const error = validate(input);
    setErrors((previous) => ({ ...previous, [edge]: error }));
    if (error) return false;
    const date = parseDate(input);
    const current = latestRange.current;
    let next = { ...current, [edge]: date };
    if (next.from && next.to && next.to < next.from) {
      next = { from: next.to, to: next.from };
    }
    saveRange(next);
    setText((previous) => ({
      ...previous,
      [edge]: fieldDate(next[edge]),
      ...(next.from !== current.from && edge === "to"
        ? { from: fieldDate(next.from) }
        : {}),
      ...(next.to !== current.to && edge === "from"
        ? { to: fieldDate(next.to) }
        : {}),
    }));
    // Blur re-commits unchanged text; moving the month then would swallow a day click.
    if (date && !sameDay(date, current[edge])) showDate(date);
    return true;
  };
  const handleDay = (day: Date) => {
    const date = startOfDay(day);
    const current = latestRange.current;
    if (activeEdge === "from") {
      updateRange({
        from: date,
        to: current.to && current.to >= date ? current.to : undefined,
      });
      setActiveEdge("to");
      keepMonth.current = true;
      toRef.current?.focus({ preventScroll: true });
      keepMonth.current = false;
    } else if (current.from && date < current.from && current.to) {
      updateRange({ from: date, to: current.to });
    } else {
      // Picking End before Start swaps them, as typing an earlier End does.
      updateRange(
        current.from && date < current.from
          ? { from: date, to: current.from }
          : { ...current, to: date },
      );
      focusApply.current = true;
    }
  };
  const parsedRange = {
    from: parseDate(text.from),
    to: parseDate(text.to),
  };
  const canApply =
    !errors.from &&
    !errors.to &&
    !validate(text.from) &&
    !validate(text.to) &&
    (allowOpenEnded
      ? !!(parsedRange.from || parsedRange.to)
      : !!(parsedRange.from && parsedRange.to));
  const pendingRange = !canApply
    ? undefined
    : parsedRange.from && parsedRange.to && parsedRange.from > parsedRange.to
      ? { from: parsedRange.to, to: parsedRange.from }
      : parsedRange;
  // Only a complete range applies on dismissal; a lone date may be mid-selection.
  const dismissRange =
    pendingRange?.from &&
    pendingRange.to &&
    !(
      sameDay(pendingRange.from, value?.from) &&
      sameDay(pendingRange.to, value?.to)
    )
      ? pendingRange
      : undefined;
  useImperativeHandle(ref, () => ({ dismissRange }));
  const summary =
    range.from && range.to
      ? rangeText(range, dateLabel)
      : range.from
        ? t("date_range_on_or_after", { date: dateLabel(range.from) })
        : range.to
          ? t("date_range_on_or_before", { date: dateLabel(range.to) })
          : t("pick_start_date");
  const preview =
    activeEdge === "to" && range.from && hovered
      ? {
          from: range.from < hovered ? range.from : hovered,
          to: range.from < hovered ? hovered : range.from,
        }
      : undefined;
  const disabled = [
    { before: bounds.min ?? new Date(1900, 0, 1) },
    ...(bounds.max ? [{ after: bounds.max }] : []),
  ];
  const closeNavigation = (date: Date) => {
    showDate(date);
    captionRef.current?.focus({ preventScroll: true });
  };
  const yearLabel = (value: number) =>
    value.toLocaleString(i18n.language, { useGrouping: false });
  const yearRangeLabel = (start: number) =>
    `${yearLabel(start)} – ${yearLabel(start + YEARS_PER_PAGE - 1)}`;
  const navigationStep = (direction: -1 | 1) => {
    const previous = direction === -1;
    if (view === "days") {
      const next = addMonths(month, direction);
      return {
        label: t(previous ? "previous_month" : "next_month"),
        disabled: next < firstMonth || !!(lastMonth && next > lastMonth),
        navigate: () => {
          setMonth(next);
          setHovered(undefined);
        },
      };
    }
    if (view === "years") {
      const nextStart = firstYear + direction * YEARS_PER_PAGE;
      return {
        label: `${t(previous ? "previous" : "next")}: ${yearRangeLabel(nextStart)}`,
        disabled: previous
          ? firstYear <= firstMonth.getFullYear()
          : !!lastMonth && lastYear >= lastMonth.getFullYear(),
        navigate: () => setYear(year + direction * YEARS_PER_PAGE),
      };
    }
    return {
      label: t(previous ? "previous_year" : "next_year"),
      disabled: previous
        ? year <= firstMonth.getFullYear()
        : !!lastMonth && year >= lastMonth.getFullYear(),
      navigate: () => setYear(year + direction),
    };
  };

  return (
    <div
      data-slot="date-range-picker"
      className={cn(
        "flex w-80 max-w-full flex-col bg-background text-foreground",
        className,
      )}
      onKeyDown={(event) => {
        if (event.key !== "Escape") event.stopPropagation();
      }}
    >
      {onBack ? (
        <FilterHeader label={title ?? t("custom_date_range")} onBack={onBack} />
      ) : title ? (
        <div className="border-b px-3 py-2 text-sm font-medium">{title}</div>
      ) : null}
      <div className="grid gap-2 px-3 pt-3 md:grid-cols-[repeat(auto-fit,minmax(min(100%,8.5rem),1fr))]">
        {(["from", "to"] as const).map((edge) => (
          <div key={edge} className="min-w-0">
            <label
              htmlFor={`${id}-${edge}`}
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t(edge === "from" ? "start_date" : "end_date")}
            </label>
            <SegmentedDateInput
              inputRef={edge === "from" ? fromRef : toRef}
              id={`${id}-${edge}`}
              edge={edge}
              label={t(edge === "from" ? "start_date" : "end_date")}
              value={text[edge]}
              minDate={bounds.min}
              maxDate={bounds.max}
              active={activeEdge === edge}
              invalid={!!errors[edge]}
              describedBy={errors[edge] ? `${id}-${edge}-error` : undefined}
              onFocus={() => {
                setActiveEdge(edge);
                const date = latestRange.current[edge];
                if (
                  date &&
                  !keepMonth.current &&
                  (view !== "days" || !isSameMonth(date, month))
                ) {
                  showDate(date);
                }
              }}
              onChange={(value) => {
                const next = maskDate(value, text[edge]);
                setText((previous) => ({ ...previous, [edge]: next }));
                setErrors((previous) => ({ ...previous, [edge]: "" }));
                if (hasFullYear(next) || !next) commit(edge, next);
              }}
              onCommit={(value) => commit(edge, value)}
              onEnter={() => {
                if (edge === "from") {
                  setActiveEdge("to");
                  toRef.current?.focus();
                } else {
                  applyRef.current?.focus();
                }
              }}
            />
            {errors[edge] && (
              <p
                id={`${id}-${edge}-error`}
                className="mt-1 text-xs text-destructive"
              >
                {errors[edge]}
              </p>
            )}
          </div>
        ))}
      </div>
      {/* Paint above the calendar's positioned grid so focus outlines aren't clipped. */}
      <div className="relative z-10 flex items-center px-3 pt-2">
        <Button
          ref={captionRef}
          type="button"
          variant="ghost"
          size="default"
          className="min-w-0 shrink"
          aria-expanded={view !== "days"}
          aria-controls={`${id}-calendar`}
          onClick={() => {
            if (view === "days") setYear(month.getFullYear());
            setView(view === "years" ? "days" : "years");
            setHovered(undefined);
          }}
        >
          {view === "days" ? (
            <span className="flex min-w-0 whitespace-pre">
              {new Intl.DateTimeFormat(i18n.language, {
                month: "short",
                year: "numeric",
              })
                .formatToParts(month)
                .map(({ type, value }, index) => (
                  <span
                    key={index}
                    className={type === "month" ? "truncate" : "shrink-0"}
                  >
                    {value}
                  </span>
                ))}
            </span>
          ) : (
            <span className="whitespace-nowrap tabular-nums">
              {view === "years" ? yearRangeLabel(firstYear) : yearLabel(year)}
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            data-icon="inline-end"
            className="size-3.5"
          />
        </Button>
        <div className="ms-auto flex shrink-0 items-center">
          {!isSameMonth(month, today) && (
            <Button
              type="button"
              variant="ghost"
              size="default"
              className="underline underline-offset-4"
              onClick={() => closeNavigation(today)}
            >
              {t("today")}
            </Button>
          )}
          {([-1, 1] as const).map((direction) => {
            const step = navigationStep(direction);
            return (
              <Button
                key={direction}
                type="button"
                variant="ghost"
                size="icon"
                aria-label={step.label}
                disabled={step.disabled}
                onClick={step.navigate}
              >
                {direction === -1 ? (
                  <ChevronLeft aria-hidden="true" />
                ) : (
                  <ChevronRight aria-hidden="true" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
      <div id={`${id}-calendar`} onMouseLeave={() => setHovered(undefined)}>
        {view === "years" ? (
          <div ref={gridRef} className="grid grid-cols-4 gap-2 px-3 pb-2">
            {Array.from({ length: YEARS_PER_PAGE }, (_, index) => {
              const option = firstYear + index;
              const shown = option === month.getFullYear();
              return (
                <Button
                  key={option}
                  type="button"
                  variant={shown ? "primary" : "ghost"}
                  aria-pressed={shown}
                  disabled={
                    option < firstMonth.getFullYear() ||
                    !!(lastMonth && option > lastMonth.getFullYear())
                  }
                  onClick={() => {
                    setYear(option);
                    setView("months");
                  }}
                >
                  {yearLabel(option)}
                </Button>
              );
            })}
          </div>
        ) : view === "months" ? (
          <div ref={gridRef} className="grid grid-cols-3 gap-2 px-3 pb-2">
            {Array.from({ length: 12 }, (_, index) => {
              const date = new Date(year, index, 1);
              const shown = isSameMonth(date, month);
              const current = isSameMonth(date, today);
              const containsEdge = [range.from, range.to].some(
                (edge) => edge && isSameMonth(edge, date),
              );
              return (
                <Button
                  key={index}
                  type="button"
                  variant={shown ? "primary" : current ? "outline" : "ghost"}
                  size="default"
                  className="relative min-w-0"
                  aria-pressed={shown}
                  disabled={
                    date < firstMonth || !!(lastMonth && date > lastMonth)
                  }
                  onClick={() => closeNavigation(date)}
                >
                  {new Intl.DateTimeFormat(i18n.language, {
                    month: "short",
                  }).format(date)}
                  {containsEdge && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 size-1 rounded-full bg-current"
                    />
                  )}
                </Button>
              );
            })}
          </div>
        ) : (
          <Calendar
            mode="range"
            month={month}
            onMonthChange={setMonth}
            selected={{ from: range.from, to: range.to }}
            // onSelect (not onDayClick) keeps DayPicker's selection controlled by this draft.
            onSelect={(_, day) => handleDay(day)}
            onDayMouseEnter={(day, modifiers) => {
              if (!modifiers.disabled) setHovered(startOfDay(day));
            }}
            disabled={disabled}
            startMonth={bounds.min}
            endMonth={bounds.max}
            numberOfMonths={1}
            fixedWeeks
            hideNavigation
            showYearSwitcher={false}
            monthCaptionClassName="hidden"
            monthGridClassName="mt-0"
            weekClassName="mt-0"
            weekdaysClassName="h-8 items-center"
            className="w-full px-3 pt-0 pb-2 [--cell-size:--spacing(10)]"
            modifiers={{
              preview: (day) =>
                !!preview && day >= preview.from && day <= preview.to,
            }}
            modifiersClassNames={{ preview: "bg-primary/10" }}
          />
        )}
      </div>
      <div className="sticky bottom-0 z-10 flex shrink-0 items-center gap-2 border-t bg-background p-3">
        <div aria-live="polite" className="min-w-0 flex-1 text-xs">
          <div>{summary}</div>
          {range.from && range.to ? (
            <div className="mt-0.5 text-muted-foreground">
              {t("count_days", {
                count: differenceInCalendarDays(range.to, range.from) + 1,
              })}
            </div>
          ) : range.from ? (
            <div className="mt-0.5 text-muted-foreground">
              {t("pick_end_date")}
            </div>
          ) : null}
        </div>
        <Button
          ref={applyRef}
          type="button"
          variant="primary"
          size="default"
          disabled={!canApply}
          onClick={() => {
            if (pendingRange) onApply(pendingRange);
          }}
        >
          {t("apply")}
        </Button>
      </div>
    </div>
  );
}
