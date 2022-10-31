import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

type Props = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  autoComplete?: string;
  type?: "email" | "password" | "search" | "text";
  // prefixIcon?: React.ReactNode;
  // suffixIcon?: React.ReactNode;
};

const TextFormField = (props: Props) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);

  const bgColor = error ? "bg-red-50" : "bg-gray-200";
  const borderColor = error ? "border-red-500" : "border-gray-200";

  return (
    <FormField props={props}>
      <input
        id={props.id}
        className={`form-input ${bgColor} ${borderColor}`}
        disabled={props.disabled}
        type={props.type || "text"}
        placeholder={props.placeholder}
        name={props.name}
        value={props.value}
        autoComplete={props.autoComplete}
        required={props.required}
        onChange={(event) => {
          event.preventDefault();
          handleChange(event.target);
        }}
      />
    </FormField>
  );
};

export default TextFormField;
