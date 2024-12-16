import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border border-gray-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 dark:border-gray-800 dark:focus:ring-gray-300",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-gray-50 shadow hover:bg-gray-900/80 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/80",
        primary:
          "bg-primary-700 text-white shadow hover:bg-primary-700/90 dark:bg-primary-100 dark:text-primary-900 dark:hover:bg-primary-100/90",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80",
        destructive:
          "border-transparent bg-red-500 text-gray-50 shadow hover:bg-red-500/80 dark:bg-red-900 dark:text-gray-50 dark:hover:bg-red-900/80",
        alert: "border-alert-300 bg-alert-100 text-alert-900",
        danger: "border-danger-300 bg-danger-100 text-danger-900",
        warning:
          "border-transparent bg-yellow-400 text-gray-900 shadow hover:bg-yellow-500 dark:bg-yellow-400 dark:text-gray-900 dark:hover:bg-yellow-500",
        outline: "text-gray-950 dark:text-gray-50",
        custom: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      role="status"
      aria-label={props.children?.toString()}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
