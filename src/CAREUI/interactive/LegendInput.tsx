import { RefObject, useRef, useState } from "react";
import CareIcon from "../icons/CareIcon";
import { classNames } from "../../Utils/utils";

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
              "absolute flex items-center z-10 transition-all font-semibold cursor-text",
              focused || ref.current?.value
                ? "h-auto cui-input-legend"
                : "top-0 h-full",
              (!props.size || !["small", "large"].includes(props.size)) &&
                "left-4",
              props.size === "small" && "text-xs left-3",
              props.size === "large" && "left-5",
              (focused || ref.current?.value) &&
                (!props.size || props.size !== "small") &&
                "-top-2.5",
              (focused || ref.current?.value) &&
                props.size === "small" &&
                "-top-[7px]",
              props.error && "text-red-500"
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
            "w-full bg-gray-50 focus:bg-gray-100 cui-input",
            props.size === "small" && "text-xs px-3 py-2",
            (!props.size || !["small", "large"].includes(props.size)) &&
              "px-4 py-3",
            props.size === "large" && "text-lg px-5 py-4",
            props.type === "PASSWORD" && "pr-10",
            props.error && "border-red-500",
            props.className
          )}
        />
        {props.type === "PASSWORD" && (
          <button
            type="button"
            className="absolute right-0 top-0 h-full flex items-center px-3 z-10 text-xl"
            onClick={() => setShowPassword(!showPassword)}
          >
            <CareIcon
              className={`care-l-eye${showPassword ? "" : "-slash"} h-5`}
            />
          </button>
        )}
      </div>
      {props.error && (
        <div className="text-red-500 text-xs mt-1">{props.error}</div>
      )}
    </div>
  );
}
