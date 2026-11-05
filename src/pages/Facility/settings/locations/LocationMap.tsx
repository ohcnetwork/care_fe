import { Suspense, lazy } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import type { LocationMapProps } from "./LocationMapContent";

const LocationMapContent = lazy(() => import("./LocationMapContent"));

export default function LocationMap(props: LocationMapProps) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
      <LocationMapContent {...props} />
    </Suspense>
  );
}
