import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const TableSkeleton = ({ count }: { count: number }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="relative min-w-full divide-y divide-gray-200">
      {/* Header Skeleton */}
      <thead>
        <tr>
          <th className="sticky top-0 z-10 bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-24" />
          </th>
          <th className="bg-gray-100 px-6 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-16" />
          </th>
          <th className="bg-gray-100 px-10 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-20" />
          </th>
          <th className="bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-24" />
          </th>
          <th className="bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-20" />
          </th>
        </tr>
      </thead>
      {/* Body Skeleton */}
      <tbody className="divide-y divide-gray-200 bg-white animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="sticky left-0 z-10 bg-white px-4 py-4 lg:pr-20">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-col">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </td>
            <td className="flex-0 px-6 py-4">
              <Skeleton className="h-4 w-16" />
            </td>
            <td className="px-10 py-4 text-sm">
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

export const CardListSkeleton = ({ count }: { count: number }) =>
  Array.from({ length: count }, (_, index) => (
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
  ));

export const CardGridSkeleton = ({ count }: { count: number }) =>
  Array.from({ length: count }, (_, index) => (
    <div key={index} className="skeleton-item animate-pulse">
      <Card className="h-full">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col h-full gap-4">
            <div className="flex gap-4">
              <Skeleton className="size-12 sm:size-16 rounded-full shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
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
  ));

export const FormSkeleton = ({ rows }: { rows: number }) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} className="h-10 w-full" />
    ))}
  </div>
);
