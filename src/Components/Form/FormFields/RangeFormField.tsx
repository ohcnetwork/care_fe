import { HTMLInputTypeAttribute, useState } from "react";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import FormField from "./FormField";
import { classNames, properRoundOf } from "../../../Utils/utils";
import Chip from "../../../CAREUI/display/Chip";
import TextFormField from "./TextFormField";

export type RangeFormFieldProps = FormFieldBaseProps<number> & {
  value?: number;
  start?: number;
  end?: number;
  step?: number;
  type?: HTMLInputTypeAttribute;
  className?: string | undefined;
  inputClassName?: string | undefined;
  removeDefaultClasses?: true | undefined;
  valueDescriptions?: ValueDescription[];
  showInput?: boolean;
  units?: {
    label: string;
    className?: string;
    conversionFn?: (val: number) => number;
    inversionFn?: (val: number) => number;
  }[];
};

export default function RangeFormField(props: RangeFormFieldProps) {
  const field = useFormFieldPropsResolver(props);
  const [currentUnit, setCurrentUnit] = useState(0);

  const valueDescription = props.valueDescriptions?.find(
    (vd) => (vd.till || props.end || 0) >= (field.value || 0),
  );
  const selectedUnit = props.units?.[currentUnit];
  const value = selectedUnit?.conversionFn
    ? selectedUnit.conversionFn(field.value || 0)
    : field.value;
  const start = selectedUnit?.conversionFn
    ? selectedUnit.conversionFn(props.start || 0)
    : props.start;
  const end = selectedUnit?.conversionFn
    ? selectedUnit.conversionFn(props.end || 0)
    : props.end;
  const onChange = (value: number) => {
    field.handleChange(
      selectedUnit?.inversionFn ? selectedUnit.inversionFn(value) : value,
    );
  };
  const roundedValue =
    Math.round(((value || start || 0) + Number.EPSILON) * 100) / 100;

  const { showInput = true } = props;

  const allValueColors = props.valueDescriptions?.every((vd) => vd.color);

  const trailPercent =
    ((roundedValue - (start || 0)) / ((end || 0) - (start || 0))) * 100;

  const higherThanAllowed = (roundedValue || 0) > (end || 0);
  const lowerThanAllowed = (roundedValue || 0) < (start || 0);
  const error = higherThanAllowed || lowerThanAllowed;

  const snapStopRange = (end || 0) - (start || 0);
  const snapStopLength = Math.min(
    snapStopRange / (props.step || 1),
    snapStopRange,
    20,
  );

  return (
    <FormField field={{ ...field, label: undefined }} compact>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {props.label}
          {props.units && (
            <div className="flex items-center gap-2">
              {props.units.map((unit, index) => (
                <div
                  key={index}
                  className={`cursor-pointer ${currentUnit === index ? "font-semibold" : ""} ${unit.className}`}
                  onClick={() => setCurrentUnit(index)}
                >
                  {unit.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lowerThanAllowed && (
            <Chip
              text="Value lower than allowed"
              startIcon="l-exclamation-triangle"
              variant="danger"
            />
          )}
          {higherThanAllowed && (
            <Chip
              text="Value higher than allowed"
              startIcon="l-exclamation-triangle"
              variant="danger"
            />
          )}
          <div
            className={classNames(
              "text-sm font-bold",
              valueDescription?.className,
            )}
            style={{ color: valueDescription?.color }}
          >
            {valueDescription?.text}
          </div>
          {showInput && (
            <TextFormField
              name="range"
              compact={!error}
              type="number"
              value={roundedValue.toString()}
              onChange={(e) => onChange(parseInt(e.value))}
              min={start}
              max={end}
            />
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          id={field.id}
          className={classNames("cui-range-slider", field.className)}
          style={
            allValueColors
              ? {
                  background: `linear-gradient(to right, ${props.valueDescriptions?.map((vd) => `${vd.color || "transparent"}`).join(",")})`,
                }
              : {
                  background: `linear-gradient(to right, #0d9f6e ${trailPercent}%, lightgray ${trailPercent}%, lightgray`,
                }
          }
          disabled={field.disabled}
          name={field.name}
          value={roundedValue}
          min={start}
          max={end}
          step={props.step}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      </div>
      {
        <div className="flex justify-between">
          {Array.from({ length: snapStopLength + 1 }).map((_, index) => (
            <div key={index} className="h-1 w-px bg-black/20" />
          ))}
        </div>
      }
      <div className="flex justify-between">
        <span className="text-xs text-black/30">
          {start && properRoundOf(start)}
        </span>
        <span className="text-xs text-black/30">
          {end && properRoundOf(end)}
        </span>
      </div>
    </FormField>
  );
}

export type ValueDescription = {
  till?: number;
  text: React.ReactNode;
  className?: string;
  color?: string;
};

export const getValueDescription = (
  valueDescriptions: ValueDescription[],
  value: number,
) => {
  return valueDescriptions?.find((vd) => (vd.till || 0) >= (value || 0));
};
