import { format, isSameDay, isValid } from "date-fns";
import { Check, ChevronRight } from "lucide-react";
import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DateRangePicker,
  type DateRangePickerHandle,
} from "@/components/ui/date-range-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FilterHeader from "./filterHeader";
import NavigationHelper from "./utils/navigation-helper";
import useMultiFilterNavigationShortcuts from "./utils/useMultiFilterNavigationShortcuts";
import {
  DateFilterMeta,
  DateRangeOption,
  FilterConfig,
  FilterDateRange,
  FilterValues,
  isSameDateRange,
  longDateRangeOptions,
} from "./utils/Utils";

function DateRangeOptions({
  options,
  handleBack,
  setView,
  isCustomDateRangeSelected,
  filter,
  handleDateRangeSelect,
  isSameRange,
}: {
  options: DateRangeOption[];
  handleBack?: () => void;
  setView: (view: "options" | "custom") => void;
  isCustomDateRangeSelected: boolean;
  filter: FilterConfig;
  handleDateRangeSelect: (option: DateRangeOption) => void;
  isSameRange: (option: DateRangeOption) => boolean;
}) {
  const { t } = useTranslation();
  const [focusItemRef, setFocusItemRef] = useState<HTMLDivElement | null>(null);
  const { focusItemIndex, setFocusItemIndex } =
    useMultiFilterNavigationShortcuts(options.length + 1, handleBack);

  useEffect(() => {
    if (focusItemRef) {
      focusItemRef.focus();
    }
  }, [focusItemRef]);

  return (
    <>
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <div className="flex flex-col gap-1 p-2">
        {options.map((option, index) => (
          <DropdownMenuItem
            key={index}
            ref={index === focusItemIndex ? setFocusItemRef : null}
            onFocus={() => setFocusItemIndex(index)}
            onSelect={(e) => {
              e.preventDefault();
              handleDateRangeSelect(option);
            }}
            aria-current={isSameRange(option) || undefined}
            className="w-full justify-start px-3 font-medium text-sm text-gray-950"
          >
            {option.count
              ? t(option.label, { count: option.count })
              : t(option.label)}
            {isSameRange(option) && (
              <Check aria-hidden="true" className="ms-auto" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          ref={options.length === focusItemIndex ? setFocusItemRef : null}
          aria-current={isCustomDateRangeSelected || undefined}
          className="w-full justify-start px-3 font-medium text-sm text-gray-950"
          onSelect={(e) => {
            e.preventDefault();
            setView("custom");
          }}
          onFocus={() => setFocusItemIndex(options.length)}
        >
          {t("custom_date_range")}
          {isCustomDateRangeSelected && (
            <Check aria-hidden="true" className="ms-auto" />
          )}
          <ChevronRight
            aria-hidden="true"
            className={cn(!isCustomDateRangeSelected && "ms-auto")}
          />
        </DropdownMenuItem>
      </div>
      <NavigationHelper isActiveFilter={true} />
    </>
  );
}

export interface DateFilterHandle {
  /** Applies a complete custom range left without pressing Apply. */
  applyDraft: () => void;
}

/** Menus hosting the date filter call this so closing, except by Escape, applies the draft. */
export const applyDateDraftOnClose = (
  draftRef: { current: DateFilterHandle | null },
  open: boolean,
  details: { reason: string },
) => {
  if (!open && details.reason !== "escape-key") draftRef.current?.applyDraft();
};

export default function RenderDateFilter({
  filter,
  selected,
  onFilterChange,
  handleBack,
  defaultView,
  ref,
}: {
  filter: FilterConfig;
  selected: FilterDateRange;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
  defaultView?: "options" | "custom";
  ref?: Ref<DateFilterHandle>;
}) {
  const { t } = useTranslation();
  const [view, setView] = useState<"options" | "custom">(
    defaultView || "options",
  );
  const pickerRef = useRef<DateRangePickerHandle>(null);
  useImperativeHandle(ref, () => ({
    applyDraft: () => {
      const range = pickerRef.current?.dismissRange;
      if (range) onFilterChange(filter.key, range);
    },
  }));
  const meta = filter.meta as DateFilterMeta;
  const options = meta?.presetOptions || longDateRangeOptions;

  const handleDateRangeSelect = (option: DateRangeOption) => {
    const { from, to } = option.getDateRange();
    onFilterChange(filter.key, { from, to });
  };

  const isSameRange = (option: DateRangeOption) =>
    isSameDateRange(selected, option.getDateRange());

  const isCustomDateRangeSelected =
    selected.from || selected.to
      ? !options.some((option) => isSameRange(option))
      : false;

  return (
    <div className="pt-0">
      {view == "custom" ? (
        <DateRangePicker
          ref={pickerRef}
          variant="panel"
          title={t("custom_date_range")}
          onBack={() => setView("options")}
          autoFocus
          value={selected}
          minDate={meta?.minDate}
          maxDate={meta?.maxDate}
          onApply={(range) => {
            onFilterChange(filter.key, range);
            setView("options");
          }}
        />
      ) : (
        <DateRangeOptions
          options={options}
          handleBack={handleBack}
          setView={setView}
          isCustomDateRangeSelected={isCustomDateRangeSelected}
          filter={filter}
          handleDateRangeSelect={handleDateRangeSelect}
          isSameRange={isSameRange}
        />
      )}
    </div>
  );
}

export const getDateOperations = (selected: FilterDateRange) => {
  if (selected.from && selected.to) {
    if (isSameDay(selected.from, selected.to)) {
      return [{ label: "is_on" }];
    } else {
      return [{ label: "b/w" }];
    }
  } else if (selected.from) {
    return [{ label: "after" }];
  } else if (selected.to) {
    return [{ label: "before" }];
  }
  return [];
};
export const SelectedDateBadge = ({
  selected,
  filter,
  onFilterChange,
  interactive = true,
}: {
  selected: FilterDateRange;
  filter: FilterConfig;
  onFilterChange?: (filterKey: string, values: FilterValues) => void;
  interactive?: boolean;
}) => {
  const { t } = useTranslation();
  const draftRef = useRef<DateFilterHandle>(null);
  const hasValidFrom = !!selected.from && isValid(selected.from);
  const hasValidTo = !!selected.to && isValid(selected.to);
  if (!hasValidFrom && !hasValidTo) return <></>;
  const isSameDate =
    selected.from && selected.to && isSameDay(selected.from, selected.to);
  const presentDate = isSameDate ? selected.from : selected.from || selected.to;

  const isSameRange = (option: DateRangeOption) =>
    isSameDateRange(selected, option.getDateRange());

  const isRangeSelected = (filter.meta as DateFilterMeta)?.presetOptions?.find(
    (option) => isSameRange(option),
  );

  const selectedDateLabel = isRangeSelected
    ? t(isRangeSelected.label, { count: isRangeSelected?.count })
    : selected.from && selected.to && !isSameDate
      ? (() => {
          const needsYear =
            selected.from.getFullYear() !== selected.to.getFullYear();
          return [selected.from, selected.to]
            .map((date) => format(date, needsYear ? "d MMM yy" : "d MMM"))
            .join(" - ");
        })()
      : presentDate
        ? format(presentDate, "d MMM yyyy")
        : "";

  if (!interactive || !onFilterChange) {
    return (
      <span className="block min-w-0 truncate whitespace-nowrap">
        {selectedDateLabel}
      </span>
    );
  }

  return (
    <DropdownMenu
      onOpenChange={(open, details) =>
        applyDateDraftOnClose(draftRef, open, details)
      }
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-w-0 flex-1 justify-start rounded-none border-0 p-0 font-normal shadow-none hover:bg-transparent focus-visible:outline-offset-0"
        >
          <span className="block min-w-0 truncate whitespace-nowrap">
            {selectedDateLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={15} className="w-80 p-0">
        <RenderDateFilter
          ref={draftRef}
          filter={filter}
          selected={selected}
          onFilterChange={onFilterChange}
          defaultView="custom"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
