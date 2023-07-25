import { FieldError } from "../FieldValidators";
import { FormFieldBaseProps } from "./Utils";
import { classNames } from "../../../Utils/utils";

type LabelProps = {
  id?: string | undefined;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string | undefined;
  noPadding?: boolean;
};

export const FieldLabel = (props: LabelProps) => {
  return (
    <label
      id={props.id}
      className={classNames(
        "block text-base font-normal text-gray-900",
        !props.noPadding && "mb-2",
        props.className
      )}
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
        "error-text ml-1 mt-2 text-xs font-medium tracking-wide text-danger-500 transition-opacity duration-300",
        error ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {error}
    </span>
  );
};

const FormField = ({
  field,
  children,
}: {
  field?: FormFieldBaseProps<any>;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={field?.className}>
      <div className="flex items-center justify-between">
        {field?.label && (
          <FieldLabel
            htmlFor={field?.id}
            required={field?.required}
            className={field?.labelClassName}
          >
            {field?.label}
          </FieldLabel>
        )}
        {field?.labelSuffix && (
          <span className="mb-2 text-xs">{field?.labelSuffix}</span>
        )}
      </div>
      <div className={field?.className}>{children}</div>
      <FieldErrorText error={field?.error} className={field?.errorClassName} />
    </div>
  );
};

export default FormField;
