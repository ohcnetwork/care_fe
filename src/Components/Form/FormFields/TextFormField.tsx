import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import { HTMLInputTypeAttribute, forwardRef, useState } from "react";

import CareIcon from "../../../CAREUI/icons/CareIcon";
import FormField from "./FormField";
import { classNames } from "../../../Utils/utils";

export type TextFormFieldProps = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  autoComplete?: string;
  type?: HTMLInputTypeAttribute;
  className?: string | undefined;
  inputClassName?: string | undefined;
  removeDefaultClasses?: true | undefined;
  leading?: React.ReactNode | undefined;
  trailing?: React.ReactNode | undefined;
  leadingFocused?: React.ReactNode | undefined;
  trailingFocused?: React.ReactNode | undefined;
  trailingPadding?: string | undefined;
  leadingPadding?: string | undefined;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  suggestions?: string[];
};

const TextFormField = forwardRef((props: TextFormFieldProps, ref) => {
  const field = useFormFieldPropsResolver(props);
  const { leading, trailing } = props;
  const leadingFocused = props.leadingFocused || props.leading;
  const trailingFocused = props.trailingFocused || props.trailing;
  const hasLeading = !!(leading || leadingFocused);
  const hasTrailing = !!(trailing || trailingFocused);
  const hasIcon = hasLeading || hasTrailing;
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordFieldType = () => {
    return showPassword ? "text" : "password";
  };

  let child = (
    <input
      ref={ref as any}
      id={field.id}
      className={classNames(
        "cui-input-base peer",
        hasLeading && (props.leadingPadding || "pl-10"),
        hasTrailing && (props.trailingPadding || "pr-10"),
        field.error && "border-danger-500",
        props.inputClassName,
      )}
      disabled={field.disabled}
      type={props.type === "password" ? getPasswordFieldType() : props.type}
      placeholder={props.placeholder}
      name={field.name}
      value={field.value}
      min={props.min}
      max={props.max}
      autoComplete={props.autoComplete}
      required={field.required}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      onKeyDown={props.onKeyDown}
      step={props.step}
    />
  );

  if (props.type === "password") {
    child = (
      <div className="relative">
        {child}
        <button
          type="button"
          className="z-5 absolute right-0 top-0 flex h-full items-center px-3 text-xl"
          onClick={() => setShowPassword(!showPassword)}
        >
          <CareIcon icon={showPassword ? "l-eye" : "l-eye-slash"} />
        </button>
      </div>
    );
  }

  if (hasIcon) {
    const _leading =
      leading === leadingFocused ? (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          {leading}
        </div>
      ) : (
        <>
          <div className="absolute inset-y-0 left-0 flex translate-y-0 items-center pl-3 opacity-100 transition-all delay-300 duration-500 ease-in-out peer-focus:translate-y-1 peer-focus:opacity-0">
            {leading}
          </div>
          <div className="absolute inset-y-0 left-0 flex -translate-y-1 items-center pl-3 opacity-0 transition-all delay-300 duration-500 ease-in-out peer-focus:translate-y-0 peer-focus:opacity-100">
            {leadingFocused}
          </div>
        </>
      );
    const _trailing =
      trailing === trailingFocused ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {trailing}
        </div>
      ) : (
        <>
          <div className="absolute inset-y-0 right-0 flex translate-y-0 items-center pr-3 opacity-100 transition-all delay-300 duration-500 ease-in-out peer-focus:translate-y-1 peer-focus:opacity-0">
            {trailing}
          </div>
          <div className="absolute inset-y-0 right-0 flex -translate-y-1 items-center pr-3 opacity-0 transition-all delay-300 duration-500 ease-in-out peer-focus:translate-y-0 peer-focus:opacity-100">
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

  if (
    props.suggestions?.length &&
    !props.suggestions.includes(`${field.value}`)
  ) {
    child = (
      <div className="flex flex-col gap-2">
        {child}
        <ul className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
          {props.suggestions.map((suggestion) => (
            <li
              key={suggestion}
              className="cursor-pointer rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-gray-500 transition-all duration-200 ease-in-out hover:bg-gray-100"
              onClick={() => field.handleChange(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <FormField field={field}>{child}</FormField>;
});

export default TextFormField;
