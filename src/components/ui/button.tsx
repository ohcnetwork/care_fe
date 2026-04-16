import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background shadow-sm hover:bg-foreground/90",
        destructive: "bg-red-500 text-white shadow-xs hover:bg-red-500/90",
        outline:
          "border border-stronger-border bg-background shadow-sm hover:bg-muted-background hover:text-foreground",
        primary: "bg-primary-700 text-white shadow-sm hover:bg-primary-700/90",
        secondary:
          "bg-muted-background text-foreground shadow-xs hover:bg-muted-background/80",
        ghost: "hover:bg-muted-background hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        outline_primary:
          "border border-primary-700 text-primary-700 bg-background shadow-xs hover:bg-primary-700 hover:text-white",
        primary_gradient:
          "text-white border border-primary-900 rounded-lg font-medium relative overflow-hidden bg-linear-to-b from-primary-700 to-primary-800 hover:from-primary-800 hover:to-primary-900 shadow-lg",
        white:
          "bg-background border border-secondary-400 text-foreground shadow-xs hover:bg-muted-background hover:text-foreground",
        warning:
          "bg-warning-100 text-warning-900 border border-warning-300 shadow-xs hover:bg-warning-100/80",
        alert:
          "bg-alert-100 text-alert-900 border border-alert-300 shadow-xs hover:bg-alert-100/80",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 rounded-md px-2 text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-9 rounded-md px-4 text-sm",
        lg: "h-10 rounded-md px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonVariant =
  | "primary"
  | "outline"
  | "secondary"
  | "destructive"
  | "primary_gradient"
  | "ghost"
  | "link"
  | "white"
  | "alert"
  | "warning"
  | "outline_primary";

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
Button.displayName = "Button";

export { Button, buttonVariants };
