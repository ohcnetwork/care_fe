import { useEffect, useState } from "react";
import { classNames } from "../../Utils/utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { getTemperaturePreference } from "../Common/utils/DevicePreference";

export const TemperatureSelector = (props: any) => {
  const [temperature, setTemperature] = useState<string>(
    getTemperaturePreference() === "F" ? "Fahrenheit (°F)" : "Celsius (°C)"
  );
  const handleTemperature = (value: string) => {
    setTemperature(value);
    if (window && window.localStorage) {
      localStorage.setItem("temperature", value?.charAt(0));
    }
  };

  function handleLocalTemperatureChange(e: any) {
    if (e.key === "temperature") {
      setTemperature(
        getTemperaturePreference() === "F" ? "Fahrenheit (°F)" : "Celsius (°C)"
      );
    }
  }
  useEffect(() => {
    window.addEventListener("storage", handleLocalTemperatureChange);
    return () => {
      window.removeEventListener("storage", handleLocalTemperatureChange);
    };
  }, []);

  useEffect(() => {
    handleTemperature(temperature);
  }, [temperature]);

  return (
    <SelectFormField
      className={classNames(props.className)}
      id="temperature-selector"
      name="temperature"
      value={temperature}
      errorClassName="hidden"
      onChange={({ value }) => handleTemperature(value)}
      options={["Celsius (°C)", "Fahrenheit (°F)"]}
      optionLabel={(o) => o}
      optionValue={(o) => o}
    />
  );
};
