// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name separator
 * @description Visually or semantically separates content.
 * @dependencies @base-ui/react class-variance-authority
 * @type registry:ui
 */
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const separatorVariants = cva(
  "shrink-0 data-horizontal:w-full data-vertical:self-stretch",
  {
    variants: {
      variant: {
        solid: "bg-border data-horizontal:h-px data-vertical:w-px",
        dashed:
          "border-border border-dashed data-horizontal:h-0 data-horizontal:border-t data-vertical:w-0 data-vertical:border-l",
        inset:
          "border-border border-t data-horizontal:h-0 data-horizontal:w-full data-horizontal:[box-shadow:0_1px_0_0_var(--background)] data-vertical:w-0 data-vertical:border-l data-vertical:[box-shadow:1px_0_0_0_var(--background)]",
        dotted:
          "[background:radial-gradient(circle,var(--border)_1px,transparent_1px)_0_0/8px_8px] data-horizontal:h-2 data-vertical:w-2",
      },
    },
    defaultVariants: {
      variant: "solid",
    },
  },
);

function Separator({
  className,
  orientation = "horizontal",
  variant,
  decorative = true,
  ...props
}: SeparatorPrimitive.Props &
  VariantProps<typeof separatorVariants> & { decorative?: boolean }) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      aria-hidden={decorative || undefined}
      className={cn(separatorVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Separator, separatorVariants };
