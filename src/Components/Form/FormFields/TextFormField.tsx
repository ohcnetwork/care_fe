import React from "react";
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
  type?: "email" | "password" | "search" | "text" | "number";
  className?: string | undefined;
  removeDefaultClasses?: true | undefined;
  leading?: React.ReactNode | undefined;
  trailing?: React.ReactNode | undefined;
  leadingFocused?: React.ReactNode | undefined;
  trailingFocused?: React.ReactNode | undefined;
};

const TextFormField = React.forwardRef((props: TextFormFieldProps, ref) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);
  const borderColor = error ? "border-red-500" : "border-gray-200";

  const { leading, trailing } = props;
  const leadingFocused = props.leadingFocused || props.leading;
  const trailingFocused = props.trailingFocused || props.trailing;
  const hasIcon = !!(leading || trailing || leadingFocused || trailingFocused);
  const padding = `py-3 ${hasIcon ? "px-8" : "px-3"}`;

  let child = (
    <input
      ref={ref as any}
      id={props.id}
      className={
        props.removeDefaultClasses
          ? props.className
          : `peer text-sm block ${padding} w-full rounded placeholder:text-gray-500 bg-gray-200 focus:bg-white border-2 focus:border-primary-400 outline-none ring-0 transition-all duration-200 ease-in-out ${borderColor} ${props.className}`
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
    const _leading =
      leading === leadingFocused ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {leading}
        </div>
      ) : (
        <>
          <div className="opacity-100 peer-focus:opacity-0 translate-y-0 peer-focus:translate-y-1 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 transition-all duration-500 delay-300 ease-in-out">
            {leading}
          </div>
          <div className="opacity-0 peer-focus:opacity-100 -translate-y-1 peer-focus:translate-y-0 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 transition-all duration-500 delay-300 ease-in-out">
            {leadingFocused}
          </div>
        </>
      );
    const _trailing =
      trailing === trailingFocused ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {trailing}
        </div>
      ) : (
        <>
          <div className="opacity-100 peer-focus:opacity-0 translate-y-0 peer-focus:translate-y-1 pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 transition-all duration-500 delay-300 ease-in-out">
            {trailing}
          </div>
          <div className="opacity-0 peer-focus:opacity-100 -translate-y-1 peer-focus:translate-y-0 pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 transition-all duration-500 delay-300 ease-in-out">
            {trailingFocused}
          </div>
        </>
      );

    child = (
      <div className="relative">
        {(leading || leadingFocused) && _leading}
        {child}
        {(trailing || trailingFocused) && _trailing}
      </div>
    );
  }

  return <FormField props={props}>{child}</FormField>;
});

export default TextFormField;
