import { HTMLInputTypeAttribute } from "react";
import FormField from "./FormField";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import { classNames } from "../../../Utils/utils";

type Props = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  autoComplete?: string;
  type?: HTMLInputTypeAttribute;
  className?: string | undefined;
  min?: string | number;
  max?: string | number;
  units: string[];
};

export default function TextWithUnitsFormField(props: Props) {
  const field = useFormFieldPropsResolver(props);

  const selectedUnit = field.value?.split(" ")[-1];

  return (
    <FormField field={field}>
      <div className="relative mt-2 rounded-md shadow-sm">
        {/* <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-gray-500 sm:text-sm">$</span>
        </div> */}
        <input
          type={props.type}
          name={field.name}
          id={field.name}
          className={classNames(
            "cui-input-base block w-full rounded-md border-0 pl-7 pr-20 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6",
            field.error && "border-danger-500",
            field.className
          )}
          placeholder={props.placeholder}
          min={props.min}
          max={props.max}
          autoComplete={props.autoComplete}
          required={field.required}
          onChange={(e) =>
            field.handleChange(e.target.value + " " + selectedUnit)
          }
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          <select
            id={field.name + "_units"}
            name={field.name + "_units"}
            className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
            value={selectedUnit}
            onChange={(e) =>
              field.handleChange(
                field.value.split(" ")[0] + " " + e.target.value
              )
            }
          >
            {props.units.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
    </FormField>
  );
}
