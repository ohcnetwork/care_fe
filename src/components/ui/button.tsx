import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-gray-300 aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
  {
    variants: {
      variant: {
        default:
          "bg-gray-900 text-gray-50 shadow-sm hover:bg-gray-900/90 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90",
        destructive:
          "bg-red-500 text-gray-50 shadow-xs hover:bg-red-500/90 dark:bg-red-900 dark:text-gray-50 dark:hover:bg-red-900/90",
        outline:
          "border border-gray-400 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50",
        primary:
          "bg-primary-700 text-white shadow-sm hover:bg-primary-700/90 dark:bg-primary-100 dark:text-primary-900 dark:hover:bg-primary-100/90",
        secondary:
          "bg-gray-100 text-gray-900 shadow-xs hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50",
        link: "text-gray-900 underline-offset-4 hover:underline dark:text-gray-50",
        outline_primary:
          "border border-primary-700 text-primary-700 bg-white shadow-xs hover:bg-primary-700 hover:text-white dark:border-primary-700 dark:bg-primary-700 dark:text-white",
        primary_gradient:
          "text-white border border-primary-900 rounded-lg font-medium relative overflow-hidden bg-linear-to-b from-primary-700 to-primary-800 hover:from-primary-800 hover:to-primary-900 shadow-lg",
        white:
          "bg-white border border-secondary-400 text-gray-900 shadow-xs hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80",
        warning:
          "bg-warning-100 text-warning-900 border border-warning-300 shadow-xs hover:bg-warning-100/80 dark:bg-warning-900 dark:text-warning-50 dark:hover:bg-warning-900/80",
        alert:
          "bg-alert-100 text-alert-900 border border-alert-300 shadow-xs hover:bg-alert-100/80 dark:bg-alert-900 dark:text-alert-50 dark:hover:bg-alert-900/80",
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
