import { MutableRefObject, useEffect, useRef, useState } from "react";

import CareIcon from "../../CAREUI/icons/CareIcon";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { classNames } from "../../Utils/utils";
import dayjs from "../../Utils/dayjs";
import * as Notification from "../../Utils/Notifications.js";
import { t } from "i18next";

type DatePickerType = "date" | "month" | "year";
export type DatePickerPosition =
  | "LEFT"
  | "RIGHT"
  | "CENTER"
  | "TOP-LEFT"
  | "TOP-RIGHT"
  | "TOP-CENTER";

interface Props {
  id?: string;
  name?: string;
  className?: string;
  containerClassName?: string;
  value: Date | undefined;
  min?: Date;
  max?: Date;
  outOfLimitsErrorMessage?: string;
  onChange: (date: Date) => void;
  position?: DatePickerPosition;
  disabled?: boolean;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  time?: boolean;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DateInputV2: React.FC<Props> = ({
  id,
  name,
  className,
  containerClassName,
  value,
  min,
  max,
  outOfLimitsErrorMessage,
  onChange,
  position = "CENTER",
  disabled,
  placeholder,
  setIsOpen,
  time,
}) => {
  const [dayCount, setDayCount] = useState<Array<number>>([]);
  const [blankDays, setBlankDays] = useState<Array<number>>([]);

  const [datePickerHeaderDate, setDatePickerHeaderDate] = useState(new Date());
  const [type, setType] = useState<DatePickerType>("date");
  const [year, setYear] = useState(new Date());

  const [editingText, setEditingText] = useState<string | null>(null);

  const hours = dayjs(value).hour() % 12;
  const minutes = dayjs(value).minute();
  const ampm = dayjs(value).hour() > 11 ? "PM" : "AM";

  const hourScrollerRef = useRef<HTMLDivElement>(null);
  const minuteScrollerRef = useRef<HTMLDivElement>(null);
  const decrement = () => {
    switch (type) {
      case "date":
        setDatePickerHeaderDate((prev) =>
          dayjs(prev).subtract(1, "month").toDate(),
        );
        break;
      case "month":
        setDatePickerHeaderDate((prev) =>
          dayjs(prev).subtract(1, "year").toDate(),
        );
        break;
      case "year":
        setDatePickerHeaderDate((prev) =>
          dayjs(prev).subtract(1, "year").toDate(),
        );
        setYear((prev) => dayjs(prev).subtract(10, "year").toDate());
        break;
    }
  };

  const increment = () => {
    switch (type) {
      case "date":
        setDatePickerHeaderDate((prev) => dayjs(prev).add(1, "month").toDate());
        break;
      case "month":
        setDatePickerHeaderDate((prev) => dayjs(prev).add(1, "year").toDate());
        break;
      case "year":
        setDatePickerHeaderDate((prev) => dayjs(prev).add(1, "year").toDate());
        setYear((prev) => dayjs(prev).add(10, "year").toDate());
        break;
    }
  };

  const isSelectedDate = (date: number) => {
    if (value) {
      return dayjs(value).date() === date;
    }
  };

  type CloseFunction = (
    focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>,
  ) => void;

  const setDateValue = (date: number, close: CloseFunction) => () => {
    isDateWithinConstraints(date)
      ? (() => {
          onChange(
            new Date(
              datePickerHeaderDate.getFullYear(),
              datePickerHeaderDate.getMonth(),
              date,
              datePickerHeaderDate.getHours(),
              datePickerHeaderDate.getMinutes(),
              datePickerHeaderDate.getSeconds(),
            ),
          );
          if (!time) {
            close();
            setIsOpen?.(false);
          }
        })()
      : Notification.Error({
          msg: outOfLimitsErrorMessage ?? "Cannot select date out of range",
        });
  };

  const handleTimeChange = (options: {
    newHours?: typeof hours;
    newMinutes?: typeof minutes;
    newAmpm?: typeof ampm;
  }) => {
    const { newHours = hours, newMinutes = minutes, newAmpm = ampm } = options;
    onChange(
      new Date(
        datePickerHeaderDate.getFullYear(),
        datePickerHeaderDate.getMonth(),
        datePickerHeaderDate.getDate(),
        newAmpm === "PM" ? (newHours % 12) + 12 : newHours % 12,
        newMinutes,
      ),
    );
  };

  const getDayCount = (date: Date) => {
    const daysInMonth = dayjs(date).daysInMonth();

    const dayOfWeek = dayjs(
      new Date(date.getFullYear(), date.getMonth(), 1),
    ).day();
    const blankDaysArray = [];
    for (let i = 1; i <= dayOfWeek; i++) {
      blankDaysArray.push(i);
    }

    const daysArray = [];
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }

    setBlankDays(blankDaysArray);
    setDayCount(daysArray);
  };

