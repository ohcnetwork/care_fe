import { Skeleton } from "@/components/ui/skeleton";

import { SkeletonLoading } from "@/components/Common/SkeletonLoading";

export default function OrganizationLayoutSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="flex space-x-4 mb-4">
        <SkeletonLoading count={3} element="NoteSkeleton" />
      </div>
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-8 w-1/4 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonLoading count={6} element="CardGridSkeleton" />
      </div>
    </div>
  );
}
