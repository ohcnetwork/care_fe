import dayjs from "dayjs";
import { Fragment, KeyboardEvent, useEffect, useState } from "react";

/**
 * DateTextInput component.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.allowTime - If true, shows time input fields (hour and minute).
 * @param {Date} props.value - The current date value.
 * @param {function(Date):void} props.onChange - Callback function when date value changes.
 *
 * @returns {JSX.Element} The date text input component.
 */
export default function DateTextInput(props: {
  allowTime: boolean;
  value: Date;
  onChange: (date: Date) => unknown;
}) {
  const { value, onChange, allowTime } = props;

  const [editingText, setDirtyEditingText] = useState({
    date: `${value.getDate()}`,
    month: `${value.getMonth() + 1}`,
    year: `${value.getFullYear()}`,
    hour: `${value.getHours()}`,
    minute: `${value.getMinutes()}`,
  });

  const setEditingText = (et: typeof editingText) => {
    setDirtyEditingText(et);
    const newDate = new Date(
      parseInt(et.year),
      parseInt(et.month) - 1,
      parseInt(et.date),
      parseInt(et.hour),
      parseInt(et.minute),
    );
    if (dayjs(newDate).isValid()) {
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
      rawValue !== "" ? ("000" + value).slice(key === "year" ? -4 : -2) : "";
    console.log(finalValue);
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
    setDirtyEditingText({
      date: `${value.getDate()}`,
      month: `${value.getMonth() + 1}`,
      year: `${value.getFullYear()}`,
      hour: `${value.getHours()}`,
      minute: `${value.getMinutes()}`,
    });
  }, [value]);

  return (
    <div className="flex items-center overflow-hidden w-full text-gray-600 cui-input-base px-4 py-0 bg-secondary-50">
      {Object.entries(editingText)
        .slice(0, allowTime ? 5 : 3)
        .map(([key, val], i) => (
          <Fragment key={i}>
            <input
              type="text"
              value={val}
              autoFocus={i === 0}
              className={`text-black shadow-none bg-transparent border-none rounded-none outline-none ring-0 ${
                key === "year" ? "w-[45px]" : "w-[20px]"
              } px-0 placeholder:text-sm`}
              placeholder={
                "DDMMYYHHmm".slice(i * 2, i * 2 + 2) +
                (key === "year" ? "YY" : "")
              }
              onKeyDown={(e) => handleKeyDown(e, i)}
              data-time-input={i}
              onChange={(e) => {
                const value = e.target.value;
                setEditingText({
                  ...editingText,
                  [key]: value
                    .replace(/\D/g, "")
                    .slice(0, key === "year" ? 4 : 2),
                });
                if (
                  (value.endsWith("/") ||
                    value.endsWith(" ") ||
                    value.endsWith(":") ||
                    value.length > (key === "year" ? 3 : 1)) &&
                  i < 4
                ) {
                  goToInput(i + 1);
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
    </div>
  );
}
