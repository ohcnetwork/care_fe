import * as React from "react";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";

import { InputErrors } from "./errors";

interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  errors?: string[];
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, required, errors, ...props }, ref) => {
    return (
      <div>
        {label && (
          <Label className="mb-2">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-950 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-gray-800 dark:file:text-gray-50 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300",
            errors?.length
              ? "border-red-500 dark:border-red-500"
              : "border-gray-200 dark:border-gray-800",
            className,
          )}
          ref={ref}
          {...props}
        />
        <InputErrors errors={errors} />
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
