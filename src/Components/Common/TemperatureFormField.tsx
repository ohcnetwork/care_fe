import { useState } from "react";
import { FormFieldBaseProps } from "../Form/FormFields/Utils";
import RangeAutocompleteFormField from "../Form/FormFields/RangeAutocompleteFormField";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "./components/ButtonV2";
import { classNames } from "../../Utils/utils";

type TemperatureUnit = "celsius" | "fahrenheit";

type Props = FormFieldBaseProps<number> & {
  placeholder?: string;
};

export default function TemperatureFormField(props: Props) {
  const [unit, setUnit] = useState<TemperatureUnit>("fahrenheit");

  return (
    <RangeAutocompleteFormField
      {...props}
      start={95}
      end={106}
      step={0.1}
      thresholds={[
        {
          value: 95,
          label: "Low",
          icon: <CareIcon className="care-l-temperature-empty" />,
          className: "text-danger-500",
        },
        {
          value: 96.6,
          label: "Low",
          icon: <CareIcon className="care-l-temperature-quarter" />,
          className: "text-warning-500",
        },
        {
          value: 97.6,
          label: "Normal",
          icon: <CareIcon className="care-l-temperature-half" />,
          className: "text-primary-500",
        },
        {
          value: 99.6,
          label: "High",
          icon: <CareIcon className="care-l-temperature-three-quarter" />,
          className: "text-warning-500",
        },
        {
          value: 101.6,
          label: "High",
          icon: <CareIcon className="care-l-temperature" />,
          className: "text-danger-500",
        },
      ]}
      optionLabel={(value) => {
        const val = unit === "celsius" ? fahrenheitToCelsius(value) : value;
        return val.toFixed(1);
      }}
      labelSuffix={
        <ButtonV2
          type="button"
          variant="primary"
          className="text-xs"
          size="small"
          ghost
          border
          onClick={() => setUnit(unit === "celsius" ? "fahrenheit" : "celsius")}
        >
          <CareIcon className={classNames("text-sm", `care-l-${unit}`)} />
        </ButtonV2>
      }
    />
  );
}

export const celsiusToFahrenheit = (celsius: number) => {
  return (celsius * 9) / 5 + 32;
};

export const fahrenheitToCelsius = (fahrenheit: number) => {
  return ((fahrenheit - 32) * 5) / 9;
};
