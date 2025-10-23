import React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty state component to display when there is no data to show.
 *
 * @param icon - Optional icon of your choice it can be Lucide Icon or CareIcon
 *               eg. `<CareIcon icon="l-user" className="text-primary size-6" />` or
 *                   `<LucideIcon className="text-primary size-6" />`
 * @param title - The title of the empty state
 * @param description - Optional description providing more context
 * @param action - Optional action element (e.g., button) to prompt user action
 * @param className - Optional additional class names for styling
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center border-dashed",
        className,
      )}
    >
      {icon && (
        <div className="rounded-full bg-primary/10 p-3 mb-3">{icon}</div>
      )}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
