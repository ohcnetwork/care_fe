import { type VariantProps, cva } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-1 text-sm font-medium transition-colors gap-1.5",
  {
    variants: {
      variant: {
        primary: "border-primary-300 bg-primary-100 text-primary-900",
        secondary: "border-gray-300 bg-gray-100 text-gray-900",
        outline: "border-gray-300",
        danger: "border-red-800 bg-red-600 text-white",
        red: "border-red-300 bg-red-100 text-red-900",
        indigo: "border-indigo-300 bg-indigo-100 text-indigo-900",
        purple: "border-purple-300 bg-purple-100 text-purple-900",
        blue: "border-blue-300 bg-blue-100 text-blue-900",
        sky: "border-sky-300 bg-sky-100 text-sky-900",
        cyan: "border-cyan-300 bg-cyan-100 text-cyan-900",
        teal: "border-teal-300 bg-teal-100 text-teal-900",
        green: "border-green-300 bg-green-100 text-green-900",
        yellow: "border-yellow-300 bg-yellow-100 text-yellow-900",
        orange: "border-orange-300 bg-orange-100 text-orange-900",
        pink: "border-pink-300 bg-pink-100 text-pink-900",
      },
      size: {
        sm: "px-2 text-sm",
        md: "px-3 text-base",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "sm",
    },
  },
);

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof badgeVariants>, "variant"> {
  "data-cy"?: string;
  variant?: BadgeVariant | string;
  icon?: LucideIcon;
  iconProps?: React.ComponentProps<LucideIcon>;
  iconPosition?: "left" | "right";
}

export function Badge({
  className,
  variant,
  size,
  icon: Icon,
  iconProps,
  iconPosition = "left",
  "data-cy": dataCy,
  children,
  ...props
}: BadgeProps) {
  const finalClassName = cn(
    badgeVariants({ variant: variant as BadgeVariant, size }),
    className,
  );

  const iconSize = size === "md" ? 16 : 14;
  const iconElement = Icon && <Icon size={iconSize} {...iconProps} />;

  return (
    <div className={finalClassName} data-cy={dataCy} {...props}>
      {Icon && iconPosition === "left" && iconElement}
      {children}
      {Icon && iconPosition === "right" && iconElement}
    </div>
  );
}

export { badgeVariants };
