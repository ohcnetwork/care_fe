// CareUI registry source: ohcnetwork/careui (d5cff874). Semantic color utilities
// are namespaced cui-* to coexist with CARE 3.1's existing theme.
/**
 * @name textarea
 * @description Displays a form textarea or a component that looks like a textarea.
 * @dependencies
 * @type registry:ui
 */
import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-cui-input placeholder:text-cui-muted-foreground focus-visible:border-cui-ring focus-visible:ring-cui-ring/50 aria-invalid:border-cui-destructive aria-invalid:ring-cui-destructive/20 dark:bg-cui-input/30 dark:aria-invalid:border-cui-destructive/50 dark:aria-invalid:ring-cui-destructive/40 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
