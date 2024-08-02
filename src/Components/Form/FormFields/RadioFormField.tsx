import { classNames } from "../../../Utils/utils";
import FormField from "./FormField";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";

type Props<T> = FormFieldBaseProps<string | null> & {
  options: readonly T[];
  optionDisplay: (option: T) => React.ReactNode;
  optionValue: (option: T) => string;
  containerClassName?: string;
  unselectLabel?: string;
  layout?: "vertical" | "horizontal" | "grid" | "auto";
};

const RadioFormField = <T,>(props: Props<T>) => {
  const field = useFormFieldPropsResolver(props);
  return (
    <FormField field={field}>
      <div
        className={classNames(
          {
            auto: "flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:gap-x-6",
            vertical: "flex flex-col gap-2",
            horizontal: "flex justify-between gap-4",
            grid: "grid grid-cols-2 gap-x-8 gap-y-2",
          }[props.layout ?? "auto"],
          "p-1 transition-all duration-200 ease-in-out",
        )}
      >
        {props.unselectLabel && (
          <div className="flex items-center gap-2">
            <input
              className="h-4 w-4 rounded-full border-secondary-600 text-primary-600 focus:ring-2 focus:ring-primary-500"
              type="radio"
              id="none"
              name={props.name}
              value={undefined}
              checked={field.value == null}
              onChange={() => field.handleChange(null)}
            />
            <label htmlFor="none">{props.unselectLabel}</label>
          </div>
        )}
        {props.options.map((option, idx) => {
          const value = props.optionValue(option);
          const optionId = `${props.name}-${idx}`;
          return (
            <div className="flex items-center gap-2" key={idx}>
              <input
                className="h-4 w-4 rounded-full border-secondary-600 text-primary-600 focus:ring-2 focus:ring-primary-500"
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
