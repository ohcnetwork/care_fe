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
// import { ArrowLeft, ArrowRight, Calendar } from 'react-feather'
import clsx from "clsx";

type DatePickerType = "date" | "month" | "year";

interface Props {
  value: Date | undefined;
  onChange: (date: Date) => void;
  position?: "LEFT" | "RIGHT" | "CENTER";
  disabled?: boolean;
  placeholder: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DateInputV2: React.FC<Props> = ({
  value,
  onChange,
  position,
  disabled,
  placeholder,
}) => {
  const [dayCount, setDayCount] = useState<Array<number>>([]);
  const [blankDays, setBlankDays] = useState<Array<number>>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerHeaderDate, setDatePickerHeaderDate] = useState(new Date());
  const [type, setType] = useState<DatePickerType>("date");

  const decrement = () => {
    switch (type) {
      case "date":
        setDatePickerHeaderDate((prev) => subMonths(prev, 1));
        break;
      case "month":
        setDatePickerHeaderDate((prev) => subYears(prev, 1));
        break;
      case "year":
        setDatePickerHeaderDate((prev) => subMonths(prev, 1));
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
        setDatePickerHeaderDate((prev) => subMonths(prev, 1));
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

    setShowDatePicker(false);
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

  const isSelectedMonth = (month: number) =>
    month === datePickerHeaderDate.getMonth();

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

  const toggleDatePicker = () => setShowDatePicker((prev) => !prev);

  const showMonthPicker = () => setType("month");

  const showYearPicker = () => setType("date");

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
        <div className="relative">
          <input type="hidden" name="date" />
          <input
            type="text"
            readOnly
            className="form-input bg-gray-200 border-gray-200"
            placeholder={placeholder ? placeholder : "Select date"}
            value={value && format(value, "yyyy-MM-dd")}
            onClick={toggleDatePicker}
          />
          <div
            className="cursor-pointer absolute top-1/2 right-0 p-2 -translate-y-1/2"
            onClick={toggleDatePicker}
          >
            <i className="fa-regular fa-calendar text-slate-500"></i>
          </div>
          {showDatePicker && (
            <div
              className={clsx(
                "z-10 w-72 bg-white border border-slate-300 rounded-lg shadow p-4 absolute top-[105%]",
                getPosition()
              )}
            >
              <div className="flex justify-between items-center w-full mb-4">
                <button
                  type="button"
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
                      {format(datePickerHeaderDate, "yyyy")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
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
                          className={clsx(
                            "cursor-pointer flex items-center justify-center text-center h-full text-sm rounded leading-loose transition ease-in-out duration-100 text-slate-900 hover:bg-slate-200",
                            value &&
                              isSelectedDate(d) &&
                              "bg-primary-500 text-slate-100 font-bold"
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
                        className={clsx(
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DateInputV2.defaultProps = {
  position: "CENTER",
};

export default DateInputV2;
