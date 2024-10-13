import { FormFieldBaseProps } from "../Form/FormFields/Utils";
import { fahrenheitToCelsius, celsiusToFahrenheit } from "@/Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "./components/ButtonV2";

import TextFormField from "../Form/FormFields/TextFormField";

type TemperatureFormFieldProps = FormFieldBaseProps<string> & {
  unit: "celsius" | "fahrenheit";
  setUnit: (unit: "celsius" | "fahrenheit") => void;
};

export default function TemperatureFormField({
  onChange,
  unit,
  setUnit,
  id,
  label,
  error,
  value,
  name,
}: TemperatureFormFieldProps) {
  const handleUnitChange = () => {
    let newValue = parseFloat(value || "0");
    if (!isNaN(newValue)) {
      if (unit === "celsius") {
        newValue = celsiusToFahrenheit(newValue);
      } else {
        newValue = fahrenheitToCelsius(newValue);
      }
      onChange({ name, value: newValue.toFixed(1) });
    }
    setUnit(unit === "celsius" ? "fahrenheit" : "celsius");
  };

  return (
    <div className="relative">
      <TextFormField
        id={id}
        label={label}
        type="number"
        value={value ? value : ""}
        name={name}
        min={`${unit === "celsius" ? 35 : 95}`}
        max={`${unit === "celsius" ? 41.1 : 106}`}
        step={0.1}
        onChange={(e) => {
          const newValue = e.value;
          if (newValue === "" || /^-?\d*\.?\d{0,1}$/.test(newValue)) {
            onChange(e);
          }
        }}
        autoComplete="off"
        error={error}
      />

      <ButtonV2
        type="button"
        variant="primary"
        className="absolute top-0 right-0 text-xs h-full flex items-center justify-center"
        size="small"
        ghost
        border
        onClick={handleUnitChange}
      >
        <CareIcon
          icon={unit === "celsius" ? "l-celsius" : "l-fahrenheit"}
          className="text-sm"
        />
      </ButtonV2>
    </div>
  );
}
