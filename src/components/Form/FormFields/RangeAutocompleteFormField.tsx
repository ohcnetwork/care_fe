import { useMemo } from "react";

import ButtonV2 from "@/components/Common/ButtonV2";
import AutocompleteFormField from "@/components/Form/FormFields/Autocomplete";
import { FormFieldBaseProps } from "@/components/Form/FormFields/Utils";

import { classNames, compareBy } from "@/Utils/utils";

export interface Threshold {
  value: number;
  icon?: React.ReactNode;
  label: string;
  className?: string;
}

type Props = FormFieldBaseProps<number> & {
  start: number;
  end: number;
  step: number;
  thresholds?: Threshold[];
  placeholder?: string;
  optionLabel?: (value: number) => string;
  unit?: string;
};

export default function RangeAutocompleteFormField(props: Props) {
  const options = useMemo(() => {
    const sortedThresholds = props.thresholds?.sort(compareBy("value")) || [];

    const getThreshold = (value: number) => {
      const reversedThresholds = [...sortedThresholds].reverse();
      const threshold = reversedThresholds.find(
        (threshold) => value >= threshold.value,
      );
      return threshold;
    };

    return generateOptions(props.start, props.end, props.step).map((value) => {
      return {
        label: value.toString(),
        value,
        threshold: getThreshold(value),
      };
    });
  }, [props.start, props.end, props.step, props.thresholds]);

  return (
    <AutocompleteFormField
      {...props}
      options={options}
      optionLabel={(option) =>
        props.optionLabel?.(option.value) ?? option.label
      }
      optionIcon={({ threshold }) => (
        <div
          className={classNames(
            "flex space-x-2 text-xs group-hover/option:text-white",
            threshold?.className,
          )}
        >
          <span>{threshold?.label}</span>
          <span>{threshold?.icon}</span>
        </div>
      )}
      optionValue={(option) => option.value}
      labelSuffix={
        props.labelSuffix ||
        (props.unit && (
          <ButtonV2
            type="button"
            variant="secondary"
            className="text-xs"
            size="small"
            ghost
          >
            {props.unit}
          </ButtonV2>
        ))
      }
    />
  );
}

const generateOptions = (start: number, end: number, step: number) => {
  const precision = step.toString().split(".")[1]?.length || 0;
  const res = [];
  for (let i = start; i <= end; i += step) {
    res.push(parseFloat(i.toFixed(precision)));
  }
  return res;
};
