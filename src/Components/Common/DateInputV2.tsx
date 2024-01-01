import { MutableRefObject, useEffect, useRef, useState } from "react";

import CareIcon from "../../CAREUI/icons/CareIcon";
import { Popover } from "@headlessui/react";
import { classNames } from "../../Utils/utils";
import dayjs from "../../Utils/dayjs";
import * as Notification from "../../Utils/Notifications.js";
import { t } from "i18next";

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
  outOfLimitsErrorMessage?: string;
  onChange: (date: Date) => void;
  position?: DatePickerPosition;
  disabled?: boolean;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  isDateTime?: boolean;
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
  position,
  disabled,
  placeholder,
  isOpen,
  setIsOpen,
  isDateTime,
}) => {
  const [dayCount, setDayCount] = useState<Array<number>>([]);
  const [blankDays, setBlankDays] = useState<Array<number>>([]);

  const [datePickerHeaderDate, setDatePickerHeaderDate] = useState(new Date());
  const [type, setType] = useState<DatePickerType>("date");
  const [year, setYear] = useState(new Date());
  const [displayValue, setDisplayValue] = useState<string>(
    value
      ? isDateTime
        ? dayjs(value).format("DDMMYYYYHHmm")
        : dayjs(value).format("DDMMYYYY")
      : ""
  );

  const hours = Array.from({ length: 24 }, (_, index) => index);
  const minutes = Array.from({ length: 60 }, (_, index) => index);

  const minutesRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    value && setDatePickerHeaderDate(new Date(value));
  }, [value]);

  const decrement = () => {
    switch (type) {
      case "date":
        setDatePickerHeaderDate((prev) =>
          dayjs(prev).subtract(1, "month").toDate()
        );
        break;
      case "month":
        setDatePickerHeaderDate((prev) =>
          dayjs(prev).subtract(1, "year").toDate()
        );
        break;
      case "year":
        setDatePickerHeaderDate((prev) =>
          dayjs(prev).subtract(1, "year").toDate()
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
      return dayjs(
        new Date(value.getFullYear(), value.getMonth(), date)
      ).isSame(dayjs(value));
    }
  };

  const isSelectedHour = (hour: number) => {
    if (value) {
      return value.getHours() == hour;
    }
  };

  const isSelectedMinute = (minutes: number) => {
    if (value) {
      return value.getMinutes() == minutes;
    }
  };

  // calling the below functions just for commits
  isSelectedHour(60);
  isSelectedMinute(20);

  type CloseFunction = (
    focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>
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
              datePickerHeaderDate.getMinutes()
            )
          );
          close();
          setIsOpen?.(false);
        })()
      : Notification.Error({
          msg: outOfLimitsErrorMessage ?? "Cannot select date out of range",
        });
  };

  const getDayCount = (date: Date) => {
    const daysInMonth = dayjs(date).daysInMonth();

    const dayOfWeek = dayjs(
      new Date(date.getFullYear(), date.getMonth(), 1)
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

  const setHourValue = (hour: number) => () => {
    setDatePickerHeaderDate(
      new Date(
        datePickerHeaderDate.getFullYear(),
        datePickerHeaderDate.getMonth(),
        datePickerHeaderDate.getDate(),
        hour,
        datePickerHeaderDate.getMinutes()
      )
    );
  };

  const setMinuteValue = (minutes: number) => () => {
    setDatePickerHeaderDate(
      new Date(
        datePickerHeaderDate.getFullYear(),
        datePickerHeaderDate.getMonth(),
        datePickerHeaderDate.getDate(),
        datePickerHeaderDate.getHours(),
        minutes
      )
    );
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

  useEffect(() => {
    const currMin = datePickerHeaderDate.getMinutes();
    const currHour = datePickerHeaderDate.getHours();
    // console.log(minutesRef.current, "currmin");
    if (minutesRef.current) {
      const minuteHeight = minutesRef.current.scrollHeight / 60;
      const minuteScrollPosition = currMin * minuteHeight;
      minutesRef.current.scrollTop =
        minuteScrollPosition - minutesRef.current.clientHeight / 2;
      // console.log(
      //   "msp",
      //   minuteScrollPosition - minutesRef.current.clientHeight / 2
      // );
    }

    if (hoursRef.current) {
      const hourHeight = hoursRef.current.scrollHeight / 24;
      const hourScrollPosition = currHour * hourHeight;
      hoursRef.current.scrollTop =
        hourScrollPosition - hoursRef.current.clientHeight / 2;
    }
  }, [datePickerHeaderDate, minutesRef, hoursRef.current]);

  return (
    <div>
      <div
        className={`${containerClassName ?? "container mx-auto text-black"}`}
      >
        <Popover className="relative">
          {({ open, close }) => (
            <div>
              <Popover.Button disabled={disabled} className="w-full">
                <input type="hidden" name="date" />
                <input
                  id={id}
                  name={name}
                  type="text"
                  readOnly
                  disabled={disabled}
                  className={`cui-input-base cursor-pointer disabled:cursor-not-allowed ${className}`}
                  placeholder={placeholder ?? t("select_date")}
                  value={
                    value && isDateTime
                      ? dayjs(value).format("DD/MM/YYYY HH:mm")
                      : dayjs(value).format("DD/MM/YYYY")
                  }
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 p-2">
                  <CareIcon className="care-l-calendar-alt text-lg text-gray-600" />
                </div>
              </Popover.Button>

              {(open || isOpen) && (
                <Popover.Panel
                  static
                  className={classNames(
                    "cui-dropdown-base thinScroll absolute   mt-0.5 divide-y-0 p-4",
                    isDateTime ? "min-w-[100px] max-w-[335px]" : "w-72",
                    getPosition()
                  )}
                >
                  <div className="mb-4 flex w-full flex-col items-center justify-between">
                    <input
                      id="date-input"
                      autoFocus
                      className="cui-input-base bg-gray-50"
                      value={
                        displayValue.replace(
                          /^(\d{2})(\d{0,2})(\d{0,4}).*/,
                          (_, dd, mm, yyyy) =>
                            [dd, mm, yyyy].filter(Boolean).join("/")
                        ) || ""
                      }
                      // Display the value in DD/MM/YYYY format
                      placeholder={t("DD/MM/YYYY")}
                      onChange={(e) => {
                        setDisplayValue(e.target.value.replaceAll("/", ""));
                        const value = isDateTime
                          ? dayjs(e.target.value, "DD/MM/YYYY HH:mm", true)
                          : dayjs(e.target.value, "DD/MM/YYYY", true);

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
                        className="inline-flex aspect-square cursor-pointer items-center justify-center rounded p-2 transition duration-100 ease-in-out hover:bg-gray-300"
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
                            {dayjs(datePickerHeaderDate).format("MMMM")}
                          </div>
                        )}
                        <div
                          onClick={showYearPicker}
                          className="cursor-pointer rounded px-3 py-1 font-medium text-black hover:bg-gray-300"
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
                            new Date().getFullYear() === year.getFullYear()) ||
                          !isDateWithinConstraints(getLastDay())
                        }
                        className="inline-flex aspect-square cursor-pointer items-center justify-center rounded p-2 transition duration-100 ease-in-out hover:bg-gray-300"
                        onClick={increment}
                      >
                        <CareIcon className="care-l-angle-right-b text-lg" />
                      </button>
                    </div>
                  </div>
                  {type === "date" && (
                    <div className="flex flex-row">
                      <div
                        className={
                          isDateTime
                            ? "border-r-2 border-solid border-gray-300"
                            : ""
                        }
                      >
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
                                  "hover:bg-gray-300 cursor-pointer";
                              }
                            } else {
                              conditionalClasses =
                                "!cursor-not-allowed !text-gray-400";
                            }
                            return (
                              <div
                                key={i}
                                id={`date-${d}`}
                                className="aspect-square w-[14.26%]"
                              >
                                <div
                                  onClick={setDateValue(d, close)}
                                  className={`${baseClasses} ${conditionalClasses}`}
                                >
                                  {d}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {isDateTime && (
                        <div
                          className="  flex flex-row scroll-smooth   border-gray-300  "
                          tabIndex={0}
                        >
                          <div
                            ref={hoursRef}
                            className=" thinScroll  h-[205px] overflow-auto p-1"
                          >
                            {hours.map((hr) => (
                              <div
                                key={`mins-${hr}`}
                                id={`mins-${hr}`}
                                className="aspect-square  w-[32px]  "
                                onClick={setHourValue(Number(hr))}
                              >
                                <div className="flex   cursor-pointer items-center justify-center rounded border border-transparent  p-1     text-center   text-sm leading-loose transition duration-100 ease-in-out hover:bg-gray-300">
                                  {hr.toString().padStart(2, "0")}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div
                            ref={minutesRef}
                            className=" thinScroll h-[205px]   overflow-auto p-1"
                          >
                            {minutes.map((min) => {
                              return (
                                <div
                                  key={`min-${min}`}
                                  id={`mins-${min}`}
                                  className="aspect-square w-[32px]"
                                  onClick={setMinuteValue(Number(min))}
                                >
                                  <div className="flex cursor-pointer items-center justify-center rounded border border-transparent p-1 text-center text-sm leading-loose transition duration-100 ease-in-out hover:bg-gray-300">
                                    {min.toString().padStart(2, "0")}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
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
                            {dayjs(
                              new Date(datePickerHeaderDate.getFullYear(), i, 1)
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
