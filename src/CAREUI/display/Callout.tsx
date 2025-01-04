import React from "react";

import { cn } from "@/lib/utils";

import { ButtonVariant } from "@/components/ui/button";

interface CalloutProps {
  variant?: ButtonVariant;
  className?: string;
  badge: string;
  children: React.ReactNode;
}

export default function Callout({
  variant = "primary",
  ...props
}: CalloutProps) {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-primary-100 text-primary-900 shadow-sm",
    outline: "border border-gray-200 bg-white text-gray-900 shadow-sm",
    secondary: "bg-gray-100 text-gray-900 shadow-sm",
    destructive: "bg-red-100 text-red-900 shadow-sm",
    primary_gradient:
      "bg-gradient-to-b from-primary-700 to-primary-800 text-white shadow-lg",
    ghost: "hover:bg-gray-100 text-gray-900 shadow-sm",
    link: "text-gray-900 underline-offset-4 hover:underline",
    white: "bg-white text-gray-900 shadow-sm",
    alert: "bg-alert-100 text-alert-900 shadow-sm",
    warning: "bg-warning-100 text-warning-900 shadow-sm",
    outline_primary:
      "border border-primary-700 bg-white text-primary-700 shadow-sm",
  };

  const badgeVariantClasses: Record<ButtonVariant, string> = {
    primary: "border-primary-300",
    outline: "border-gray-200",
    secondary: "border-gray-300",
    destructive: "border-red-300",
    primary_gradient: "border-primary-700",
    ghost: "border-gray-100",
    link: "border-transparent",
    white: "border-gray-200",
    alert: "border-alert-300",
    warning: "border-warning-300",
    outline_primary: "border-primary-700",
  };

  return (
    <div
      className={cn(
        "flex h-min gap-2 rounded-md px-2 py-1.5 text-sm/tight",
        variantClasses[variant],
        props.className,
      )}
    >
      <div
        className={cn(
          "h-min rounded-full border bg-white px-2 py-0.5",
          badgeVariantClasses[variant],
        )}
      >
        <span className="font-medium">{props.badge}</span>
      </div>
      <span className="font-medium">{props.children}</span>
    </div>
  );
}
