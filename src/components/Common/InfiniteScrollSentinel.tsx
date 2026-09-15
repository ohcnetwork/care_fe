import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

interface InfiniteScrollSentinelProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** Applied to the placeholder so the sentinel matches the list's row height. */
  className?: string;
}

/**
 * Fetches the next page once scrolled into view, and renders a placeholder in
 * the space the incoming rows will occupy. Renders nothing once the list is
 * exhausted.
 */
export function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  className,
}: InfiniteScrollSentinelProps) {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!hasNextPage) return null;

  return (
    <div ref={ref}>
      <Skeleton className={cn("h-20 w-full rounded-2xl", className)} />
    </div>
  );
}
