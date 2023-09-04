import { useContext } from "react";
import { FieldError, FieldValidator } from "../FieldValidators";
import { FormContext } from "../FormContext";
import { FormDetails } from "../Utils";

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
export type FormFieldBaseProps<
  T,
  Form extends FormDetails | undefined = undefined
> = {
  label?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  labelClassName?: string;
  errorClassName?: string;
} & (Form extends FormDetails
  ? {
      context: FormContext<Form>;
      name: keyof Form;
      validate?: FieldValidator<Form[keyof Form]>;
      id: undefined;
      onChange: undefined;
      value: undefined;
      error: undefined;
    }
  : {
      context?: undefined;
      name: string;
      validate?: undefined;
      id?: string;
      onChange: FieldChangeEventHandler<T>;
      value?: T;
      error?: FieldError;
    });

/**
 * Resolves the props for a form field.
 * If a form context is provided, the field will be registered with the form.
 * Otherwise, the field will be treated as a standalone field.
 *
 * @param props The props for the field.
 * @returns The resolved props along with a handleChange function.
 */
export const useFormFieldPropsResolver = <
  T,
  Form extends FormDetails | undefined = undefined
>(
  props: FormFieldBaseProps<T, Form>
) => {
  if (props.context) {
    // Voluntarily disabling the rule of hooks here because we want to use the
    // context hook only if the context is defined. If the context is not
    // defined, we want to use the props instead.
    //
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const registerField = useContext(props.context);
    const fieldProps = registerField(props.name, props.validate);

    const handleChange = (value: T) =>
      fieldProps.onChange({ name: props.name, value });

    return {
      ...props,
      ...fieldProps,
      handleChange,
    };
  }

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
