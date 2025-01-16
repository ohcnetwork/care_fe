import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationLayoutSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="flex space-x-4 mb-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24" />
        ))}
      </div>
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-8 w-1/4 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-6 w-1/2" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
