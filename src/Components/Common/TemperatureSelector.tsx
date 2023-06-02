import { useEffect, useState } from "react";
import { classNames } from "../../Utils/utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";

export const TemperatureSelector = (props: any) => {
  const getTemperaturePreferance = () => {
    if (window && window.localStorage) {
      return localStorage.getItem("temperature");
    }
  };
  const [temperature, setTemperature] = useState<string>(
    getTemperaturePreferance() === "Fahrenheit (°F)"
      ? "Fahrenheit (°F)"
      : "Celsius (°C)"
  );
  const handleTemperature = (value: string) => {
    setTemperature(value);
    if (window && window.localStorage) {
      localStorage.setItem("temperature", value);
    }
  };

  useEffect(() => {
    handleTemperature(temperature);
  }, [temperature]);

  return (
    <div className="flex justify-end items-center relative w-full">
      <SelectFormField
        className={classNames(props.className)}
        id="temperature-selector"
        name="temperature"
        value={temperature}
        onChange={({ value }) => handleTemperature(value)}
        options={["Celsius (°C)", "Fahrenheit (°F)"]}
        optionLabel={(o) => o}
      />
    </div>
  );
};
