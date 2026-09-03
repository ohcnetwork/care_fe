import { ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import useBreakpoints from "@/hooks/useBreakpoints";

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
  /**
   * On small screens, present the dropdown as a bottom-sheet drawer instead of
   * an anchored popover (matches the valueset/medication search). The field
   * becomes a summary button and the typing input moves into the drawer — same
   * pattern as {@link ValueSetSelect}. Opt-in: narrow inline fields (e.g. the
   * quantity picker) keep the popover. Off by default.
   */
  drawerOnMobile?: boolean;
  /** Accessible title for the mobile drawer. */
  title?: string;
  /** Replaces the default summary button that opens the mobile drawer. */
  mobileTrigger?: React.ReactNode;
}

/**
 * A native text input that anchors a dropdown directly beneath it — the field
 * itself is where you type, and the dropdown only presents suggestions (the
 * "Dosage Dropdown" pattern). Unlike a button-triggered combobox, focus stays
 * in the input across open/close, so typing is never interrupted.
 *
 * With {@link ComboboxInputProps.drawerOnMobile}, small screens swap the popover
 * for a bottom-sheet drawer so the same dropdown content (wide calendars, range
 * editors) gets full width instead of a cramped, keyboard-obscured popover.
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
  drawerOnMobile = false,
  title,
  mobileTrigger,
  ...inputProps
}: ComboboxInputProps) {
  const internalRef = React.useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;
  const isMobile = useBreakpoints({ default: true, sm: false });
  const useDrawer = drawerOnMobile && isMobile;

  // Move focus into the field once the drawer has animated in (it isn't the
  // trigger on mobile, so it can't inherit focus on open).
  React.useEffect(() => {
    if (useDrawer && open && !disabled) {
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [useDrawer, open, disabled, inputRef]);

  // The typing surface — identical in the popover and the drawer.
  const field = (
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
  );

  if (useDrawer) {
    return (
      <Drawer open={open && !disabled} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          {mobileTrigger ?? (
            <Button
              type="button"
              variant="white"
              role="combobox"
              disabled={disabled}
              aria-label={inputProps["aria-label"]}
              aria-invalid={inputProps["aria-invalid"]}
              className={cn(
                "flex h-9 w-full items-center justify-between gap-2 border-gray-300 font-normal shadow-xs",
                !value && "text-muted-foreground",
                inputProps["aria-invalid"] && "border-red-500",
                className,
              )}
            >
              <span className="truncate">
                {value || inputProps.placeholder}
              </span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle className="sr-only">
            {title ?? inputProps.placeholder ?? ""}
          </DrawerTitle>
          <div className="border-b p-3">{field}</div>
          <div className="max-h-[70vh] overflow-y-auto">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open && !disabled} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{field}</PopoverTrigger>
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
