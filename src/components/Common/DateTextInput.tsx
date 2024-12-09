import dayjs from "dayjs";
import { Fragment, KeyboardEvent, useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

/**
 * DateTextInput component.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.allowTime - If true, shows time input fields (hour and minute).
 * @param {Date} props.value - The current date value.
 * @param {function(Date):void} props.onChange - Callback function when date value changes.
 * @param {function():void} props.onFinishInitialTyping - Callback function when a user successfuly types in the date on the first input
 * @param {String} props.error - Shows an error if specified
 *
 * @returns {JSX.Element} The date text input component.
 */
export default function DateTextInput(props: {
  allowTime: boolean;
  value?: Date;
  onChange: (date: Date | undefined) => unknown;
  onFinishInitialTyping?: () => unknown;
  error?: string;
}) {
  const { value, onChange, allowTime, error, onFinishInitialTyping } = props;

  const [editingText, setDirtyEditingText] = useState({
    date: `${value ? value?.getDate() : ""}`,
    month: `${value ? value.getMonth() + 1 : ""} `,
    year: `${value ? value.getFullYear() : ""}`,
    hour: `${value ? value.getHours() : ""}`,
    minute: `${value ? value.getMinutes() : ""}`,
  });

  const setEditingText = (et: typeof editingText) => {
    setDirtyEditingText(et);
    const newDate = new Date(
      parseInt(et.year),
      parseInt(et.month) - 1,
      parseInt(et.date),
      allowTime ? parseInt(et.hour) : 0,
      allowTime ? parseInt(et.minute) : 0,
    );
    if (et.year.length > 3 && dayjs(newDate).isValid()) {
      if (!value && !allowTime) onFinishInitialTyping?.();
      if (!value && allowTime && et.minute.length > 1)
        onFinishInitialTyping?.();
      onChange(newDate);
    }
  };

  const handleBlur = (rawValue: string, key: string) => {
    const val = getBlurredValue(rawValue, key);
    setEditingText({
      ...editingText,
      [key]: val,
    });
  };

  const getBlurredValue = (rawValue: string, key: string) => {
    const maxMap = [31, 12, 2999, 23, 59];
    const index = Object.keys(editingText).findIndex((et) => et === key);
    const value = Math.min(maxMap[index], parseInt(rawValue));
    const finalValue =
      rawValue.trim() !== ""
        ? ("000" + value).slice(key === "year" ? -4 : -2)
        : "";
    return finalValue;
  };

  const goToInput = (i: number) => {
    if (i < 0 || i > 4) return;
    (
      document.querySelectorAll(
        `[data-time-input]`,
      ) as NodeListOf<HTMLInputElement>
    ).forEach((i) => i.blur());
    (
      document.querySelector(`[data-time-input="${i}"]`) as HTMLInputElement
    )?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, i: number) => {
    const keyboardKey: number = event.keyCode || event.charCode;
    const target = event.target as HTMLInputElement;

    // check for backspace
    if ([8].includes(keyboardKey) && target.value === "") goToInput(i - 1);

    // check for delete
    if ([46].includes(keyboardKey) && target.value === "") goToInput(i + 1);

    // check for left arrow key
    if ([37].includes(keyboardKey) && (target.selectionStart || 0) < 1)
      goToInput(i - 1);

    // check for right arrow key
    if ([39].includes(keyboardKey) && (target.selectionStart || 0) > 1)
      goToInput(i + 1);
  };

  useEffect(() => {
    const formatUnfocused = (value: number, id: number, digits: number = 2) => {
      const activeElementIdRaw =
        document.activeElement?.getAttribute("data-time-input");
      const activeElementId = activeElementIdRaw
        ? parseInt(activeElementIdRaw)
        : undefined;
      if (id === activeElementId) return value;
      return ("000" + value).slice(-digits);
    };

    setDirtyEditingText({
      date: `${value ? formatUnfocused(value.getDate(), 0) : ""}`,
      month: `${value ? formatUnfocused(value.getMonth() + 1, 1) : ""}`,
      year: `${value ? formatUnfocused(value.getFullYear(), 2, 4) : ""}`,
      hour: `${value ? formatUnfocused(value.getHours(), 3) : ""}`,
      minute: `${value ? formatUnfocused(value.getMinutes(), 4) : ""}`,
    });
  }, [value]);

  return (
    <div className="w-full">
      <div
        className={classNames(
          `cui-input-base relative flex w-full cursor-text items-center overflow-hidden bg-secondary-50 px-4 py-0 text-gray-600`,
          error && `!border-red-500`,
          !!document.activeElement?.getAttribute("data-time-input") &&
            "border-primary-500",
        )}
        onClick={(e) =>
          e.target === e.currentTarget &&
          (value ? goToInput(allowTime ? 4 : 2) : goToInput(0))
        }
        data-test-id="date-input"
      >
        {Object.entries(editingText)
          .slice(0, allowTime ? 5 : 3)
          .map(([key, val], i) => (
            <Fragment key={i}>
              <input
                type="text"
                value={val}
                autoFocus={i === 0}
                className={`rounded-none border-none bg-transparent text-black shadow-none outline-none ring-0 ${
                  key === "year" ? "w-[45px]" : "w-[20px]"
                } px-0 placeholder:text-xs`}
                placeholder={
                  "DDMMYYHHMM".slice(i * 2, i * 2 + 2) +
                  (key === "year" ? "YY" : "")
                }
                onKeyDown={(e) => handleKeyDown(e, i)}
                data-time-input={i}
                onChange={(e) => {
                  const value = e.target.value;
                  if (
                    (value.endsWith("/") ||
                      value.endsWith(" ") ||
                      value.endsWith(":") ||
                      value.length > (key === "year" ? 3 : 1)) &&
                    i < 4
                  ) {
                    goToInput(i + 1);
                  } else {
                    setEditingText({
                      ...editingText,
                      [key]: value
                        .replace(/\D/g, "")
                        .slice(0, key === "year" ? 4 : 2),
                    });
                  }
                }}
                onBlur={(e) => handleBlur(e.target.value, key)}
              />
              <span className="mx-1">
                {["date", "month"].includes(key)
                  ? "/"
                  : key === "hour"
                    ? ":"
                    : " "}
              </span>
            </Fragment>
          ))}

        <button
          className="absolute inset-y-0 right-0 px-2 text-xl text-secondary-500 hover:text-secondary-700"
          type="button"
          data-test-id="clear-date-input"
          onClick={() => {
            setDirtyEditingText(
              Object.fromEntries(
                Object.entries(editingText).map(([key]) => [key, ""]),
              ) as typeof editingText,
            );
          }}
        >
          <CareIcon icon="l-times" />
        </button>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
