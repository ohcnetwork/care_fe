import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base shadow-xs transition-colors file:border-0 file:bg-transparent focus:ring-primary-500 focus:border-primary-500 file:text-sm file:font-medium file:text-gray-950 placeholder:text-gray-500 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-gray-800 dark:file:text-gray-50 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300 duration-300",
        className,
      )}
      {...props}
      onFocus={(e) => {
        if (type === "date") {
          e.target.showPicker();
        }
        props.onFocus?.(e);
      }}
    />
  );
}
Input.displayName = "Input";

export { Input };
