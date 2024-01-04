import FormField from "./FormField";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";

type TextAreaFormFieldProps = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  rows?: number;
  // prefixIcon?: React.ReactNode;
  // suffixIcon?: React.ReactNode;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
};

const TextAreaFormField = ({ rows = 3, ...props }: TextAreaFormFieldProps) => {
  const field = useFormFieldPropsResolver(props as any);
  return (
    <FormField field={field}>
      <textarea
        id={field.id}
        disabled={field.disabled}
        name={field.name}
        value={field.value}
        required={field.required}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={props.placeholder}
        rows={rows}
        className={`cui-input-base resize-none ${
          field.error && "border-danger-500"
        }`}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      />
    </FormField>
  );
};

export default TextAreaFormField;
