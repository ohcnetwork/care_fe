import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className="overflow-x-auto rounded-lg border border-gray-200"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading table"
    >
      <table className="relative min-w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {Array.from({ length: 5 }).map((_, i) => (
              <th
                scope="col"
                key={i}
                className="bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600"
              >
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({
            length: Math.max(0, Math.min(100, Math.trunc(count ?? 0))),
          }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: 5 }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-4">
                  <Skeleton className="h-4 w-20" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({
        length: Math.max(0, Math.min(100, Math.trunc(count ?? 0))),
      }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md border p-4 shadow-sm"
        >
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
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
      }).map((_, i) => (
        <div key={i} className="rounded-md border p-4 shadow-sm space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
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
      }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CardListWithHeaderSkeleton({ count = 4, className, }: { count?: number; className?: string; }) {
  return (
    <div
      className={`container mx-auto max-w-3xl space-y-6 ${className ?? ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {Array.from({
        length: Math.max(0, Math.min(100, Math.trunc(count ?? 0))),
      }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md border p-4 shadow-sm"
        >
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
