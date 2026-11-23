import { LucideIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface UserProfileEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

export function UserProfileEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: UserProfileEmptyStateProps) {
  return (
    <Empty className="p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onAction && (
        <EmptyContent>
          <Button type="button" variant="outline" size="sm" onClick={onAction}>
            <Plus aria-hidden="true" />
            {actionLabel}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
