import { ChangeEventHandler, ReactNode } from "react";

import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";

import { classNames } from "@/Utils/utils";

type Props<T, V = string> = FormFieldBaseProps<V | null> & {
  options: readonly T[];
  optionLabel: (option: T) => React.ReactNode;
  optionValue: (option: T) => V;
  containerClassName?: string;
  unselectLabel?: string;
  layout?: "vertical" | "horizontal" | "grid" | "auto";
};

const RadioFormField = <T, V extends string>(props: Props<T, V>) => {
  const field = useFormFieldPropsResolver(props);
  return (
    <FormField field={field}>
      <div
        className={classNames(
          {
            auto: "flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:gap-x-6",
            vertical: "flex flex-col gap-1",
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
              value={"__NULL__"}
              checked={field.value == null}
              onChange={() => field.handleChange(null)}
            />
            <label htmlFor="none">{props.unselectLabel}</label>
          </div>
        )}
        {props.options.map((option) => {
          const value = props.optionValue(option);
          return (
            <RadioInput
              key={value}
              id={`${props.name}-option-${value}`}
              label={props.optionLabel(option)}
              name={field.name}
              value={props.optionValue(option)}
              checked={value === field.value}
              onChange={(e) => field.handleChange(e.target.value as V)}
            />
          );
        })}
      </div>
    </FormField>
  );
};

export default RadioFormField;

export const RadioInput = (props: {
  label?: ReactNode;
  id?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) => {
  return (
    <div className="flex items-center gap-2">
      <input
        className="h-4 w-4 rounded-full border-secondary-600 text-primary-600 focus:ring-2 focus:ring-primary-500"
        type="radio"
        id={props.id}
        name={props.name}
        value={props.value}
        checked={props.checked}
        onChange={(e) => props.onChange?.(e)}
      />
      <label htmlFor={props.id}>{props.label}</label>
    </div>
  );
};
