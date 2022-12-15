import { classNames } from "../../../Utils/utils";
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
        className={classNames(
          "shadow-none text-sm block py-3 px-4 w-full rounded bg-white disabled:bg-secondary-100 text-secondary-900 disabled:text-secondary-400 placeholder:text-secondary-400 border focus:border-primary-400 invalid:border-danger-500 outline-none ring-0 focus:ring-1 ring-primary-400 transition-all duration-200 ease-in-out resize-none",
          error ? "border-danger-500" : "border-secondary-300"
        )}
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
