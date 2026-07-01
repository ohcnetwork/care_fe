import * as React from "react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange"
> {
  /** Text shown in the field. */
  value: string;
  /** Fired on every keystroke in the field. */
  onValueChange: (value: string) => void;
  /** Whether the dropdown is open. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dropdown content — suggestion rows, a command list, sub-editors, etc. */
  children: React.ReactNode;
  /** Rendered inside the field, before the input (e.g. a bound-type icon). */
  startAdornment?: React.ReactNode;
  /** Rendered inside the field, after the input (e.g. a unit badge). */
  endAdornment?: React.ReactNode;
  contentClassName?: string;
  align?: "start" | "center" | "end";
  /** Lets the caller drive focus (e.g. refocus after selecting an option). */
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * A native text input that anchors a dropdown directly beneath it — the field
 * itself is where you type, and the dropdown only presents suggestions (the
 * "Dosage Dropdown" pattern). Unlike a button-triggered combobox, focus stays
 * in the input across open/close, so typing is never interrupted.
 *
 * Presentational only: the caller owns the value, the open state, and whatever
 * the dropdown renders.
 */
export function ComboboxInput({
  value,
  onValueChange,
  open,
  onOpenChange,
  children,
  startAdornment,
  endAdornment,
  contentClassName,
  align = "start",
  className,
  disabled,
  inputRef: externalRef,
  ...inputProps
}: ComboboxInputProps) {
  const internalRef = React.useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;

  return (
    <Popover open={open && !disabled} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          {startAdornment}
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={disabled}
            className={className}
            {...inputProps}
          />
          {endAdornment}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "w-[var(--radix-popover-trigger-width)] min-w-56 p-0",
          contentClassName,
        )}
        // Keep the caret in the field when the dropdown opens, so the user can
        // keep typing instead of having focus yanked into the list.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

export default ComboboxInput;
