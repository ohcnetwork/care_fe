import React from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
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
 * @param description - Optional description providing more context. A string or inline content, such as a shortcut hint.
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
    <Empty className={className}>
      <EmptyHeader>
        {icon && <EmptyMedia variant="icon">{icon}</EmptyMedia>}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
