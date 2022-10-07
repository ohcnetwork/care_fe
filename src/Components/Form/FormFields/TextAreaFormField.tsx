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

  const bgColor = error ? "bg-red-50" : "bg-gray-200";
  const borderColor = error ? "border-red-500" : "border-gray-200";

  return (
    <FormField props={props}>
      <textarea
        id={props.id}
        className={`resize-none w-full px-4 py-3 rounded ${bgColor} ${borderColor} focus:border-primary-400 border-2 outline-none ring-0 focus:bg-white transition-all duration-200 ease-in`}
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
