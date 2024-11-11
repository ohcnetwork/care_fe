import { forwardRef } from "react";

import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";

import { classNames } from "@/Utils/utils";

export type TextAreaFormFieldProps = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  rows?: number;
  // prefixIcon?: React.ReactNode;
  // suffixIcon?: React.ReactNode;
  innerClassName?: string;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
};

const TextAreaFormField = forwardRef(
  (
    { rows = 3, ...props }: TextAreaFormFieldProps,
    ref?: React.Ref<HTMLTextAreaElement>,
  ) => {
    const field = useFormFieldPropsResolver(props);
    return (
      <FormField field={field}>
        <textarea
          id={field.id}
          ref={ref}
          disabled={field.disabled}
          name={field.name}
          value={field.value ?? ""}
          required={field.required}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={props.placeholder}
          rows={rows}
          className={classNames(
            "cui-input-base resize-none",
            field.error && "border-danger-500",
            props.innerClassName,
          )}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
        />
      </FormField>
    );
  },
);

export default TextAreaFormField;
