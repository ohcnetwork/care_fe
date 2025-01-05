import * as React from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const getPasswordFieldType = () => {
      return showPassword ? "text" : "password";
    };

    return (
      <div className="relative">
        <input
          type={type === "password" ? getPasswordFieldType() : type}
          className={cn(
            "flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-950 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-gray-800 dark:file:text-gray-50 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300",
            className,
          )}
          ref={ref}
          {...props}
          onFocus={(e) => {
            if (type === "date" || type === "time") {
              e.target.showPicker();
            }
            if (props.onFocus) {
              props.onFocus(e);
            }
          }}
          onBlur={props.onBlur}
        />
        {type === "password" && (
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            <CareIcon icon={showPassword ? "l-eye" : "l-eye-slash"} />
          </button>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