  const getLastDay = (
    year = datePickerHeaderDate.getFullYear(),
    month = datePickerHeaderDate.getMonth(),
  ) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const isDateWithinConstraints = (
    day = datePickerHeaderDate.getDate(),
    month = datePickerHeaderDate.getMonth(),
    year = datePickerHeaderDate.getFullYear(),
  ) => {
    const date = new Date(year, month, day);
    if (min) if (date < min) return false;
    if (max) if (date > max) return false;
    return true;
  };

  const isDateWithinLimits = (parsedDate: dayjs.Dayjs): boolean => {
    if (parsedDate?.isValid()) {
      if (
        (max && parsedDate.toDate() > max) ||
        (min && parsedDate.toDate() < min)
      ) {
        Notification.Error({
          msg: outOfLimitsErrorMessage ?? "Cannot select date out of range",
        });
        return false;
      }
      return true;
    }
    return false;
  };

  const isSelectedMonth = (month: number) =>
    month === datePickerHeaderDate.getMonth();

  const isSelectedYear = (year: number) =>
    year === datePickerHeaderDate.getFullYear();

  const setMonthValue = (month: number) => () => {
    setDatePickerHeaderDate(
      new Date(
        datePickerHeaderDate.getFullYear(),
        month,
        datePickerHeaderDate.getDate(),
      ),
    );
    setType("date");
  };

  const setYearValue = (year: number) => () => {
    setDatePickerHeaderDate(
      new Date(
        year,
        datePickerHeaderDate.getMonth(),
        datePickerHeaderDate.getDate(),
      ),
    );
    setType("date");
  };

  const showMonthPicker = () => setType("month");

  const showYearPicker = () => setType("year");

  useEffect(() => {
    getDayCount(datePickerHeaderDate);
  }, [datePickerHeaderDate]);

  useEffect(() => {
    value && setDatePickerHeaderDate(new Date(value));
    const timeScrollers = [hourScrollerRef, minuteScrollerRef];
    timeScrollers.forEach((scroller) => {
      if (!scroller.current) return;
      const selected = scroller.current.querySelector("[data-selected=true]");
      if (selected) {
        const selectedPosition = (
          selected as HTMLDivElement
        ).getBoundingClientRect().top;

        const toScroll =
          selectedPosition - scroller.current.getBoundingClientRect().top;

        selected.parentElement?.scrollBy({ top: toScroll, behavior: "smooth" });
      }
    });
  }, [value]);

  const dateFormat = `DD/MM/YYYY${time ? " hh:mm a" : ""}`;

  const getDisplayValue = (date: Date) => {
    return dayjs(date).format(dateFormat);
  };

  const getPosition = () => {
    switch (position) {
      case "LEFT":
        return "left-0";
      case "RIGHT":
        return "right-0 transform translate-x-1/2";
      case "CENTER":
        return "transform -translate-x-1/2";
      case "TOP-LEFT":
        return "bottom-full left-full";
      case "TOP-RIGHT":
        return "bottom-full right-0";
      case "TOP-CENTER":
        return "bottom-full left-1/2 transform -translate-x-1/2";
      default:
        return "left-0";
    }
  };

