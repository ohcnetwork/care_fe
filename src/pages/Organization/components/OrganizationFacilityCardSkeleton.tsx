import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationFacilityCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden" aria-hidden="true">
      <Skeleton className="aspect-[5/2] rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-4 py-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-9" />
      </div>
    </Card>
  );
}
