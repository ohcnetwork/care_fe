import React, { Dispatch } from "react";
import { FieldError } from "../FieldValidators";
import { FormAction, FormDetails, FormState } from "../Utils";

export type FieldChangeEvent<T> = { name: string; value: T };
export type FieldChangeEventHandler<T> = (event: FieldChangeEvent<T>) => void;

export type FormFieldBaseProps<T> = {
  id?: string;
  name: string;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  labelClassName?: string;
  errorClassName?: string;
  value?: T;
  onChange: FieldChangeEventHandler<T>;
  error?: FieldError;
};

export const handleFormFieldChange = <V, F = FormDetails>(
  state: FormState<F>,
  dispatch: Dispatch<FormAction<F>>
) => {
  return (event: FieldChangeEvent<V>) => {
    const { name, value } = event;
    dispatch({ type: "set_form", form: { ...state.form, [name]: value } });
  };
};

export const resolveFormFieldChangeEventHandler = <T>({
  name,
  onChange,
}: FormFieldBaseProps<T>) => {
  return (value: T) => onChange({ name, value });
};
