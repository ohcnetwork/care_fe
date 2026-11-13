import React from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
    <Empty className={cn("border p-6", className)}>
      <EmptyHeader>
        {icon && <EmptyMedia variant="icon">{icon}</EmptyMedia>}
        <EmptyTitle>
          <h3>{title}</h3>
        </EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
