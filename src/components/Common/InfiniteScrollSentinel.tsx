import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface InfiniteScrollSentinelProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError?: boolean;
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
  isFetchNextPageError,
  fetchNextPage,
  className,
}: InfiniteScrollSentinelProps) {
  const { ref, inView } = useInView();
  const { t } = useTranslation();

  useEffect(() => {
    if (
      inView &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError
    ) {
      fetchNextPage();
    }
  }, [
    inView,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  if (!hasNextPage) return null;

  if (isFetchNextPageError) {
    return (
      <div role="alert">
        <p>{t("network_failure")}</p>
        <Button onClick={() => fetchNextPage()}>{t("retry")}</Button>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <Skeleton className={cn("h-20 w-full rounded-2xl", className)} />
    </div>
  );
}
