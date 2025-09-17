import { format, isBefore, isSameDay, isValid } from "date-fns";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  DropdownMenu,
  DropdownMenuContent,
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
  longDateRangeOptions,
} from "./utils/Utils";

function CustomDateRange({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  handleDateChange,
  onFilterChange,
  filter,
  setView,
}: {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  setDateFrom: (date: Date | undefined) => void;
  setDateTo: (date: Date | undefined) => void;
  handleDateChange: (date: { from?: Date; to?: Date }) => void;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  filter: FilterConfig;
  setView: (view: "options" | "custom") => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <FilterHeader
        label={t("custom_date_range")}
        onBack={() => setView("options")}
      />
      <div className="flex flex-col gap-2 p-0 pb-2 px-3 pt-2 max-h-[calc(100vh-30rem)] overflow-y-auto">
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
              width: "40px",
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
          monthCaptionClassName="self-center"
        />
        <div className="my-2">
          <Separator orientation="horizontal" className="bg-gray-200 h-px" />
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
      <div className="px-3 pb-2">
        <Button
          variant="primary"
          className="w-full justify-center"
          onClick={() => {
            if (dateFrom && dateTo) {
              onFilterChange(filter.key, { from: dateFrom, to: dateTo });
              setView("options");
            } else if (dateFrom) {
              onFilterChange(filter.key, { from: dateFrom, to: undefined });
              setView("options");
            } else if (dateTo) {
              onFilterChange(filter.key, { from: undefined, to: dateTo });
              setView("options");
            }
          }}
          disabled={
            (!dateFrom && !dateTo) ||
            (dateFrom && dateTo && isBefore(dateTo, dateFrom))
          }
        >
          {t("confirm")}
        </Button>
      </div>
    </>
  );
}

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
  isSameRange: (option: DateRangeOption) => boolean | undefined;
}) {
  const { t } = useTranslation();
  const [focusItemRef, setFocusItemRef] = useState<HTMLButtonElement | null>(
    null,
  );
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
      <div className="flex flex-col gap-1 px-2 pb-2 pt-2 max-h-[calc(100vh-30rem)] overflow-y-auto">
        {options.map((option, index) => (
          <Button
            key={index}
            ref={index === focusItemIndex ? setFocusItemRef : null}
            onFocus={() => setFocusItemIndex(index)}
            onClick={() => handleDateRangeSelect(option)}
            variant="ghost"
            className={cn(
              "w-full justify-start px-3 font-medium text-sm text-gray-950",
              isSameRange(option) && "bg-gray-100 border-green-500 border",
            )}
          >
            {option.count
              ? t(option.label, { count: option.count })
              : t(option.label)}
          </Button>
        ))}
        <Button
          variant="ghost"
          ref={options.length === focusItemIndex ? setFocusItemRef : null}
          className={cn(
            "w-full justify-between px-3 font-medium text-sm text-gray-950",
            isCustomDateRangeSelected && "bg-gray-100 border-green-500 border",
          )}
          onClick={() => setView("custom")}
          onFocus={() => setFocusItemIndex(options.length)}
        >
          {t("custom_date_range")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <NavigationHelper isActiveFilter={true} />
    </>
  );
}

export default function RenderDateFilter({
  filter,
  selected,
  onFilterChange,
  handleBack,
  defaultView,
}: {
  filter: FilterConfig;
  selected: FilterDateRange;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
  defaultView?: "options" | "custom";
}) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(selected?.from);
  const [dateTo, setDateTo] = useState<Date | undefined>(selected?.to);
  const [view, setView] = useState<"options" | "custom">(
    defaultView || "options",
  );
  const options =
    (filter.meta as DateFilterMeta)?.presetOptions || longDateRangeOptions;

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
    selected.from || selected.to
      ? !options.some((option) => isSameRange(option))
      : false;

  useEffect(() => {
    setDateFrom(selected.from);
    setDateTo(selected.to);
  }, [selected]);

  return (
    <div className="pt-0">
      {view == "custom" ? (
        <CustomDateRange
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          handleDateChange={handleDateChange}
          onFilterChange={onFilterChange}
          filter={filter}
          setView={setView}
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
}: {
  selected: FilterDateRange;
  filter: FilterConfig;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
}) => {
  const hasValidFrom = !!selected.from && isValid(selected.from);
  const hasValidTo = !!selected.to && isValid(selected.to);
  if (!hasValidFrom && !hasValidTo) return <></>;
  const isSameDate =
    selected.from && selected.to && isSameDay(selected.from, selected.to);
  const presentDate = isSameDate ? selected.from : selected.from || selected.to;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="text-xs">
        {selected.from && selected.to && !isSameDate ? (
          <span>
            {[selected.from, selected.to].map((date, index) => (
              <span key={date.toISOString() + index}>
                {index > 0 && "-"}
                <span>{format(date, "d MMM yy")}</span>
              </span>
            ))}
          </span>
        ) : presentDate ? (
          <span>{format(presentDate, "d MMM yyyy")}</span>
        ) : (
          <></>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={15}
        className="w-[320px] p-0"
      >
        <RenderDateFilter
          filter={filter}
          selected={selected}
          onFilterChange={onFilterChange}
          defaultView="custom"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
