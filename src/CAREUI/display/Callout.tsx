import React from "react";

import { cn } from "@/lib/utils";

interface CalloutProps {
  variant?: "primary" | "secondary" | "warning" | "alert" | "danger";
  className?: string;
  badge: string;
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
          primary: "bg-primary-100/50 text-primary-800",
          secondary: "bg-gray-50 text-gray-700",
          warning: "bg-warning-50 text-warning-700",
          alert: "bg-purple-50 text-purple-500",
          danger: "bg-danger-50 text-danger-600",
        }[variant],
        props.className,
      )}
    >
      <div
        className={cn(
          "h-min rounded-full border bg-white px-2",
          {
            primary: "border-primary-200",
            secondary: "border-secondary-300",
            warning: "border-warning-300",
            alert: "border-purple-300",
            danger: "border-danger-300",
          }[variant],
        )}
      >
        <span className="font-medium">{props.badge}</span>
      </div>
      <div className="flex-1">
        <span className="font-medium">{props.children}</span>
      </div>
    </div>
  );
}
