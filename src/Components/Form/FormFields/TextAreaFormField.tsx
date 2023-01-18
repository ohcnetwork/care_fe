import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "./Utils";

type TextAreaFormFieldProps = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  rows?: number;
  // prefixIcon?: React.ReactNode;
  // suffixIcon?: React.ReactNode;
};

const TextAreaFormField = ({ rows = 3, ...props }: TextAreaFormFieldProps) => {
  return (
    <FormField props={props}>
      <textarea
        id={props.id}
        className={`cui-input-base resize-none ${
          props.error && "border-danger-500"
        }`}
        disabled={props.disabled}
        rows={rows}
        placeholder={props.placeholder}
        name={props.name}
        value={props.value}
        required={props.required}
        onChange={(event) =>
          resolveFormFieldChangeEventHandler(props)(event.target.value)
        }
      />
    </FormField>
  );
};

export default TextAreaFormField;
