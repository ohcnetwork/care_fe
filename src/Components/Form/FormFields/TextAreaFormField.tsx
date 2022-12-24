import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

type TextAreaFormFieldProps = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  rows?: number;
  // prefixIcon?: React.ReactNode;
  // suffixIcon?: React.ReactNode;
};

const TextAreaFormField = ({ rows = 3, ...props }: TextAreaFormFieldProps) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);

  return (
    <FormField props={props}>
      <textarea
        id={props.id}
        className={`cui-input-base resize-none ${error && "border-danger-500"}`}
        disabled={props.disabled}
        rows={rows}
        placeholder={props.placeholder}
        name={props.name}
        value={props.value}
        required={props.required}
        onChange={(event) => {
          event.preventDefault();
          handleChange(event.target);
        }}
      />
    </FormField>
  );
};

export default TextAreaFormField;
