import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
  /**
   * Renders a count badge when set. Pass the query's `isFetching` alongside it
   * so a skeleton shows while the count loads (when `count` is still undefined).
   */
  count?: number;
  isFetching?: boolean;
}

export function SectionHeader({
  title,
  description,
  actions,
  count,
  isFetching = false,
}: SectionHeaderProps) {
  const showCount = isFetching || count !== undefined;

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
                {count}
              </Badge>
            ))}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions}
    </header>
  );
}
