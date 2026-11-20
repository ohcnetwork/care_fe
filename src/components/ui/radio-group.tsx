// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name radio-group
 * @description A set of checkable buttons where only one can be checked at a time.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";

interface RadioGroupProps<Value extends string = string> extends Omit<
  RadioGroupPrimitive.Props<Value>,
  "onValueChange" | "value" | "defaultValue"
> {
  value?: Value | "";
  defaultValue?: Value | "";
  onValueChange?(
    value: Value,
    eventDetails?: RadioGroupPrimitive.ChangeEventDetails,
  ): void;
}

function RadioGroup<Value extends string = string>({
  className,
  onValueChange,
  ...props
}: RadioGroupProps<Value>) {
  return (
    <RadioGroupPrimitive<Value | "">
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      onValueChange={(value, eventDetails) =>
        onValueChange?.(value as Value, eventDetails)
      }
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "border-input dark:bg-input/30 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:aria-invalid:border-destructive/50 group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:ring-3",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="bg-primary-foreground absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
