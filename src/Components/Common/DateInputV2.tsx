import { MutableRefObject, useEffect, useRef, useState } from "react";
import {
  addMonths,
  addYears,
  format,
  getDay,
  getDaysInMonth,
  isEqual,
  subMonths,
  subYears,
} from "date-fns";

import CareIcon from "../../CAREUI/icons/CareIcon";
import { Popover } from "@headlessui/react";
import { classNames } from "../../Utils/utils";
import dayjs from "../../Utils/dayjs";

type DatePickerType = "date" | "month" | "year";
export type DatePickerPosition = "LEFT" | "RIGHT" | "CENTER";

interface Props {
  id?: string;
  name?: string;
  className?: string;
  containerClassName?: string;
  value: Date | undefined;
  min?: Date;
  max?: Date;
  onChange: (date: Date) => void;
  position?: DatePickerPosition;
  disabled?: boolean;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
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
  onChange,
  position,
  disabled,
  placeholder,
  isOpen,
  setIsOpen,
}) => {
  const [dayCount, setDayCount] = useState<Array<number>>([]);
  const [blankDays, setBlankDays] = useState<Array<number>>([]);

  const [datePickerHeaderDate, setDatePickerHeaderDate] = useState(new Date());
  const [type, setType] = useState<DatePickerType>("date");
  const [year, setYear] = useState(new Date());
  const [displayValue, setDisplayValue] = useState<string>(
    value ? dayjs(value).format("DDMMYYYY") : ""
  );
  const popover = useRef<HTMLDivElement>(null);

  const decrement = () => {
    switch (type) {
      case "date":
        setDatePickerHeaderDate((prev) => subMonths(prev, 1));
        break;
      case "month":
        setDatePickerHeaderDate((prev) => subYears(prev, 1));
        break;
      case "year":
        setDatePickerHeaderDate((prev) => subYears(prev, 1));
        setYear((prev) => subYears(prev, 10));
        break;
    }
  };

  const increment = () => {
    switch (type) {
      case "date":
        setDatePickerHeaderDate((prev) => addMonths(prev, 1));
        break;
      case "month":
        setDatePickerHeaderDate((prev) => addYears(prev, 1));
        break;
      case "year":
        setDatePickerHeaderDate((prev) => addYears(prev, 1));
        setYear((prev) => addYears(prev, 10));
        break;
    }
  };

  const isSelectedDate = (date: number) => {
    if (value)
      return isEqual(
        new Date(value.getFullYear(), value.getMonth(), date),
        value
      );
  };

  type CloseFunction = (
    focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>
  ) => void;

  const setDateValue = (date: number, close: CloseFunction) => () => {
    isDateWithinConstraints(date) &&
      onChange(
        new Date(
          datePickerHeaderDate.getFullYear(),
          datePickerHeaderDate.getMonth(),
          date
        )
      );
    close();
  };

  const getDayCount = (date: Date) => {
    const daysInMonth = getDaysInMonth(date);

    const dayOfWeek = getDay(new Date(date.getFullYear(), date.getMonth(), 1));
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
    month = datePickerHeaderDate.getMonth()
  ) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const isDateWithinConstraints = (
    day = datePickerHeaderDate.getDate(),
    month = datePickerHeaderDate.getMonth(),
    year = datePickerHeaderDate.getFullYear()
  ) => {
    const date = new Date(year, month, day);
    if (min) if (date < min) return false;
    if (max) if (date > max) return false;
    return true;
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
        datePickerHeaderDate.getDate()
      )
    );
    setType("date");
  };

  const setYearValue = (year: number) => () => {
    setDatePickerHeaderDate(
      new Date(
        year,
        datePickerHeaderDate.getMonth(),
        datePickerHeaderDate.getDate()
      )
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
  }, [value]);

  const getPosition = () => {
    switch (position) {
      case "LEFT":
        return "left-0";
      case "RIGHT":
        return "right-0 transform translate-x-1/2";
      case "CENTER":
        return "transform -translate-x-1/2";
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
              <Popover.Button
                disabled={disabled}
                className="w-full"
                onClick={() => {
                  setIsOpen?.(!isOpen);
                }}
              >
                <input type="hidden" name="date" />
                <input
                  id={id}
                  name={name}
                  type="text"
                  readOnly
                  disabled={disabled}
                  className={`cui-input-base cursor-pointer disabled:cursor-not-allowed ${className}`}
                  placeholder={placeholder ?? "Select date"}
                  value={value && dayjs(value).format("DD/MM/YYYY")}
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 p-2">
                  <CareIcon className="care-l-calendar-alt text-lg text-gray-600" />
                </div>
              </Popover.Button>

              {(open || isOpen) && (
                <Popover.Panel
                  onBlur={() => {
                    setIsOpen?.(false);
                  }}
                  ref={popover}
                  static
                  className={classNames(
                    "cui-dropdown-base absolute mt-0.5 w-72 divide-y-0 p-4",
                    getPosition()
                  )}
                >
                  <div className="mb-4 flex w-full flex-col items-center justify-between">
                    <input
                      autoFocus
                      onBlur={(e) => {
                        popover.current?.focus();
                        e.preventDefault();
                      }}
                      className="cui-input-base bg-gray-50"
                      value={
                        displayValue.replace(
                          /^(\d{2})(\d{0,2})(\d{0,4}).*/,
                          (_, dd, mm, yyyy) =>
                            [dd, mm, yyyy].filter(Boolean).join("/")
                        ) || ""
                      } // Display the value in DD/MM/YYYY format
                      placeholder="DD/MM/YYYY"
                      onChange={(e) => {
                        setDisplayValue(e.target.value.replaceAll("/", ""));
                        const value = dayjs(e.target.value, "DD/MM/YYYY", true);
                        if (value.isValid()) {
                          onChange(value.toDate());
                          close();
                          setIsOpen?.(false);
                        }
                      }}
                    />
                    <div className="mt-4 flex">
                      <button
                        type="button"
                        disabled={
                          !isDateWithinConstraints(
                            getLastDay(),
                            datePickerHeaderDate.getMonth() - 1
                          )
                        }
                        className="aspect-square inline-flex cursor-pointer items-center justify-center rounded p-2 transition duration-100 ease-in-out hover:bg-gray-300"
                        onClick={decrement}
                      >
                        <CareIcon className="care-l-angle-left-b text-lg" />
                      </button>

                      <div className="flex items-center justify-center text-sm">
                        {type === "date" && (
                          <div
                            onClick={showMonthPicker}
                            className="cursor-pointer rounded px-3 py-1 text-center font-medium text-black hover:bg-gray-300"
                          >
                            {format(datePickerHeaderDate, "MMMM")}
                          </div>
                        )}
                        <div
                          onClick={showYearPicker}
                          className="cursor-pointer rounded px-3 py-1 font-medium text-black hover:bg-gray-300"
                        >
                          <p className="text-center">
                            {type == "year"
                              ? year.getFullYear()
                              : format(datePickerHeaderDate, "yyyy")}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={
                          (type === "year" &&
                            new Date().getFullYear() === year.getFullYear()) ||
                          !isDateWithinConstraints(getLastDay())
                        }
                        className="aspect-square inline-flex cursor-pointer items-center justify-center rounded p-2 transition duration-100 ease-in-out hover:bg-gray-300"
                        onClick={increment}
                      >
                        <CareIcon className="care-l-angle-right-b text-lg" />
                      </button>
                    </div>
                  </div>
                  {type === "date" && (
                    <>
                      <div className="mb-3 flex flex-wrap">
                        {DAYS.map((day, i) => (
                          <div
                            key={day}
                            id={`day-${i}`}
                            className="aspect-square w-[14.26%]"
                          >
                            <div className="text-center text-sm font-medium text-gray-800">
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
                        {dayCount.map((d, i) => (
                          <div
                            key={i}
                            id={`date-${d}`}
                            className="aspect-square w-[14.26%]"
                          >
                            <div
                              onClick={setDateValue(d, close)}
                              className={classNames(
                                "flex h-full cursor-pointer items-center justify-center rounded text-center text-sm leading-loose text-black transition duration-100 ease-in-out",
                                value && isSelectedDate(d)
                                  ? "bg-primary-500 font-bold text-white"
                                  : "hover:bg-gray-300",
                                !isDateWithinConstraints(d) && "!text-gray-300"
                              )}
                            >
                              {d}
                            </div>
                          </div>
                        ))}
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
                                : "text-gray-700 hover:bg-gray-300"
                            )}
                            onClick={setMonthValue(i)}
                          >
                            {format(
                              new Date(
                                datePickerHeaderDate.getFullYear(),
                                i,
                                1
                              ),
                              "MMM"
                            )}
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
                                  : "text-gray-700 hover:bg-gray-300"
                              )}
                              onClick={setYearValue(y)}
                            >
                              {y}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </Popover.Panel>
              )}
            </div>
          )}
        </Popover>
      </div>
    </div>
  );
};

DateInputV2.defaultProps = {
  position: "CENTER",
};

export default DateInputV2;
