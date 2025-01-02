import { RefObject, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

type InputProps = {
  id?: string;
  name: string;
  type: "TEXT" | "PASSWORD" | "EMAIL" | "NUMBER";
  ref?: RefObject<HTMLInputElement>;
  label?: string;
  legend?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
  outerClassName?: string;
  size?: "small" | "medium" | "large";
  autoComplete?: string;
};

export default function LegendInput(props: InputProps) {
  /**
   * Useful for small input forms. Should only be used in special cases.
   */
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = props.ref || inputRef;

  const legendRef = useRef<HTMLLabelElement>(null);
  const [focused, setFocused] = useState(false);

  const getAutofill = (element: Element) => {
    let hasValue;
    try {
      hasValue = element.matches(":autofill");
    } catch (err) {
      try {
        hasValue = element.matches(":-webkit-autofill");
      } catch (er) {
        hasValue = false;
      }
    }
    hasValue && setFocused(true);
  };

  const detectAutofill = (element: Element) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getAutofill(element));
      }, 600);
    });
  };

  const testAutoFill = async (element: Element) => {
    await detectAutofill(element);
  };

  useEffect(() => {
    ref.current && testAutoFill(ref.current);
  }, [ref.current]);
  return (
    <div className={props.outerClassName}>
      {props.label && (
        <label
          htmlFor={props.name}
          className={props.required ? "cui-label-required" : ""}
        >
          {props.label}
        </label>
      )}
      <div className="relative">
        {props.legend && (
          <label
            htmlFor={props.id || props.name}
            ref={legendRef}
            className={classNames(
              "absolute z-10 flex cursor-text items-center font-semibold transition-all",
              focused || ref.current?.value
                ? "cui-input-legend h-auto"
                : "top-0 h-full",
              (!props.size || !["small", "large"].includes(props.size)) &&
                "left-4",
              props.size === "small" && "left-3 text-xs",
              props.size === "large" && "left-5",
              (focused || ref.current?.value) &&
                (!props.size || props.size !== "small") &&
                "-top-2.5",
              (focused || ref.current?.value) &&
                props.size === "small" &&
                "-top-[7px]",
              props.error && "text-red-500",
            )}
          >
            {props.legend}
          </label>
        )}

        <input
          ref={ref}
          type={props.type === "PASSWORD" && showPassword ? "text" : props.type}
          name={props.name}
          id={props.id || props.name}
          placeholder={props.placeholder}
          value={props.value}
          onChange={props.onChange}
          onFocus={(e) => {
            props.onFocus && props.onFocus(e);
            setFocused(true);
          }}
          onBlur={(e) => {
            props.onBlur && props.onBlur(e);
            setFocused(false);
          }}
          onKeyUp={props.onKeyUp}
          onKeyDown={props.onKeyDown}
          onKeyPress={props.onKeyPress}
          disabled={props.disabled}
          required={props.required}
          autoComplete={props.autoComplete}
          className={classNames(
            "cui-input w-full rounded-md border-2 border-secondary-300 border-transparent bg-secondary-50 shadow-sm focus:border-2 focus:border-primary-500 focus:bg-secondary-100 focus:outline-none focus:ring-0",
            props.size === "small" && "px-3 py-2 text-xs",
            (!props.size || !["small", "large"].includes(props.size)) &&
              "px-4 py-3",
            props.size === "large" && "px-5 py-4 text-lg",
            props.type === "PASSWORD" && "pr-10",
            props.error && "border-red-500",
            props.className,
          )}
        />
        {props.type === "PASSWORD" && (
          <button
            type="button"
            className="absolute right-0 top-0 z-10 flex h-full items-center px-3 text-xl"
            onClick={() => setShowPassword(!showPassword)}
          >
            <CareIcon
              icon={showPassword ? "l-eye" : "l-eye-slash"}
              className="text-lg"
            />
          </button>
        )}
      </div>
      {!!props.error && (
        <div className="mt-1 text-xs text-red-500">{t(props.error)}</div>
      )}
    </div>
  );
}
