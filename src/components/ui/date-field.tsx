import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import dayjs from "@/Utils/dayjs";

interface DateFieldProps {
  date?: Date;
  onChange?: (date?: Date) => void;
  disabled?: boolean;
  id?: string;
}

const isValidDate = (year: string, month: string, day: string): boolean => {
  const parsedDate = dayjs(`${year}-${month}-${day}`, "YYYY-MM-DD", true);
  return parsedDate.isValid();
};

export default function DateField({
  date,
  onChange,
  disabled,
  id = "date-field",
}: DateFieldProps) {
  const { t } = useTranslation();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (date) {
      setDay(date.getDate().toString().padStart(2, "0"));
      setMonth((date.getMonth() + 1).toString().padStart(2, "0"));
      setYear(date.getFullYear().toString());
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [date]);

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDay = e.target.value;
    setDay(newDay);

    // Check if change is from spinner (stepUp/stepDown) vs keyboard input
    const isFromSpinner =
      e.nativeEvent instanceof InputEvent &&
      (e.nativeEvent as InputEvent).inputType === "insertReplacementText";

    if (
      (isFromSpinner || newDay.length === 2) &&
      parseInt(newDay) >= 1 &&
      parseInt(newDay) <= 31
    ) {
      const modifiedDay = isFromSpinner ? newDay.padStart(2, "0") : newDay;
      if (isValidDate(year, month, modifiedDay) && onChange) {
        const updatedDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(modifiedDay),
        );
        onChange(updatedDate);
      }
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value;
    setMonth(newMonth);

    // Check if change is from spinner (stepUp/stepDown) vs keyboard input
    const isFromSpinner =
      e.nativeEvent instanceof InputEvent &&
      (e.nativeEvent as InputEvent).inputType === "insertReplacementText";

    if (
      (isFromSpinner || newMonth.length === 2) &&
      parseInt(newMonth) >= 1 &&
      parseInt(newMonth) <= 12
    ) {
      const modifiedMonth = isFromSpinner
        ? newMonth.padStart(2, "0")
        : newMonth;
      if (isValidDate(year, modifiedMonth, day) && onChange) {
        const updatedDate = new Date(
          parseInt(year),
          parseInt(modifiedMonth) - 1,
          parseInt(day),
        );
        onChange(updatedDate);
      }
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = e.target.value;
    setYear(newYear);

    if (newYear.length === 4 && parseInt(newYear) >= 1900) {
      if (isValidDate(newYear, month, day) && onChange) {
        const updatedDate = new Date(
          parseInt(newYear),
          parseInt(month) - 1,
          parseInt(day),
        );
        onChange(updatedDate);
      }
    }
  };

  // Handle day blur to pad single digit values
  const handleDayBlur = () => {
    if (day.length === 1 && parseInt(day) >= 1 && parseInt(day) <= 9) {
      const paddedDay = day.padStart(2, "0");
      setDay(paddedDay);
      if (isValidDate(year, month, paddedDay) && onChange) {
        const updatedDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(paddedDay),
        );
        onChange(updatedDate);
      }
    }
  };

  // Handle month blur to pad single digit values
  const handleMonthBlur = () => {
    if (month.length === 1 && parseInt(month) >= 1) {
      const paddedMonth = month.padStart(2, "0");
      setMonth(paddedMonth);
      if (isValidDate(year, paddedMonth, day) && onChange) {
        const updatedDate = new Date(
          parseInt(year),
          parseInt(paddedMonth) - 1,
          parseInt(day),
        );
        onChange(updatedDate);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Label className="mb-1">{t("day")}</Label>
        <Input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="DD"
          value={day}
          onChange={handleDayChange}
          onBlur={handleDayBlur}
          min={1}
          max={31}
          id={`${id}-day-input`}
          data-cy={`${id}-day-input`}
          disabled={disabled}
        />
      </div>

      <div className="flex-1">
        <Label className="mb-1">{t("month")}</Label>
        <Input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="MM"
          value={month}
          onChange={handleMonthChange}
          onBlur={handleMonthBlur}
          min={1}
          max={12}
          id={`${id}-month-input`}
          data-cy={`${id}-month-input`}
          disabled={disabled}
        />
      </div>

      <div className="flex-1">
        <Label className="mb-1">{t("year")}</Label>
        <Input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="YYYY"
          value={year}
          onChange={handleYearChange}
          min={1900}
          max={new Date().getFullYear()}
          id={`${id}-year-input`}
          data-cy={`${id}-year-input`}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
