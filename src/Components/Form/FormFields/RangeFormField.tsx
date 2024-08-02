import { useState } from "react";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import FormField from "./FormField";
import {
  classNames,
  properRoundOf,
  ValueDescription,
} from "../../../Utils/utils";
import TextFormField from "./TextFormField";

type BaseProps = FormFieldBaseProps<number> & {
  min: number;
  max: number;
  step?: number;
  valueDescriptions?: ValueDescription[];
  hideInput?: boolean;
};

type PropsWithUnit = BaseProps & {
  unit: string;
  units?: undefined;
};

type PropsWithUnits = BaseProps & {
  unit?: undefined;
  units: {
    label: string;
    // Fn. to convert field's `value` to the this unit.
    conversionFn?: (val: number) => number;
    // Fn. to convert user input from this unit to field's `value`.
    inversionFn?: (val: number) => number;
  }[];
};

type Props = PropsWithUnit | PropsWithUnits;

const unity = (v: number) => v;

export default function RangeFormField(props: Props) {
  const field = useFormFieldPropsResolver(props);

  const [unit, setUnit] = useState(() => {
    if (props.units?.length) {
      return {
        label: props.units[0].label,
        conversionFn: props.units[0].conversionFn || unity,
        inversionFn: props.units[0].inversionFn || unity,
      };
    }

    return {
      label: props.unit || "",
      conversionFn: unity,
      inversionFn: unity,
    };
  });

  // Value in current unit
  const value = (() => {
    if (props.value == null) {
      return;
    }
    if (typeof props.value === "string") {
      // Because serializes decimals as strings, although it accepts decimal as numbers.
      return unit.conversionFn(parseFloat(props.value));
    }
    return unit.conversionFn(props.value);
  })();

  // Min and max in current unit
  const [min, max] = [props.min, props.max].map(unit.conversionFn);

  const error = (() => {
    if (value == null) {
      return;
    }

    if (value < min) {
      return `Value must be greater than or equal to ${min}${unit?.label ?? ""}.`;
    }

    if (value > max) {
      return `Value must be lesser than or equal to ${max}${unit?.label ?? ""}.`;
    }
  })();

  const valueDescription =
    value != null
      ? props.valueDescriptions?.find((vd) => (vd.till || props.max) >= value)
      : undefined;

  const roundedValue =
    Math.round(((value || min) + Number.EPSILON) * 100) / 100;

  const allValueColors = props.valueDescriptions?.every((vd) => vd.color);

  const trailPercent = ((roundedValue - min) / ((max || 0) - (min || 0))) * 100;

  const snapStopLength = Math.min(
    (props.max - props.min) / (props.step || 1),
    props.max - props.min,
    20,
  );

  const handleChange = (v: number) => field.handleChange(unit.inversionFn(v));

  const displayValue = value != null ? properRoundOf(value) : "";

  return (
    <FormField
      field={{
        ...field,
        label: (
          <>
            {field.label} {unit.label && <span>({unit.label})</span>}
          </>
        ),
        labelSuffix: (
          <div className="flex flex-row items-center gap-2">
            <div
              className={classNames(
                "text-sm font-bold",
                valueDescription?.className,
              )}
              style={{ color: valueDescription?.color }}
            >
              {valueDescription?.text}
            </div>
            {!props.hideInput && (
              <TextFormField
                name="range"
                type="number"
                value={displayValue}
                placeholder="--.--"
                onChange={(e) => handleChange(parseFloat(e.value))}
                min={min}
                max={max}
                errorClassName="hidden"
                inputClassName={classNames(
                  "py-1.5",
                  unit.label ? "w-36" : "w-24",
                )}
                trailingPadding=" "
                trailing={
                  props.units?.length ? (
                    <select
                      id={field.name + "_units"}
                      name={field.name + "_units"}
                      className="cui-input-base mr-4 h-full border-0 bg-transparent py-0 pl-2 pr-8 text-xs font-bold text-secondary-700 focus:ring-2 focus:ring-inset"
                      value={unit.label}
                      onChange={(e) => {
                        const resolved = props.units.find(
                          (o) => o.label === e.target.value,
                        );
                        if (resolved) {
                          setUnit({
                            label: resolved.label,
                            conversionFn: resolved.conversionFn ?? unity,
                            inversionFn: resolved.inversionFn ?? unity,
                          });
                        }
                      }}
                      disabled={props.disabled}
                    >
                      {props.units.map(({ label }, i) => (
                        <option key={i} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="absolute right-10 text-xs font-bold text-secondary-700">
                      {unit.label}
                    </p>
                  )
                }
              />
            )}
          </div>
        ),
        error: error || field.error,
      }}
    >
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
          value={displayValue}
          min={min}
          max={max}
          step={props.step}
          onChange={(e) => handleChange(e.target.valueAsNumber)}
        />
      </div>

      <div className="flex justify-between">
        {Array.from({ length: snapStopLength + 1 }).map((_, index) => (
          <div key={index} className="h-1 w-px bg-black/20" />
        ))}
      </div>

      <div className="flex justify-between text-xs text-black/30">
        <span>{properRoundOf(min)}</span>
        <span>{properRoundOf(max)}</span>
      </div>
    </FormField>
  );
}
