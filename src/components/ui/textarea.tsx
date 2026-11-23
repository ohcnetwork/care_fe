/**
 * @name textarea
 * @description Displays a form textarea or a component that looks like a textarea.
 * @dependencies
 * @registryDependencies use-auto-space
 * @type registry:ui
 */
import * as React from "react";

import { useAutoSpace } from "@/hooks/use-auto-space";
import { cn } from "@/lib/utils";

function Textarea({
  className,
  autoSpace = false,
  onBeforeInput,
  ...props
}: React.ComponentProps<"textarea"> & { autoSpace?: boolean }) {
  const handleAutoSpace = useAutoSpace(autoSpace);
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-2.5 py-2 text-[length:var(--textarea-font-size)]/[var(--textarea-line-height)] shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 [--textarea-font-size:var(--text-base)] [--textarea-line-height:var(--text-base--line-height)] md:[--textarea-font-size:var(--text-sm)] md:[--textarea-line-height:var(--text-sm--line-height)]",
        className,
      )}
      onBeforeInput={(e) => {
        handleAutoSpace(e);
        onBeforeInput?.(e);
      }}
      {...props}
    />
  );
}

export { Textarea };
