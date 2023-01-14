import { classNames } from "../../../Utils/utils";
import { FieldError } from "../FieldValidators";
import { FormFieldBaseProps, resolveFormFieldError } from "./Utils";

type LabelProps = {
  id?: string | undefined;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string | undefined;
};

export const FieldLabel = (props: LabelProps) => {
  return (
    <label
      id={props.id}
      className={`mb-2 block text-gray-900 text-base font-normal ${props.className}`}
      htmlFor={props.htmlFor}
    >
      {props.children}
      {props.required && <span className="text-danger-500">{" *"}</span>}
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
      className={classNames(
        "font-medium tracking-wide text-danger-500 text-xs mt-2 ml-1 transition-opacity duration-300",
        error ? "opacity-100" : "opacity-0",
        className
      )}
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
  const error = resolveFormFieldError(props.props);

  return (
    <div className={className}>
      {label && (
        <FieldLabel htmlFor={id} required={required} className={labelClassName}>
          {label}
        </FieldLabel>
      )}
      {props.children}
      {<FieldErrorText error={error} className={errorClassName} />}
    </div>
  );
};

export default FormField;
