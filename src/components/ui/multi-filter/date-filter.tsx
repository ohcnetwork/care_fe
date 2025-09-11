import {
  format,
  formatDate,
  isBefore,
  isSameDay,
  isValid,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import FilterHeader from "./filter-header";
import NavigationHelper from "./utils/navigation-helper";
import useMultiFilterNavigationShortcuts from "./utils/useMultiFilterNavigationShortcuts";
import {
  DateRangeOption,
  FilterConfig,
  FilterDateRange,
  FilterValues,
} from "./utils/utils";

export function RenderDateFilter({
  filter,
  selected,
  onFilterChange,
  handleBack,
}: {
  filter: FilterConfig;
  selected: FilterDateRange;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
}) {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(selected.from);
  const [dateTo, setDateTo] = useState<Date | undefined>(selected.to);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  const dateRangeOptions: DateRangeOption[] = [
    {
      label: t("last_count_days", { count: 7 }),
      getDateRange: () => ({
        from: subDays(new Date(), 7),
        to: new Date(),
      }),
    },
    {
      label: t("last_count_weeks", { count: 3 }),
      getDateRange: () => ({
        from: subWeeks(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: t("last_month"),
      getDateRange: () => ({
        from: subMonths(new Date(), 1),
        to: new Date(),
      }),
    },
    {
      label: t("last_count_months", { count: 3 }),
      getDateRange: () => ({
        from: subMonths(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: t("last_count_months", { count: 6 }),
      getDateRange: () => ({
        from: subMonths(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: t("last_year"),
      getDateRange: () => ({
        from: subYears(new Date(), 1),
        to: new Date(),
      }),
    },
  ];

  const handleDateRangeSelect = (option: DateRangeOption) => {
    const { from, to } = option.getDateRange();
    setDateFrom(from);
    setDateTo(to);
    onFilterChange(filter.key, { from, to });
  };

  const handleDateChange = (date: { from?: Date; to?: Date }) => {
    setDateFrom(date?.from);
    setDateTo(date?.to);
  };

  const isSameRange = (option: DateRangeOption) => {
    const { from, to } = option.getDateRange();
    return (
      dateFrom && isSameDay(dateFrom, from) && dateTo && isSameDay(dateTo, to)
    );
  };

  const isCustomDateRangeSelected =
    selected.from &&
    selected.to &&
    !dateRangeOptions.some((option) => isSameRange(option));

  const [focusItemRef, setFocusItemRef] = useState<HTMLButtonElement | null>(
    null,
  );
  const { focusItemIndex, setFocusItemIndex } =
    useMultiFilterNavigationShortcuts(dateRangeOptions.length + 1, handleBack);

  useEffect(() => {
    if (focusItemRef) {
      focusItemRef.focus();
    }
  }, [focusItemRef]);

  useEffect(() => {
    setDateFrom(selected.from);
    setDateTo(selected.to);
  }, [selected]);

  return (
    <div className="pt-0">
      {handleBack && !isCustomDateRange && (
        <FilterHeader label={filter.label} onBack={handleBack} />
      )}
      {isCustomDateRange && (
        <FilterHeader
          label={t("custom_date_range")}
          onBack={() => setIsCustomDateRange(false)}
        />
      )}
      <div className="px-2 pt-2 max-h-[calc(100vh-30rem)] overflow-y-auto">
        {isCustomDateRange ? (
          <div className="flex flex-col gap-2 p-0 pb-2">
            <Calendar
              mode="range"
              selected={{ from: dateFrom, to: dateTo }}
              onSelect={(date) => {
                if (date) {
                  handleDateChange(date);
                }
              }}
              className="w-full"
              styles={{
                day: {
                  width: "2.5rem",
                },
                weekdays: {
                  width: "100%",
                  justifyContent: "space-between",
                },
                nav: {
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: "0.5rem",
                },
              }}
            />
            <div className="my-2">
              <Separator
                orientation="horizontal"
                className="bg-gray-200 h-px"
              />
            </div>
            <div className="flex flex-col gap-2 p-0 pb-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block capitalize">
                  {t("from")}
                </label>
                <Input
                  type="date"
                  value={dateFrom ? format(dateFrom, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setDateFrom(new Date(e.target.value));
                    } else {
                      setDateFrom(undefined);
                    }
                  }}
                  placeholder={t("start_date")}
                  className="flex flex-col justify-between"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block capitalize">
                  {t("to")}
                </label>
                <Input
                  type="date"
                  value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setDateTo(new Date(e.target.value));
                    } else {
                      setDateTo(undefined);
                    }
                  }}
                  placeholder={t("end_date")}
                  className="flex flex-col justify-between"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              {dateRangeOptions.map((option, index) => (
                <Button
                  key={index}
                  ref={index === focusItemIndex ? setFocusItemRef : null}
                  onFocus={() => setFocusItemIndex(index)}
                  onClick={() => handleDateRangeSelect(option)}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-3 font-medium text-sm text-gray-950",
                    isSameRange(option) &&
                      "bg-gray-100 border-green-500 border",
                  )}
                >
                  {option.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                ref={
                  dateRangeOptions.length === focusItemIndex
                    ? setFocusItemRef
                    : null
                }
                className={cn(
                  "w-full justify-between px-3 font-medium text-sm text-gray-950",
                  isCustomDateRangeSelected &&
                    "bg-gray-100 border-green-500 border",
                )}
                onClick={() => setIsCustomDateRange(true)}
                onFocus={() => setFocusItemIndex(dateRangeOptions.length)}
              >
                {t("custom_date_range")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <NavigationHelper isActiveFilter={true} />
          </>
        )}
      </div>
      {isCustomDateRange && (
        <div className="px-2 pb-2">
          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={() => {
              if (dateFrom && dateTo) {
                onFilterChange(filter.key, { from: dateFrom, to: dateTo });
                setIsCustomDateRange(false);
              } else if (dateFrom) {
                onFilterChange(filter.key, { from: dateFrom, to: dateFrom });
                setIsCustomDateRange(false);
              } else if (dateTo) {
                onFilterChange(filter.key, { from: dateTo, to: dateTo });
                setIsCustomDateRange(false);
              }
            }}
          >
            {t("confirm")}
          </Button>
        </div>
      )}
    </div>
  );
}

export const getDateOperations = (selected: FilterDateRange) => {
  if (
    isBefore(selected.from, new Date()) &&
    isSameDay(selected.from, selected.to)
  )
    return ["since", "on_or_before"];
  else if (isSameDay(selected.from, selected.to)) return ["is_on"];
  else return ["b/w"];
};

export const SelectedDateBadge = ({
  selected,
}: {
  selected: FilterDateRange;
}) => {
  if (!isValid(selected.from) || !isValid(selected.to)) return <></>;
  const isSameDates =
    selected.from && selected.to && isSameDay(selected.from, selected.to);
  return (
    <div className="text-xs">
      {selected.from &&
      selected.to &&
      (selected.from === selected.to || isSameDates) ? (
        <span>{formatDate(selected.from, "d MMM yyyy")}</span>
      ) : (
        <span>
          {[selected.from, selected.to].map((date, index) => (
            <span key={date.toISOString() + index}>
              {index > 0 && "-"}
              <span>{formatDate(date, "d MMM yy")}</span>
            </span>
          ))}
        </span>
      )}
    </div>
  );
};
