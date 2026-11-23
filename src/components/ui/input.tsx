/**
 * @name input
 * @description A text input component for forms and user data entry with built-in styling and accessibility features.
 * @dependencies none
 * @registryDependencies use-auto-space
 * @type registry:ui
 */
import * as React from "react";

import { useAutoSpace } from "@/hooks/use-auto-space";
import { cn } from "@/lib/utils";

/** Input types where auto-spacing must never run. */
const SKIP_TYPES = new Set([
  "email",
  "number",
  "url",
  "password",
  "search",
  "tel",
]);

function Input({
  className,
  type,
  inputMode,
  onBeforeInput,
  onClick,
  onWheel,
  autoSpace = false,
  ...props
}: React.ComponentProps<"input"> & {
  /**
   * When `true`, automatically inserts a space after punctuation (. , ! ? ; :)
   * when the user types the next word without one.
   * Automatically disabled for email, number, url, password, search, and tel inputs.
   */
  autoSpace?: boolean;
}) {
  const handleBeforeInput = useAutoSpace(
    autoSpace && !SKIP_TYPES.has(type ?? ""),
  );

  return (
    <input
      type={type}
      autoComplete="off"
      data-slot="input"
      className={cn(
        // Responsive defaults stay overridable by callers such as icon inputs.
        "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 file:text-foreground placeholder:text-placeholder-foreground h-[var(--input-height)] [--input-height:--spacing(12)] md:[--input-height:--spacing(10)] w-full min-w-0 rounded-md border bg-transparent px-[var(--input-padding-x)] [--input-padding-x:--spacing(3)] md:[--input-padding-x:--spacing(2.5)] py-1 text-[length:var(--input-font-size)] [--input-font-size:var(--text-base)] md:[--input-font-size:var(--text-sm)] shadow-2xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3",
        className,
      )}
      inputMode={inputMode}
      onBeforeInput={(event) => {
        onBeforeInput?.(event);
        if (event.defaultPrevented) return;
        if (
          type === "number" &&
          inputMode === "numeric" &&
          (event.nativeEvent as InputEvent).data === "."
        ) {
          event.preventDefault();
          return;
        }
        handleBeforeInput(event);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (type === "date" && !event.defaultPrevented)
          event.currentTarget.showPicker?.();
      }}
      onWheel={(event) => {
        if (type === "number") event.currentTarget.blur();
        onWheel?.(event);
      }}
      {...props}
    />
  );
}

export { Input };
