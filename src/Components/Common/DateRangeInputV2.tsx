import React from "react";
import DateInputV2 from "./DateInputV2";

type Props = {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onChange: (startDate: Date | undefined, endDate: Date | undefined) => void;
  label?: string;
};

const DateRangeInputV2 = ({ startDate, endDate, onChange, label }: Props) => {
  return (
    <div className="my-2">
      {label && <span className="text-sm font-semibold">{label}</span>}
      <div className="flex gap-2">
        <div className="flex-auto">
          <DateInputV2
            value={startDate}
            onChange={(date: Date) => onChange(date, endDate)}
            position="RIGHT"
            placeholder="start date"
          />
        </div>
        <div className="flex-auto">
          <DateInputV2
            value={endDate}
            onChange={(date: Date) => onChange(startDate, date)}
            position="CENTER"
            disabled={!startDate}
            placeholder="end date"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeInputV2;
