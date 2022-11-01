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
};

const DateRangeInputV2 = ({ value, onChange, className, disabled }: Props) => {
  const { start, end } = value ?? { start: undefined, end: undefined };

  return (
    <div className="flex gap-2">
      <div className="flex-auto">
        <DateInputV2
          className={className}
          value={start}
          onChange={(start) => onChange({ start, end })}
          position="RIGHT"
          placeholder="Start date"
          disabled={disabled}
        />
      </div>
      <div className="flex-auto">
        <DateInputV2
          className={className}
          value={end}
          onChange={(end) => onChange({ start, end })}
          position="CENTER"
          disabled={disabled || !start}
          placeholder="End date"
        />
      </div>
    </div>
  );
};

export default DateRangeInputV2;
