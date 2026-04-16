import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs transition-colors placeholder:text-placeholder-foreground focus-visible:ring-1 focus-visible:border-primary-500 focus-visible:outline-hidden focus-visible:ring-primary-500 md:text-sm disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
Textarea.displayName = "Textarea";

export { Textarea };
