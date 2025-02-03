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

    if (
      newDay.length === 2 &&
      parseInt(newDay) >= 1 &&
      parseInt(newDay) <= 31
    ) {
      if (isValidDate(year, month, newDay) && onChange) {
        const updatedDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(newDay),
        );
        onChange(updatedDate);
      }
      document.getElementById(`${id}-month-input`)?.focus();
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value;
    setMonth(newMonth);

    if (
      newMonth.length === 2 &&
      parseInt(newMonth) >= 1 &&
      parseInt(newMonth) <= 12
    ) {
      if (isValidDate(year, newMonth, day) && onChange) {
        const updatedDate = new Date(
          parseInt(year),
          parseInt(newMonth) - 1,
          parseInt(day),
        );
        onChange(updatedDate);
      }

      document.getElementById(`${id}-year-input`)?.focus();
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

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Label className="mb-1">{t("day")}</Label>
        <Input
          type="number"
          placeholder="DD"
          value={day}
          onChange={handleDayChange}
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
          placeholder="MM"
          value={month}
          onChange={handleMonthChange}
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
          placeholder="YYYY"
          value={year}
          onChange={handleYearChange}
          min={1900}
          id={`${id}-year-input`}
          data-cy={`${id}-year-input`}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
