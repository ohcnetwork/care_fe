import { useState } from "react";

import FormField from "@/components/Form/FormFields/FormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";

import { ValueDescription, classNames, properRoundOf } from "@/Utils/utils";

type BaseProps = FormFieldBaseProps<number> & {
  min: number;
  max: number;
  sliderMin?: number;
  sliderMax?: number;
  step?: number;
  valueDescriptions?: ValueDescription[];
  hideInput?: boolean;
  hideUnitInLabel?: boolean;
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
  const [unit, setUnit] = useState(getInitialUnit(props));

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

  const allValueColors = props.valueDescriptions?.every((vd) => vd.color);

  const [sliderMin, sliderMax] = [
    props.sliderMin ?? props.min,
    props.sliderMax ?? props.max,
  ].map(unit.conversionFn);

  const sliderDelta = sliderMax - sliderMin;

  const trailPercent =
    ((Math.round(((value || sliderMin) + Number.EPSILON) * 100) / 100 -
      sliderMin) /
      sliderDelta) *
    100;

  const handleChange = (v: number) =>
    field.handleChange(unit.inversionFn(props.step === 1 ? Math.round(v) : v));

  const displayValue = value != null ? properRoundOf(value) : "";

  return (
    <FormField
      field={{
        ...field,
        label: (
          <>
            {field.label}{" "}
            {!props.hideUnitInLabel && unit.label && (
              <span>({unit.label})</span>
            )}
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
              <>
                <TextFormField
                  name={`${props.name}-range-input`}
                  type="number"
                  value={displayValue}
                  placeholder="--.--"
                  onChange={(e) => handleChange(parseFloat(e.value))}
                  min={min}
                  max={max}
                  errorClassName="hidden"
                  inputClassName="py-1.5 mr-4"
                  disabled={props.disabled}
                />
                {props.units?.length ? (
                  <SelectFormField
                    id={field.name + "_units"}
                    name={field.name + "_units"}
                    inputClassName="py-1.5"
                    className="-ml-1"
                    value={unit.label}
                    options={props.units}
                    optionLabel={(o) => o.label}
                    optionValue={(o) => o.label}
                    onChange={(e) => {
                      const resolved = props.units.find(
                        (o) => o.label === e.value,
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
                    errorClassName="hidden"
                  />
                ) : (
                  <p className="whitespace-nowrap text-xs font-bold text-secondary-700">
                    {unit.label}
                  </p>
                )}
              </>
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
          className={classNames(
            "cui-range-slider",
            field.className,
            props.disabled && "opacity-50",
          )}
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
          min={sliderMin}
          max={sliderMax}
          step={props.step}
          onChange={(e) => handleChange(e.target.valueAsNumber)}
        />
      </div>

      <div className="flex justify-between">
        {Array.from({
          length:
            1 + Math.min(sliderDelta / (props.step || 1), sliderDelta, 20),
        }).map((_, index) => (
          <div key={index} className="h-1 w-px bg-black/20" />
        ))}
      </div>

      <div className="flex justify-between text-xs text-black/30">
        <span>{properRoundOf(sliderMin)}</span>
        <span>{properRoundOf(sliderMax)}</span>
      </div>
    </FormField>
  );
}

const getInitialUnit = (props: Props) => {
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
};
