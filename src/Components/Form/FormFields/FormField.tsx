import { FieldError } from "../FieldValidators";
import { FormFieldBaseProps, resolveFormFieldError } from "./Utils";

type LabelProps = {
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
};

export const FieldLabel = (props: LabelProps) => {
  return (
    <label
      className="mb-2 block text-gray-900 text-base font-normal"
      htmlFor={props.htmlFor}
    >
      {props.children}
      {props.required && <span className="text-red-500">{" *"}</span>}
    </label>
  );
};

export const FieldErrorText = (props: { error: FieldError }) => {
  return (
    <span
      className={`font-medium tracking-wide text-red-500 text-xs mt-2 ml-1 ${
        props.error ? "opacity-100" : "opacity-0"
      } transition-opacity duration-300`}
    >
      {props.error}
    </span>
  );
};

const FormField = (props: {
  props: FormFieldBaseProps<any>;
  children: React.ReactNode;
}) => {
  const { id, className, required, label } = props.props;

  return (
    <div className={className}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {props.children}
      <FieldErrorText error={resolveFormFieldError(props.props)} />
    </div>
  );
};

export default FormField;
