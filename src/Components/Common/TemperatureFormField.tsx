import { useState, useEffect } from "react";
import { FieldChangeEvent, FormFieldBaseProps } from "../Form/FormFields/Utils";
import { fahrenheitToCelsius, celsiusToFahrenheit } from "@/Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "./components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";

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
          ? fahrenheitToCelsius(parseFloat(value)).toFixed(1)
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

    const regex = /^-?\d*\.?\d{0,1}$/;
    if (regex.test(newValue)) {
      setInputValue(newValue);
    }
  };

  const handleBlur = () => {
    if (!inputValue) return;
    const parsedValue = parseFloat(inputValue);
    if (isNaN(parsedValue)) return;

    const finalValue =
      unit === "celsius"
        ? celsiusToFahrenheit(parsedValue).toString()
        : parsedValue.toString();

    setInputValue(finalValue);
    onChange({ name, value: finalValue });
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
        onBlur={handleBlur}
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
