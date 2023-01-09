import DateInputV2 from "./DateInputV2";

export type DateRange = {
  start: Date | undefined;
  end: Date | undefined;
};

type Props = {
  value?: DateRange | undefined;
  onChange: (value: DateRange) => void;
  className?: string;
  disabled?: boolean | undefined;
  max?: Date;
  min?: Date;
};

const DateRangeInputV2 = ({ value, onChange, ...props }: Props) => {
  const { start, end } = value ?? { start: undefined, end: undefined };

  return (
    <div className="flex gap-2">
      <div className="flex-auto">
        <DateInputV2
          className={props.className}
          value={start}
          onChange={(start) => onChange({ start, end })}
          min={props.min}
          max={end || props.max}
          position="RIGHT"
          placeholder="Start date"
          disabled={props.disabled}
        />
      </div>
      <div className="flex-auto">
        <DateInputV2
          className={props.className}
          value={end}
          onChange={(end) => onChange({ start, end })}
          min={start || props.min}
          max={props.max}
          position="CENTER"
          disabled={props.disabled || !start}
          placeholder="End date"
        />
      </div>
    </div>
  );
};

export default DateRangeInputV2;
