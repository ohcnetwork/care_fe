import { useEffect } from "react";
import { classNames } from "../../../Utils/utils";
import { FieldError } from "../FieldValidators";
import { FormFieldBaseProps } from "./Utils";
import { useState } from "react";
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
        "block text-base font-normal text-secondary-900",
        !props.noPadding && "mb-2",
        props.className,
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

export const FieldErrorText = (props: ErrorProps) => {
  return (
    <span
      className={classNames(
        "error-text ml-1 mt-2 text-xs font-medium tracking-wide text-danger-500 transition-opacity duration-300",
        props.error ? "opacity-100" : "opacity-0",
        props.className,
      )}
    >
      {props.error}
    </span>
  );
};

const FormField = ({
  field,
  ...props
}: {
  field?: FormFieldBaseProps<any>;
  children: React.ReactNode;
}) => {
  const [phhelp, setPhhelp] = useState(false);

  useEffect(() => {
    if ((field && field?.help == undefined) || (field && !("help" in field))) {
      setPhhelp(true);
    } else if (field?.help == false) {
      setPhhelp(false);
    }
  }, []);

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
        {field?.labelSuffix && phhelp && (
          <span className="mb-2 text-xs">{field.labelSuffix}</span>
        )}
      </div>
      <div className={field?.className}>{props.children}</div>
      <FieldErrorText error={field?.error} className={field?.errorClassName} />
    </div>
  );
};

export default FormField;
