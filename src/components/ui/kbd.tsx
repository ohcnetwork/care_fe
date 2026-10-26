/**
 * @name kbd
 * @description Used to display textual user input from keyboard.
 * @dependencies class-variance-authority
 * @type registry:ui
 */
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const kbdVariants = cva(
  "border border-b-2 in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-foreground dark:in-data-[slot=tooltip-content]:bg-background/10 h-5 w-fit min-w-5 gap-1 rounded-sm px-1 font-sans text-xs font-medium [&_svg:not([class*='size-'])]:size-3 pointer-events-none inline-flex items-center justify-center select-none",
  {
    variants: {
      variant: {
        default:
          "bg-muted bg-radial-[at_50%_75%] from-muted-background via-soft-background to-strong-background to-90% border-strong-border text-soft-foreground dark:text-muted-foreground",
        primary:
          "bg-primary bg-radial-[at_50%_75%] from-green-500/40 via-green-500/20 to-green-500/10 to-90% border-primary-950/60 dark:border-primary-700 text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Kbd({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"kbd"> & VariantProps<typeof kbdVariants>) {
  return (
    <kbd
      data-slot="kbd"
      data-variant={variant}
      className={cn(kbdVariants({ variant }), className)}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
