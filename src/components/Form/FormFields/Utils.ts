import { FocusEvent } from "react";

import { FieldError } from "@/components/Form/FieldValidators";

export type FieldChangeEvent<T> = { name: string; value: T };
export type FieldChangeEventHandler<T> = (event: FieldChangeEvent<T>) => void;

/**
 * The base props for a form field.
 *
 * If a form context is provided, the field will be registered with the form
 * and the onChange, value, and error props will be ignored.
 *
 * If a form context is not provided, the field will be treated as a standalone
 * field.
 *
 * @template T The type of the field value.
 * @template Form The type of the form details.
 */
export type FormFieldBaseProps<T> = {
  label?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  labelClassName?: string;
  errorClassName?: string;
  name: string;
  validate?: undefined;
  id?: string;
  onChange: FieldChangeEventHandler<T>;
  value?: T;
  error?: FieldError;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
};

/**
 * Resolves the props for a form field.
 * If a form context is provided, the field will be registered with the form.
 * Otherwise, the field will be treated as a standalone field.
 *
 * @param props The props for the field.
 * @returns The resolved props along with a handleChange function.
 */
export const useFormFieldPropsResolver = <T>(props: FormFieldBaseProps<T>) => {
  const handleChange = (value: T) =>
    props.onChange({ name: props.name, value });

  return {
    ...props,
    id: props.id ?? props.name,
    name: props.name,
    onChange: props.onChange,
    value: props.value,
    error: props.error,
    handleChange,
  };
};
