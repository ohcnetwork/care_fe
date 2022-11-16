import { FieldError } from "../FieldValidators";
import { FormFieldBaseProps, resolveFormFieldError } from "./Utils";

type LabelProps = {
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string | undefined;
};

export const FieldLabel = (props: LabelProps) => {
  return (
    <label className={`field-label ${props.className}`} htmlFor={props.htmlFor}>
      {props.children}
      {props.required && <span className="text-red-500">{" *"}</span>}
    </label>
  );
};

type ErrorProps = {
  error: FieldError;
  className?: string | undefined;
};
export const FieldErrorText = ({ error, className }: ErrorProps) => {
  return (
    <span
      className={`field-error ${
        error ? "opacity-100" : "opacity-0"
      } transition-opacity duration-300 ${className}`}
    >
      {error}
    </span>
  );
};

const FormField = (props: {
  props: FormFieldBaseProps<any>;
  children: React.ReactNode;
}) => {
  const { id, className, required, label, labelClassName, errorClassName } =
    props.props;

  return (
    <div className={className}>
      {label && (
        <FieldLabel htmlFor={id} required={required} className={labelClassName}>
          {label}
        </FieldLabel>
      )}
      {props.children}
      <FieldErrorText
        error={resolveFormFieldError(props.props)}
        className={errorClassName}
      />
    </div>
  );
};

export default FormField;
