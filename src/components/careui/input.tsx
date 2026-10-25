// CareUI registry source: ohcnetwork/careui (d5cff874). Semantic color utilities
// are namespaced cui-* to coexist with CARE 3.1's existing theme.
/**
 * @name input
 * @description A text input component for forms and user data entry with built-in styling and accessibility features.
 * @dependencies none
 * @type registry:ui
 */
import * as React from "react";

import { cn } from "@/lib/utils";

// Use CareUI's input presentation with CARE's native input event contract.
// The optional prose auto-spacing behavior is not enabled for clinical entry.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      autoComplete="off"
      data-slot="input"
      className={cn(
        "dark:bg-cui-input/30 border-cui-input focus-visible:border-cui-ring focus-visible:ring-cui-ring/50 aria-invalid:ring-cui-destructive/20 dark:aria-invalid:ring-cui-destructive/40 aria-invalid:border-cui-destructive dark:aria-invalid:border-cui-destructive/50 file:text-cui-foreground placeholder:text-cui-placeholder-foreground h-12 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-2xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:h-10 md:px-2.5 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
