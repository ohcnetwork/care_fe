import React, { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
    <Alert
      role="note"
      variant={
        variant === "warning"
          ? "warning"
          : variant === "danger"
            ? "destructive"
            : variant === "primary" || variant === "alert"
              ? "info"
              : "default"
      }
      className={cn("grid-cols-[auto_1fr] gap-x-2", props.className)}
    >
      <div className="font-medium text-current">{props.badge}</div>
      <AlertDescription>{props.children}</AlertDescription>
    </Alert>
  );
}
