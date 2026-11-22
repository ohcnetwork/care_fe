import { Skeleton } from "@/components/ui/skeleton";

export function BedGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-44 rounded-lg" />
      ))}
    </div>
  );
}
