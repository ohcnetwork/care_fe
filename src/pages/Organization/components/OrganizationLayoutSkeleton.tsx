import { Skeleton } from "@/components/ui/skeleton";

import {
  CardGridSkeleton,
  CardListSkeleton,
} from "@/components/Common/SkeletonLoading";

export default function OrganizationLayoutSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="mb-4 h-9 w-64" />
      <div className="mb-4 flex min-h-11 items-center">
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="flex space-x-4 mb-4">
        <CardListSkeleton count={3} />
      </div>
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-8 w-1/4 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CardGridSkeleton count={6} />
      </div>
    </div>
  );
}
