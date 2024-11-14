import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { t } from "i18next";
import { MutableRefObject, useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import DateTextInput from "@/components/Common/DateTextInput";

import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import { useValueInjectionObserver } from "@/Utils/useValueInjectionObserver";
import { classNames } from "@/Utils/utils";

type DatePickerType = "date" | "month" | "year";

interface Props {
  id?: string;
  name?: string;
  className?: string;
  containerClassName?: string;
  value: Date | undefined;
  min?: Date;
  max?: Date;
  outOfLimitsErrorMessage?: string;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  allowTime?: boolean;
  popOverClassName?: string;
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
  disabled,
  placeholder,
  setIsOpen,
  allowTime,
  isOpen,
  popOverClassName,
}) => {
  const [dayCount, setDayCount] = useState<Array<number>>([]);
  const [blankDays, setBlankDays] = useState<Array<number>>([]);

  const [datePickerHeaderDate, setDatePickerHeaderDate] = useState(
    value || new Date(),
  );
  const [type, setType] = useState<DatePickerType>("date");
  const [year, setYear] = useState(new Date());

  const [popOverOpen, setPopOverOpen] = useState(false);

  const hours = dayjs(value).hour() % 12;
  const minutes = dayjs(value).minute();
  const ampm = dayjs(value).hour() > 11 ? "PM" : "AM";

  const dateInputRef = useRef<HTMLDivElement>(null);
  const hourScrollerRef = useRef<HTMLDivElement>(null);
  const minuteScrollerRef = useRef<HTMLDivElement>(null);

  const popoverButtonRef = useRef<HTMLButtonElement>(null);

  const getDayStart = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const handleChange = (date: Date) => {
    onChange(allowTime ? date : getDayStart(date));
  };

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

  type CloseFunction = (
    focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>,
  ) => void;

  const setDateValue = (date: number, close: CloseFunction) => () => {
    isDateWithinConstraints(date)
      ? (() => {
          handleChange(
            new Date(
              datePickerHeaderDate.getFullYear(),
              datePickerHeaderDate.getMonth(),
              date,
              datePickerHeaderDate.getHours(),
              datePickerHeaderDate.getMinutes(),
              datePickerHeaderDate.getSeconds(),
            ),
          );
          if (!allowTime) {
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
    handleChange(
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
    if (
      min &&
      max &&
      min.getDate() === max.getDate() &&
      day === min.getDate() &&
      month === min.getMonth() &&
      year === min.getFullYear()
    ) {
      return true;
    }
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

  useEffect(() => {
    getDayCount(datePickerHeaderDate);
  }, [datePickerHeaderDate]);

  const scrollTime = (smooth: boolean = true) => {
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

        selected.parentElement?.scrollBy({
          top: toScroll,
          behavior: smooth ? "smooth" : "instant",
        });
      }
    });
  };

  useEffect(() => {
    value && setDatePickerHeaderDate(value);
    scrollTime();
  }, [value]);

  useEffect(() => {
    if (!popOverOpen) return;
    scrollTime(false);
  }, [popOverOpen]);

  useEffect(() => {
    isOpen && popoverButtonRef.current?.click();
  }, [isOpen]);

  const dateFormat = `DD/MM/YYYY${allowTime ? " hh:mm a" : ""}`;

  const getPosition = () => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    const popOverX = popoverButtonRef.current?.getBoundingClientRect().x || 0;
    const popOverY = popoverButtonRef.current?.getBoundingClientRect().y || 0;

    const right = popOverX > viewportWidth - (allowTime ? 420 : 300);
    const top = popOverY > viewportHeight - 400;

    return `${right ? "md:-translate-x-1/2" : ""} ${top ? "md:-translate-y-[calc(100%+50px)]" : ""}`;
  };

  const domValue = useValueInjectionObserver<string>({
    targetElement: dateInputRef.current,
    attribute: "data-cui-dateinput-value",
  });

  useEffect(() => {
    if (value !== domValue && typeof domValue !== "undefined")
      onChange(dayjs(domValue).toDate());
  }, [domValue]);

  return (
    <div>
      <div
        ref={dateInputRef}
        className={`${containerClassName ?? "container mx-auto text-black"}`}
        data-cui-dateinput
        data-cui-dateinput-value={JSON.stringify(
          dayjs(value).format("YYYY-MM-DDTHH:mm"),
        )}
      >
        <Popover className="relative">
          {({ open, close }) => {
            setPopOverOpen(open);
            return (
              <div>
                <PopoverButton
                  disabled={disabled}
                  className="w-full"
                  ref={popoverButtonRef}
                >
                  <input type="hidden" name="date" data-scribe-ignore />
                  <input
                    id={id}
                    name={name}
                    type="text"
                    readOnly
                    disabled={disabled}
                    data-scribe-ignore
                    className={`cui-input-base cursor-pointer disabled:cursor-not-allowed ${className}`}
                    placeholder={placeholder ?? t("select_date")}
                    value={value ? dayjs(value).format(dateFormat) : ""}
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 p-2">
                    <CareIcon
                      icon="l-calendar-alt"
                      className="text-lg text-secondary-600"
                    />
                  </div>
                </PopoverButton>
                {open && (
                  <PopoverPanel
                    className={classNames(
                      `cui-dropdown-base absolute my-0.5 ${allowTime ? "max-h-[80vh] w-full md:h-auto md:w-[400px]" : "w-72"} divide-y-0 rounded p-4`,
                      getPosition(),
                      popOverClassName,
                    )}
                  >
                    <div
                      className={classNames(
                        "flex w-full flex-col items-center justify-between gap-y-4",
                      )}
                    >
                      <DateTextInput
                        allowTime={!!allowTime}
                        value={value}
                        onChange={onChange}
                        onFinishInitialTyping={() => close()}
                        error={
                          value &&
                          (!dayjs(value).isValid() ||
                            (!!max && value > max) ||
                            (!!min && value < min))
                            ? "Cannot select date out of range"
                            : undefined
                        }
                      />

                      <div className="flex flex-col items-center gap-4 px-4 md:flex-row md:px-0">
                        <div className="flex flex-1 flex-col items-center justify-between">
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
                              data-test-id="decrement-date-range"
                            >
                              <CareIcon
                                icon="l-angle-left-b"
                                className="text-lg"
                              />
                            </button>

                            <div className="flex items-center justify-center text-sm">
                              {type === "date" && (
                                <div
                                  onClick={() => setType("month")}
                                  className="cursor-pointer rounded px-3 py-1 text-center font-medium text-black hover:bg-secondary-300"
                                >
                                  {dayjs(datePickerHeaderDate).format("MMMM")}
                                </div>
                              )}
                              <div
                                onClick={() => setType("year")}
                                className="cursor-pointer rounded px-3 py-1 font-medium text-black hover:bg-secondary-300"
                              >
                                <p className="text-center">
                                  {type == "year"
                                    ? year.getFullYear()
                                    : dayjs(datePickerHeaderDate).format(
                                        "YYYY",
                                      )}
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
                              data-test-id="increment-date-range"
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
                                  let selected;
                                  if (value) {
                                    const newDate = new Date(
                                      datePickerHeaderDate,
                                    );
                                    newDate.setDate(d);
                                    selected =
                                      value.toDateString() ===
                                      newDate.toDateString();
                                  }

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
                        {allowTime && (
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
                                  options: Array.from(
                                    { length: 60 },
                                    (_, i) => i,
                                  ),
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
                                  ...(input.name === "am/pm"
                                    ? []
                                    : input.options),
                                  ...(input.name === "am/pm"
                                    ? []
                                    : input.options),
                                ].map((option, j) => (
                                  <button
                                    type="button"
                                    key={j}
                                    className={`flex aspect-square w-9 shrink-0 items-center justify-center rounded-md border transition-all ${(input.name === "Hours" && option === 12 ? [0, 12].includes(input.value) : input.value === option) ? "border-primary-600 bg-primary-500 font-bold text-white" : "border-gray-200 hover:bg-secondary-300"} text-sm`}
                                    onClick={() =>
                                      input.onChange(option as any)
                                    }
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
                )}
              </div>
            );
          }}
        </Popover>
      </div>
    </div>
  );
};

export default DateInputV2;
