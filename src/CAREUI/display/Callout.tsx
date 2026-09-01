import React, { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CalloutProps {
  variant?: "primary" | "secondary" | "warning" | "alert" | "danger";
  className?: string;
  badge: ReactNode;
  children: React.ReactNode;
}

export default function Callout({
  variant = "primary",
  ...props
}: CalloutProps) {
  return (
    <div
      className={cn(
        "flex items-center h-min gap-2 rounded-md px-2 py-2 text-sm/tight",
        {
          primary:
            "border border-primary-100/50 bg-primary-100/50 text-primary-800",
          secondary: "border border-gray-300 bg-gray-50 text-gray-700",
          warning: "border border-warning-300 bg-warning-50 text-warning-700",
          alert: "border border-purple-300 bg-purple-50 text-purple-500",
          danger: "border border-danger-300 bg-danger-50 text-danger-600",
        }[variant],
        props.className,
      )}
    >
      <div className="font-medium text-current">{props.badge}</div>
      <div className="flex-1 font-medium">{props.children}</div>
    </div>
  );
}
