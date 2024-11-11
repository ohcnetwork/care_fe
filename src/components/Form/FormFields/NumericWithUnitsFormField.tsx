import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";

import { classNames } from "@/Utils/utils";

type Props = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string;
  autoComplete?: string;
  className?: string | undefined;
  min?: string | number;
  max?: string | number;
  units: readonly string[];
};

export default function NumericWithUnitsFormField(props: Props) {
  const field = useFormFieldPropsResolver(props);

  const [numValue, unitValue] = field.value?.split(" ") ?? ["", props.units[0]];

  return (
    <FormField field={field}>
      <div className="relative">
        <input
          type="number"
          name={field.name}
          id={field.name}
          className={classNames(
            "cui-input-base pr-24 sm:leading-6 md:pr-28",
            field.error && "border-danger-500",
            field.className,
          )}
          placeholder={props.placeholder}
          min={props.min}
          max={props.max}
          autoComplete={props.autoComplete}
          required={field.required}
          value={numValue}
          disabled={props.disabled}
          onChange={(e) =>
            field.handleChange(Number(e.target.value) + " " + unitValue)
          }
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          <select
            id={field.name + "_units"}
            name={field.name + "_units"}
            className="cui-input-base h-full border-0 bg-transparent pl-2 pr-7 text-secondary-700 focus:ring-2 focus:ring-inset"
            value={unitValue}
            onChange={(e) =>
              field.handleChange(numValue + " " + e.target.value)
            }
            disabled={props.disabled}
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
