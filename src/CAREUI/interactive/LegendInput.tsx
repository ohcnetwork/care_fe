import clsx from "clsx";
import { RefObject, useEffect, useRef, useState } from "react";

type InputProps = {
  name: string;
  type: "TEXT" | "PASSWORD" | "EMAIL" | "NUMBER";
  ref?: RefObject<HTMLInputElement>;
  label?: string;
  legend?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
  onKeyUp?: (e: any) => void;
  onKeyDown?: (e: any) => void;
  onKeyPress?: (e: any) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  outerClassName?: string;
  size?: "small" | "medium" | "large";
  autoComplete?: string;
};

export default function LegendInput(props: InputProps) {
  /**
   * Useful for small input forms. Should only be used in special cases.
   */
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = props.ref || inputRef;
  const legendRef = useRef<HTMLLabelElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    console.log(document.activeElement);
  }, [document.activeElement]);

  return (
    <div className={clsx([props.outerClassName])}>
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
            htmlFor={props.name}
            ref={legendRef}
            className={clsx({
              "absolute flex items-center z-10 transition-all font-semibold cursor-text":
                true,
              "top-0 h-full": !(focused || ref.current?.value),
              "h-auto cui-input-legend": focused || ref.current?.value,
              "left-4": !props.size || !["small", "large"].includes(props.size),
              "text-xs left-3": props.size === "small",
              "left-5": props.size === "large",
              "-top-2.5":
                (focused || ref.current?.value) &&
                (!props.size || props.size !== "small"),
              "-top-[7px]":
                (focused || ref.current?.value) && props.size === "small",
              "text-red-500": props.error,
            })}
          >
            {props.legend}
          </label>
        )}

        <input
          ref={ref}
          type={
            props.type === "PASSWORD" && !showPassword ? "password" : "text"
          }
          name={props.name}
          id={props.name}
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
          className={clsx([
            "w-full bg-gray-50 focus:bg-gray-100 cui-input",
            { "text-xs px-3 py-2": props.size === "small" },
            {
              "px-4 py-3":
                !props.size || !["small", "large"].includes(props.size),
            },
            { "text-lg px-5 py-4": props.size === "large" },
            { "pr-10": props.type === "PASSWORD" },
            { "border-red-500": props.error },
            props.className,
          ])}
        />
        {props.type === "PASSWORD" && (
          <button
            type="button"
            className="absolute right-0 top-0 h-full flex items-center px-3 z-10 text-xl"
            onClick={() => setShowPassword(!showPassword)}
          >
            <i className={`uil uil-eye${showPassword ? "" : "-slash"}`} />
          </button>
        )}
      </div>
    </div>
  );
}
