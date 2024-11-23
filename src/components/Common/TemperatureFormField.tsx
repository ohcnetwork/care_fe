import { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
} from "@/components/Form/FormFields/Utils";

import { celsiusToFahrenheit, fahrenheitToCelsius } from "@/Utils/utils";

type TemperatureUnit = "celsius" | "fahrenheit";

type TemperatureFormFieldProps = FormFieldBaseProps<string>;

export default function TemperatureFormField({
  onChange,
  id,
  label,
  error,
  value,
  name,
}: TemperatureFormFieldProps) {
  const [unit, setUnit] = useState<TemperatureUnit>("fahrenheit");
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => {
    if (value) {
      const initialTemperature =
        unit === "celsius"
          ? Number(fahrenheitToCelsius(parseFloat(value)).toFixed(1)).toString()
          : value;
      setInputValue(initialTemperature);
    }
  }, [value, unit]);

  const handleUnitChange = () => {
    setUnit(unit === "celsius" ? "fahrenheit" : "celsius");
    if (inputValue) {
      const convertedValue =
        unit === "celsius"
          ? celsiusToFahrenheit(parseFloat(inputValue)).toFixed(1)
          : fahrenheitToCelsius(parseFloat(inputValue)).toFixed(1);
      setInputValue(convertedValue);
    }
  };

  const handleInputChange = (e: FieldChangeEvent<string>) => {
    const newValue = e.value;
    setInputValue(newValue);

    if (Number.isNaN(newValue)) return;

    const valueInFahrenheit =
      unit === "celsius" ? celsiusToFahrenheit(Number(newValue)) : newValue;

    onChange({ name, value: valueInFahrenheit.toString() });
  };

  return (
    <div className="relative">
      <TextFormField
        id={id}
        label={label}
        type="number"
        value={inputValue}
        name={name}
        min={`${unit === "celsius" ? 35 : 95}`}
        max={`${unit === "celsius" ? 41.1 : 106}`}
        step={0.1}
        onChange={handleInputChange}
        autoComplete="off"
        error={error}
      />

      <ButtonV2
        type="button"
        variant="primary"
        className="absolute right-0 top-0 flex h-full items-center justify-center text-xs"
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
