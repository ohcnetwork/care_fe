// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name checkbox
 * @description A control that allows the user to toggle between checked and not checked.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { CheckIcon, MinusIcon } from "lucide-react";
import { useState } from "react";

const checkboxVariants = cva(
  "peer relative flex shrink-0 items-center justify-center rounded-[4px] border border-input shadow-xs transition-shadow outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
  {
    variants: {
      size: {
        default: "size-5 [&>span>svg]:size-4",
        md: "size-4 [&>span>svg]:size-3.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Checkbox({
  className,
  size,
  checked,
  defaultChecked,
  indeterminate,
  onCheckedChange,
  ...props
}: Omit<CheckboxPrimitive.Root.Props, "checked" | "defaultChecked"> &
  VariantProps<typeof checkboxVariants> & {
    checked?: CheckedState;
    defaultChecked?: CheckedState;
  }) {
  const [defaultIndeterminate, setDefaultIndeterminate] = useState(
    defaultChecked === "indeterminate",
  );
  const isIndeterminate =
    indeterminate ??
    (checked === undefined
      ? defaultIndeterminate
      : checked === "indeterminate");
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        checkboxVariants({ size }),
        "data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground",
        className,
      )}
      checked={checked === "indeterminate" ? false : checked}
      defaultChecked={
        defaultChecked === "indeterminate" ? false : defaultChecked
      }
      indeterminate={isIndeterminate}
      onCheckedChange={(nextChecked, eventDetails) => {
        onCheckedChange?.(nextChecked, eventDetails);
        if (!eventDetails.isCanceled) {
          setDefaultIndeterminate(false);
        }
      }}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        {isIndeterminate ? <MinusIcon /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export type CheckedState = boolean | "indeterminate";

export { Checkbox, checkboxVariants };
