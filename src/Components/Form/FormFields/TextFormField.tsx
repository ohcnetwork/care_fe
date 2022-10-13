import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

type TextFormFieldProps = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  autoComplete?: string;
  type?: "email" | "password" | "search" | "text";
  // prefixIcon?: React.ReactNode;
  // suffixIcon?: React.ReactNode;
};

const TextFormField = (props: TextFormFieldProps) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);

  const bgColor = error ? "bg-red-50" : "bg-gray-200";
  const borderColor = error ? "border-red-500" : "border-gray-200";

  return (
    <FormField props={props}>
      <input
        id={props.id}
        className={`text-sm w-full px-4 py-3 rounded placeholder:text-gray-500 ${bgColor} focus:bg-white ${borderColor} focus:border-primary-400 border-2 outline-none ring-0 transition-all duration-200 ease-in`}
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
