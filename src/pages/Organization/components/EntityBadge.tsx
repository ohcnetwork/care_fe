import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EntityBadgeProps {
  title: string;
  description: string;
  count?: number | null;
  isFetching: boolean;
  actions?: ReactNode;
  showCount?: boolean;
}

export default function EntityBadge({
  title,
  description,
  count,
  isFetching,
  actions,
  showCount = true,
}: EntityBadgeProps) {
  return (
    <header className="flex min-h-12 flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {showCount &&
            (isFetching ? (
              <Skeleton className="h-6 w-7 rounded-sm" />
            ) : (
              <Badge variant="neutral" counter>
                {count ?? 0}
              </Badge>
            ))}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions}
    </header>
  );
}
