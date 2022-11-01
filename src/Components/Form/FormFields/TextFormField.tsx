import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

export type TextFormFieldProps = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  autoComplete?: string;
  type?: "email" | "password" | "search" | "text";
  className?: string | undefined;
  removeDefaultClasses?: true | undefined;
  leading?: React.ReactNode | undefined;
  trailing?: React.ReactNode | undefined;
};

const TextFormField = (props: TextFormFieldProps) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);

  const bgColor = error ? "bg-red-50" : "bg-gray-200";
  const borderColor = error ? "border-red-500" : "border-gray-200";

  const { leading, trailing } = props;
  const hasIcon = !!(leading || trailing);
  const padding = hasIcon && `${leading && "pl-8"} ${trailing && "pr-8"}`;

  let child = (
    <input
      id={props.id}
      className={
        props.removeDefaultClasses
          ? props.className
          : `text-sm block py-3 px-4 w-full rounded placeholder:text-gray-500 focus:bg-white border-2 focus:border-primary-400 outline-none ring-0 transition-all duration-200 ease-in-out ${bgColor} ${borderColor} ${props.className} ${padding}`
      }
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
  );

  if (hasIcon) {
    child = (
      <div className="relative">
        {leading && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {leading}
          </div>
        )}
        {child}
        {trailing && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </div>
        )}
      </div>
    );
  }

  return <FormField props={props}>{child}</FormField>;
};

export default TextFormField;
