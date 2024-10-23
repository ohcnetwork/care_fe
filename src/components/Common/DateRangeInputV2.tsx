import { useState } from "react";
import DateInputV2 from "./DateInputV2";

export type DateRange = {
  start: Date | undefined;
  end: Date | undefined;
};

type Props = {
  name?: string;
  value?: DateRange;
  onChange: (value: DateRange) => void;
  className?: string;
  disabled?: boolean;
  max?: Date;
  min?: Date;
};

const DateRangeInputV2 = ({ value, onChange, ...props }: Props) => {
  const { start, end } = value ?? { start: undefined, end: undefined };
  const [showEndPicker, setShowEndPicker] = useState(false);

  return (
    <div className="flex gap-2">
      <div className="flex-auto">
        <DateInputV2
          name={props.name + "_start"}
          className={props.className}
          value={start}
          onChange={(start) => {
            onChange({ start, end: start }); // This is to make the end date picker open at the start date by default
            setShowEndPicker(true);
          }}
          min={props.min}
          max={end || props.max}
          position="RIGHT"
          placeholder="Start date"
          disabled={props.disabled}
        />
      </div>
      <div className="flex-auto">
        <DateInputV2
          name={props.name + "_end"}
          className={props.className}
          value={end}
          onChange={(end) => onChange({ start, end })}
          min={start || props.min}
          max={props.max}
          position="CENTER"
          disabled={props.disabled || !start}
          placeholder="End date"
          isOpen={showEndPicker}
          setIsOpen={setShowEndPicker}
        />
      </div>
    </div>
  );
};

export default DateRangeInputV2;
