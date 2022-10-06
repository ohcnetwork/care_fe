import { useRef } from "react";

export type Range = [number, number];

type RangeSliderProps = {
  className?: string;
  value: Range;
  range: Range;
  step?: number;
} & (
  | {
      onChange: (value: Range) => void;
      onMinChange?: undefined;
      onMaxChange?: undefined;
    }
  | {
      onChange?: undefined;
      onMinChange: (value: number) => void;
      onMaxChange: (value: number) => void;
    }
);

const RangeSlider = (props: RangeSliderProps) => {
  const [min, max] = props.range;
  const [minVal, maxVal] = props.value;
  const minRef = useRef(null);
  const maxRef = useRef(null);

  return (
    <div className={props.className}>
      <input
        type="range"
        ref={minRef}
        min={min}
        max={max}
        value={minVal}
        step={props.step}
        onChange={(event) => {
          const value = Math.min(+event.target.value, maxVal);
          props.onMinChange
            ? props.onMinChange(value)
            : props.onChange([value, maxVal]);
          event.target.value = value.toString();
        }}
        className="z-30"
      />
      <input
        type="range"
        ref={maxRef}
        min={min}
        max={max}
        value={maxVal}
        step={props.step}
        onChange={(event) => {
          const value = Math.max(+event.target.value, minVal);
          props.onMaxChange
            ? props.onMaxChange(value)
            : props.onChange([minVal, value]);
          event.target.value = value.toString();
        }}
        className="z-30"
      />
      <div className="relative w-full">
        <div className="absolute border-4 h-1 bg-gray-200 w-full z-10" />
        <div className="absolute border-4 h-1 bg-primary-500 z-20" />
      </div>
    </div>
  );
};

export default RangeSlider;
