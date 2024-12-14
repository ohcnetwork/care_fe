import * as React from "react";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";

import { InputErrors } from "./errors";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  errors?: string[]; // Add errors prop
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, required, errors, ...props }, ref) => {
    return (
      <div>
        {label && (
          <Label className="mb-2">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            errors?.length && "border-red-500 dark:border-red-500",
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
Textarea.displayName = "Textarea";

export { Textarea };
