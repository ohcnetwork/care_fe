import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ count }: { count: number }) {
  return (
    <div
      className="overflow-x-auto rounded-lg border border-gray-200"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading table"
    >
      <table className="relative min-w-full table-fixed divide-y divide-gray-200">
        {/* Header Skeleton */}
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky top-0 z-10 bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600"
            >
              <Skeleton className="h-4 w-24" />
            </th>
            <th
              scope="col"
              className="bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600"
            >
              <Skeleton className="h-4 w-16" />
            </th>
            <th
              scope="col"
              className="bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600"
            >
              <Skeleton className="h-4 w-20" />
            </th>
            <th
              scope="col"
              className="bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600"
            >
              <Skeleton className="h-4 w-24" />
            </th>
            <th
              scope="col"
              className="bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600"
            >
              <Skeleton className="h-4 w-20" />
            </th>
          </tr>
        </thead>
        {/* Body Skeleton */}
        <tbody className="divide-y divide-gray-200 bg-white animate-pulse">
          {Array.from({
            length: Math.max(0, Math.min(100, Math.trunc(count ?? 0))),
          }).map((_, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="sticky left-0 z-10 bg-white px-4 py-4 lg:pr-20">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex flex-col">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="px-4 py-4 text-sm">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-4 text-sm whitespace-nowrap">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-4">
                <Skeleton className="h-8 w-20 rounded-md" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardListSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({
        length: Math.max(0, Math.min(100, Math.trunc(count ?? 0))),
      }).map((_, index) => (
        <div key={index}>
          <div className="p-4 rounded-lg bg-gray-100 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function CardGridSkeleton({ count }: { count: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading cards"
    >
      {Array.from({
        length: Math.max(0, Math.min(100, Math.trunc(count ?? 0))),
      }).map((_, index) => (
        <div key={index} className="skeleton-item animate-pulse">
          <Card className="h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col h-full gap-4">
                <div className="flex gap-4">
                  <Skeleton className="size-12 sm:size-16 rounded-full shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-5 w-32" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({
        length: Math.max(0, Math.min(50, Math.trunc(rows ?? 0))),
      }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CardListWithHeaderSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`container mx-auto max-w-3xl space-y-6 ${className ?? ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>
      <CardGridSkeleton count={count} />
    </div>
  );
}
