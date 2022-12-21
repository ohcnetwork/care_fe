import { useState, useEffect } from "react";
import {
  format,
  subMonths,
  addMonths,
  subYears,
  addYears,
  isEqual,
  getDaysInMonth,
  getDay,
} from "date-fns";
import { DropdownTransition } from "./components/HelperComponents";
import { Popover } from "@headlessui/react";
import { classNames } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";

type DatePickerType = "date" | "month" | "year";
export type DatePickerPosition = "LEFT" | "RIGHT" | "CENTER";

interface Props {
  className?: string;
  value: Date | undefined;
  min?: Date;
  max?: Date;
  onChange: (date: Date) => void;
  position?: DatePickerPosition;
  disabled?: boolean;
  placeholder?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DateInputV2: React.FC<Props> = ({
  className,
  value,
  min,
  max,
  onChange,
  position,
  disabled,
  placeholder,
}) => {
  const [dayCount, setDayCount] = useState<Array<number>>([]);
  const [blankDays, setBlankDays] = useState<Array<number>>([]);

  const [datePickerHeaderDate, setDatePickerHeaderDate] = useState(new Date());
  const [type, setType] = useState<DatePickerType>("date");
  const [year, setYear] = useState(new Date());

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

  const setDateValue = (date: number) => () => {
    isDateWithinConstraints(date) &&
      onChange(
        new Date(
          datePickerHeaderDate.getFullYear(),
          datePickerHeaderDate.getMonth(),
          date
        )
      );
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
      <div className="container mx-auto text-black">
        <Popover className="relative">
          <Popover.Button disabled={disabled} className="w-full">
            <input type="hidden" name="date" />
            <input
              type="text"
              readOnly
              disabled={disabled}
              className={`cui-input-base cursor-pointer disabled:cursor-not-allowed ${className}`}
              placeholder={placeholder || "Select date"}
              value={value && format(value, "yyyy-MM-dd")}
            />
            <div className="absolute top-1/2 right-0 p-2 -translate-y-1/2">
              <CareIcon className="care-l-calendar-alt text-lg text-gray-600" />
            </div>
          </Popover.Button>
          <DropdownTransition>
            <Popover.Panel
              className={classNames(
                "cui-dropdown-base divide-y-0 w-72 p-4 absolute mt-0.5",
                getPosition()
              )}
            >
              <div className="flex justify-between items-center w-full mb-4">
                <button
                  type="button"
                  disabled={!isDateWithinConstraints()}
                  className="transition ease-in-out duration-100 p-2 rounded inline-flex items-center justify-center aspect-square cursor-pointer hover:bg-gray-300"
                  onClick={decrement}
                >
                  <CareIcon className="care-l-angle-left-b text-lg" />
                </button>

                <div className="flex items-center justify-center text-sm">
                  {type === "date" && (
                    <div
                      onClick={showMonthPicker}
                      className="py-1 px-3 font-medium text-black text-center cursor-pointer hover:bg-gray-300 rounded"
                    >
                      {format(datePickerHeaderDate, "MMMM")}
                    </div>
                  )}
                  <div
                    onClick={showYearPicker}
                    className="py-1 px-3 font-medium text-black cursor-pointer hover:bg-gray-300 rounded"
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
                  className="transition ease-in-out duration-100 p-2 rounded inline-flex items-center justify-center aspect-square cursor-pointer hover:bg-gray-300"
                  onClick={increment}
                >
                  <CareIcon className="care-l-angle-right-b text-lg" />
                </button>
              </div>
              {type === "date" && (
                <>
                  <div className="flex flex-wrap mb-3">
                    {DAYS.map((day) => (
                      <div key={day} className="aspect-square w-[14.26%]">
                        <div className="text-gray-800 font-medium text-center text-sm">
                          {day}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap">
                    {blankDays.map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square w-[14.26%] text-center border p-1 border-transparent text-sm"
                      />
                    ))}
                    {dayCount.map((d, i) => (
                      <div key={i} className="aspect-square w-[14.26%]">
                        <div
                          onClick={setDateValue(d)}
                          className={classNames(
                            "cursor-pointer flex items-center justify-center text-center h-full text-sm rounded leading-loose transition ease-in-out duration-100 text-black",
                            value && isSelectedDate(d)
                              ? "bg-primary-500 text-white font-bold"
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
                        className={classNames(
                          "cursor-pointer w-1/4 font-semibold py-4 px-2 text-center text-sm rounded-lg",
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
                            datePickerHeaderDate.getDate()
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
                          className={classNames(
                            "cursor-pointer w-1/4 font-semibold py-4 px-2 text-center text-sm rounded-lg",
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
          </DropdownTransition>
        </Popover>
      </div>
    </div>
  );
};

DateInputV2.defaultProps = {
  position: "CENTER",
};

export default DateInputV2;
