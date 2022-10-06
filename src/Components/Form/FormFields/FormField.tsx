import { ReactNode } from "react";
import { FieldError } from "../Utils";
import { FormFieldBaseProps, resolveFormFieldError } from "./Utils";

type LabelProps = {
  required?: boolean;
  htmlFor?: string;
  children: string;
  className?: string;
};

export const FieldLabel = (props: LabelProps) => {
  return (
    <label
      className={`mb-2 block text-gray-900 text-base font-normal ${props.className}`}
      htmlFor={props.htmlFor}
    >
      {props.children}
      {props.required && <span className="text-red-500">{" *"}</span>}
    </label>
  );
};

type ErrorTextProps = {
  error: FieldError;
  className?: string;
};

export const FieldErrorText = (props: ErrorTextProps) => {
  return (
    <span
      className={`font-medium tracking-wide text-red-500 text-xs mt-2 ml-1 ${
        props.error ? "opacity-100" : "opacity-0"
      } transition-opacity duration-300 ${props.className}`}
    >
      {props.error}
    </span>
  );
};

const FormField = (props: {
  props: FormFieldBaseProps<any>;
  children: ReactNode;
}) => {
  const { id, className, required, label, labelClass, errorClass } =
    props.props;

  return (
    <div className={className}>
      <FieldLabel htmlFor={id} required={required} className={labelClass}>
        {label}
      </FieldLabel>
      {props.children}
      <FieldErrorText
        className={errorClass}
        error={resolveFormFieldError(props.props)}
      />
    </div>
  );
};

export default FormField;
