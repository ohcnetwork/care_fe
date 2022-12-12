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

    console.log();

    return !(min! > date) && !(date > max!);
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
    <div className={disabled ? "pointer-events-none opacity-0.8" : ""}>
      <div className="container mx-auto text-black">
        <Popover className="relative">
          <Popover.Button className="w-full">
            <input type="hidden" name="date" />
            <input
              type="text"
              readOnly
              className={`text-sm block py-3 px-4 w-full rounded placeholder:text-gray-500 focus:bg-white border-2 focus:border-primary-400 outline-none !ring-0 transition-all duration-200 ease-in-out ${className}`}
              placeholder={placeholder ? placeholder : "Select date"}
              value={value && format(value, "yyyy-MM-dd")}
            />
            <div className="cursor-pointer absolute top-1/2 right-0 p-2 -translate-y-1/2">
              <i className="fa-regular fa-calendar text-slate-500"></i>
            </div>
          </Popover.Button>
          <DropdownTransition>
            <Popover.Panel
              className={classNames(
                "z-10 w-72 bg-white border border-slate-300 rounded-lg shadow p-4 absolute top-[110%]",
                getPosition()
              )}
            >
              <div className="flex justify-between items-center w-full mb-4">
                <button
                  type="button"
                  disabled={!isDateWithinConstraints()}
                  className="transition ease-in-out duration-100 p-2 rounded inline-flex items-center justify-center aspect-square cursor-pointer  hover:bg-slate-200"
                  onClick={decrement}
                >
                  <i className="fa fa-arrow-left" />
                </button>

                <div className="flex items-center justify-center text-sm">
                  {type === "date" && (
                    <div
                      onClick={showMonthPicker}
                      className="py-1 px-3 font-bold text-slate-900 text-center cursor-pointer hover:bg-slate-200 rounded"
                    >
                      {format(datePickerHeaderDate, "MMMM")}
                    </div>
                  )}
                  <div
                    onClick={showYearPicker}
                    className="py-1 px-3 font-bold text-gray-900 cursor-pointer hover:bg-slate-200 rounded"
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
                  className="transition ease-in-out duration-100 h-full p-2 rounded inline-flex items-center justify-center aspect-square cursor-pointer hover:bg-slate-200"
                  onClick={increment}
                >
                  <i className="fa fa-arrow-right" />
                </button>
              </div>
              {type === "date" && (
                <>
                  <div className="flex flex-wrap">
                    {DAYS.map((day) => (
                      <div key={day} className="aspect-square w-[14.26%]">
                        <div className="text-slate-600 font-medium text-center text-sm">
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
                            "cursor-pointer flex items-center justify-center text-center h-full text-sm rounded leading-loose transition ease-in-out duration-100 text-slate-900 hover:bg-slate-200",
                            value &&
                              isSelectedDate(d) &&
                              "bg-primary-500 text-slate-100 font-bold",
                            !isDateWithinConstraints(d) && "!text-slate-300"
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
                          "cursor-pointer w-1/4 font-semibold py-4 px-2 text-center text-sm rounded-lg hover:bg-slate-200",
                          value && isSelectedMonth(i)
                            ? "bg-primary-500 text-white"
                            : "text-slate-700 hover:bg-primary-600"
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
                            "cursor-pointer w-1/4 font-semibold py-4 px-2 text-center text-sm rounded-lg hover:bg-slate-200",
                            value && isSelectedYear(y)
                              ? "bg-primary-500 text-white"
                              : "text-slate-700 hover:bg-primary-600"
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
  className: "bg-gray-200 border-gray-200",
};

export default DateInputV2;