  return (
    <div>
      <div
        className={`${containerClassName ?? "container mx-auto text-black"}`}
      >
        <Popover className="relative">
          {({ open, close }) => (
            <div>
              <PopoverButton disabled={disabled} className="w-full">
                <input type="hidden" name="date" />
                <input
                  id={id}
                  name={name}
                  type="text"
                  readOnly
                  disabled={disabled}
                  className={`cui-input-base cursor-pointer disabled:cursor-not-allowed ${className}`}
                  placeholder={placeholder ?? t("select_date")}
                  value={value && dayjs(value).format(dateFormat)}
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 p-2">
                  <CareIcon
                    icon="l-calendar-alt"
                    className="text-lg text-secondary-600"
                  />
                </div>
              </PopoverButton>
              <PopoverPanel
                static
                className={classNames(
                  `cui-dropdown-base absolute my-0.5 ${time ? "w-[400px]" : "w-72"} transition-all ${open ? "visible opacity-100" : "invisible opacity-0"} flex divide-y-0 rounded p-4`,
                  getPosition(),
                )}
              >
                <div
                  className={classNames(
                    "flex w-full items-center justify-between gap-y-4",
                    position?.includes("TOP") ? "flex-col-reverse" : "flex-col",
                  )}
                >
                  <input
                    id="date-input"
                    autoFocus
                    className="cui-input-base bg-secondary-50"
                    value={
                      editingText ||
                      (value ? getDisplayValue(value) : "Select Date")
                    }
                    placeholder={dateFormat}
                    onChange={(e) => {
                      const value = dayjs(e.target.value, dateFormat, true);
                      if (isDateWithinLimits(value)) {
                        onChange(value.toDate());
                        //close();
                        setIsOpen?.(false);
                      }
                      setEditingText(e.target.value);
                    }}
                    onBlur={() => setEditingText(null)}
                  />

                  <div className="flex flex-row items-stretch gap-4">
                    <div className="flex w-full flex-col items-center justify-between">
                      <div className="flex">
                        <button
                          type="button"
                          disabled={
                            !isDateWithinConstraints(
                              getLastDay(),
                              datePickerHeaderDate.getMonth() - 1,
                            )
                          }
                          className="inline-flex aspect-square cursor-pointer items-center justify-center rounded p-2 transition duration-100 ease-in-out hover:bg-secondary-300"
                          onClick={decrement}
                        >
                          <CareIcon icon="l-angle-left-b" className="text-lg" />
                        </button>

                        <div className="flex items-center justify-center text-sm">
                          {type === "date" && (
                            <div
                              onClick={showMonthPicker}
                              className="cursor-pointer rounded px-3 py-1 text-center font-medium text-black hover:bg-secondary-300"
                            >
                              {dayjs(datePickerHeaderDate).format("MMMM")}
                            </div>
                          )}
                          <div
                            onClick={showYearPicker}
                            className="cursor-pointer rounded px-3 py-1 font-medium text-black hover:bg-secondary-300"
                          >
                            <p className="text-center">
                              {type == "year"
                                ? year.getFullYear()
                                : dayjs(datePickerHeaderDate).format("YYYY")}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={
                            (type === "year" &&
                              new Date().getFullYear() ===
                                year.getFullYear()) ||
                            !isDateWithinConstraints(getLastDay())
                          }
                          className="inline-flex aspect-square cursor-pointer items-center justify-center rounded p-2 transition duration-100 ease-in-out hover:bg-secondary-300"
                          onClick={increment}
                        >
                          <CareIcon
                            icon="l-angle-right-b"
                            className="text-lg"
                          />
                        </button>
                      </div>

                      {type === "date" && (
                        <>
                          <div className="flex w-full flex-wrap">
                            {DAYS.map((day, i) => (
                              <div
                                key={day}
                                id={`day-${i}`}
                                className="aspect-square w-[14.26%]"
                              >
                                <div className="text-center text-sm font-medium text-secondary-800">
                                  {day}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap">
                            {blankDays.map((_, i) => (
                              <div
                                key={i}
                                className="aspect-square w-[14.26%] border border-transparent p-1 text-center text-sm"
                              />
                            ))}
                            {dayCount.map((d, i) => {
                              const withinConstraints =
                                isDateWithinConstraints(d);
                              const selected = value && isSelectedDate(d);

                              const baseClasses =
                                "flex h-full items-center justify-center rounded text-center text-sm leading-loose transition duration-100 ease-in-out";
                              let conditionalClasses = "";

                              if (withinConstraints) {
                                if (selected) {
                                  conditionalClasses =
                                    "bg-primary-500 font-bold text-white";
                                } else {
                                  conditionalClasses =
                                    "hover:bg-secondary-300 cursor-pointer";
                                }
                              } else {
                                conditionalClasses =
                                  "!cursor-not-allowed !text-secondary-400";
                              }
                              return (
                                <div
                                  key={i}
                                  id={`date-${d}`}
                                  className="aspect-square w-[14.26%]"
                                >
                                  <button
                                    onClick={setDateValue(d, close)}
                                    type="button"
                                    className={`${baseClasses} ${conditionalClasses} block w-full`}
                                  >
                                    {d}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {type === "month" && (
                        <div className="flex flex-wrap">
                          {Array(12)
                            .fill(null)
                            .map((_, i) => (
                              <div
                                key={i}
                                id={`month-${i}`}
                                className={classNames(
                                  "w-1/4 cursor-pointer rounded-lg px-2 py-4 text-center text-sm font-semibold",
                                  value && isSelectedMonth(i)
                                    ? "bg-primary-500 text-white"
                                    : "text-secondary-700 hover:bg-secondary-300",
                                )}
                                onClick={setMonthValue(i)}
                              >
                                {dayjs(
                                  new Date(
                                    datePickerHeaderDate.getFullYear(),
                                    i,
                                    1,
                                  ),
                                ).format("MMM")}
                              </div>
                            ))}
                        </div>
                      )}
                      {type === "year" && (
                        <div className="flex flex-wrap">
                          {Array(12)
                            .fill(null)
                            .map((_, i) => {
                              const y = year.getFullYear() - 11 + i;
                              return (
                                <div
                                  key={i}
                                  id={`year-${i}`}
                                  className={classNames(
                                    "w-1/4 cursor-pointer rounded-lg px-2 py-4 text-center text-sm font-semibold",
                                    value && isSelectedYear(y)
                                      ? "bg-primary-500 text-white"
                                      : "text-secondary-700 hover:bg-secondary-300",
                                  )}
                                  onClick={setYearValue(y)}
                                >
                                  {y}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                    {time && (
                      <div className="flex shrink-0 gap-1">
                        {(
                          [
                            {
                              name: "Hours",
                              value: hours,
                              options: Array.from(
                                { length: 12 },
                                (_, i) => i + 1,
                              ),
                              onChange: (val: any) => {
                                handleTimeChange({
                                  newHours: val,
                                });
                              },
                              ref: hourScrollerRef,
                            },
                            {
                              name: "Minutes",
                              value: minutes,
                              options: Array.from({ length: 60 }, (_, i) => i),
                              onChange: (val: any) => {
                                handleTimeChange({
                                  newMinutes: val,
                                });
                              },
                              ref: minuteScrollerRef,
                            },
                            {
                              name: "am/pm",
                              value: ampm,
                              options: ["AM", "PM"],
                              onChange: (val: any) => {
                                handleTimeChange({
                                  newAmpm: val,
                                });
                              },
                              ref: undefined,
                            },
                          ] as const
                        ).map((input, i) => (
                          <div
                            key={i}
                            className="scrollbar-hide flex h-[237px] shrink-0 flex-col gap-1 overflow-auto"
                            ref={input.ref}
                            onScroll={(e) => {
                              const optionsHeight =
                                e.currentTarget.scrollHeight / 3;
                              const scrollTop = e.currentTarget.scrollTop;
                              const containerHeight =
                                e.currentTarget.clientHeight;
                              if (scrollTop >= optionsHeight * 2) {
                                e.currentTarget.scrollTo({
                                  top: optionsHeight,
                                });
                              }
                              if (
                                scrollTop + containerHeight <=
                                optionsHeight
                              ) {
                                e.currentTarget.scrollTo({
                                  top: optionsHeight + scrollTop,
                                });
                              }
                            }}
                          >
                            {[
                              ...input.options,
                              ...(input.name === "am/pm" ? [] : input.options),
                              ...(input.name === "am/pm" ? [] : input.options),
                            ].map((option, j) => (
                              <button
                                type="button"
                                key={j}
                                className={`flex aspect-square w-9 shrink-0 items-center justify-center rounded-md border transition-all ${(input.name === "Hours" && option === 12 ? [0, 12].includes(input.value) : input.value === option) ? "bg-primary-500 font-bold text-white" : "border-gray-300 hover:bg-secondary-300"} text-sm`}
                                onClick={() => input.onChange(option as any)}
                                data-selected={
                                  (input.name === "Hours" && option === 12
                                    ? [0, 12].includes(input.value)
                                    : input.value === option) &&
                                  j + 1 >= input.options.length &&
                                  j + 1 <= input.options.length * 2
                                }
                              >
                                {option.toLocaleString("en-US", {
                                  minimumIntegerDigits: 2,
                                  useGrouping: false,
                                })}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverPanel>
            </div>
          )}
        </Popover>
      </div>
    </div>
  );
};

export default DateInputV2;
