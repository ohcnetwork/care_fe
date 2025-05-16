import { Skeleton } from "@/components/ui/skeleton";

export function TimelineLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <Skeleton className="h-6 w-16 mb-4" />
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
