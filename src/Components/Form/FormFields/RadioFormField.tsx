import FormField from "./FormField";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";

type Props<T> = FormFieldBaseProps<string> & {
  options: T[];
  optionDisplay: (option: T) => React.ReactNode;
  optionValue: (option: T) => string;
};

const RadioFormField = <T,>(props: Props<T>) => {
  const field = useFormFieldPropsResolver(props);
  return (
    <FormField field={field}>
      <div className="flex gap-4 p-4">
        {props.options.map((option, idx) => {
          const value = props.optionValue(option);
          const optionId = `${props.name}-${idx}`;
          return (
            <div className="flex items-center gap-2">
              <input
                className="h-4 w-4 rounded-full border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500"
                type="radio"
                id={optionId}
                name={props.name}
                value={props.optionValue(option)}
                checked={value === field.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <label htmlFor={optionId}>{props.optionDisplay(option)}</label>
            </div>
          );
        })}
      </div>
    </FormField>
  );
};

export default RadioFormField;
