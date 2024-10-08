import { FormFieldBaseProps } from "../Form/FormFields/Utils";

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
}: TemperatureFormFieldProps) {
  return (
    <div className="relative">
      <TextFormField
        id={id}
        label={label}
        type="number"
        value={value !== undefined && value !== null ? value : ""}
        name="temperature"
        min={`${unit === "celsius" ? 35 : 95}`}
        max={`${unit === "celsius" ? 41.1 : 106}`}
        step={0.1}
        onChange={onChange}
        autoComplete="off"
        error={error}
      />

      <ButtonV2
        type="button"
        variant="primary"
        className="absolute top-0 right-0 text-xs  h-full flex items-center justify-center"
        size="small"
        ghost
        border
        onClick={() => setUnit(unit === "celsius" ? "fahrenheit" : "celsius")}
      >
        <CareIcon
          icon={unit === "celsius" ? "l-celsius" : "l-fahrenheit"}
          className="text-sm"
        />
      </ButtonV2>
    </div>
  );
}
