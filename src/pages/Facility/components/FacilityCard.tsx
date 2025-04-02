import { Link } from "raviger";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import { FacilityMapsLink } from "@/components/Facility/FacilityMapLink";

import { FeatureBadge } from "@/pages/Facility/Utils";
import { FacilityData } from "@/types/facility/facility";

interface Props {
  facility: FacilityData;
  className?: string;
}

export function FacilityCard({ facility, className }: Props) {
  return (
    <Card className={cn("overflow-hidden bg-white", className)}>
      <div className="flex flex-col h-full">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="size-32 shrink-0 overflow-hidden rounded-lg">
              <Avatar
                imageUrl={facility.read_cover_image_url}
                name={facility.name || ""}
              />
            </div>

            <div className="flex grow flex-col min-w-0">
              <h3 className="truncate text-xl font-semibold">
                {facility.name}
              </h3>
              {/* @ts-expect-error Type is not defined properly */}
              {facility.facility_type?.name}
              <p className="text-sm text-gray-500 truncate">
                {[facility.address].filter(Boolean).join(", ")}
                {facility.latitude && facility.longitude && (
                  <FacilityMapsLink
                    latitude={facility.latitude.toString()}
                    longitude={facility.longitude.toString()}
                  />
                )}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {facility.features?.map((featureId) => (
                  <FeatureBadge
                    key={featureId}
                    featureId={featureId as number}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex justify-end">
            <Button variant="outline" asChild>
              <Link href={`/facility/${facility.id}`}>View Facility</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
