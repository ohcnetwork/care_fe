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

  const validate = ({ start, end }: { start?: Date; end?: Date }) => {
    if (start && end && start > end) {
      onChange({ start: end, end: start });
    } else {
      onChange({ start, end });
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex-auto">
        <DateInputV2
          className={className}
          value={start}
          onChange={(start) => validate({ start, end })}
          position="RIGHT"
          placeholder="Start date"
          disabled={disabled}
        />
      </div>
      <div className="flex-auto">
        <DateInputV2
          className={className}
          value={end}
          onChange={(end) => validate({ start, end })}
          min={start}
          position="CENTER"
          disabled={disabled || !start}
          placeholder="End date"
        />
      </div>
    </div>
  );
};

export default DateRangeInputV2;
