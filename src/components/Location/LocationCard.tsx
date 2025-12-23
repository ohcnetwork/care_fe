import { format } from "date-fns";
import { ArrowRight, BedSingle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  LocationAssociationRead,
  LocationAssociationStatus,
} from "@/types/location/association";
import { LocationRead } from "@/types/location/location";

interface LocationCardProps {
  locationHistory: LocationAssociationRead;
  status: LocationAssociationStatus;
  keepBedActive?: boolean;
  onKeepBedActiveChange?: (value: boolean) => void;
}

const LocationBreadcrumb = ({ location }: { location: LocationRead }) => {
  const breadcrumb = [];
  let currentLocation = location;
  while (
    currentLocation.parent &&
    Object.keys(currentLocation.parent).length > 0
  ) {
    breadcrumb.unshift(currentLocation.parent);
    currentLocation = currentLocation.parent;
  }
  return (
    <div className="flex flex-row items-center gap-1">
      {breadcrumb.map((location, ind) => (
        <div key={location.id} className="flex flex-row items-center gap-1">
          <span className="text-sm font-medium text-gray-500">
            {location.name}
          </span>
          {ind !== breadcrumb.length - 1 && (
            <ArrowRight className="size-4 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );
};

export function LocationCard({
  locationHistory,
  status,
  keepBedActive = false,
  onKeepBedActiveChange,
}: LocationCardProps) {
  const { t } = useTranslation();
  const location = locationHistory.location;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        className={cn(
          "rounded-lg border p-1",
          status === "active"
            ? "border-green-200 bg-green-50"
            : "border-blue-200 bg-blue-50",
        )}
      >
        <div className="flex flex-col flex-wrap justify-between items-start gap-2">
          <Badge variant={status === "active" ? "primary" : "secondary"}>
            {t(status)}
          </Badge>
          <div className="flex flex-row justify-between w-full">
            <div className="space-y-1">
              <div className="flex flex-row items-center gap-1">
                <LocationBreadcrumb location={location} />
              </div>

              {/* Current bed location */}
              <div className="flex items-center">
                <div
                  className={cn(
                    "p-1 rounded mr-2",
                    status === "active" ? "bg-teal-100" : "bg-blue-100",
                  )}
                >
                  <BedSingle
                    className={cn(
                      "size-5",
                      status === "active" ? "text-teal-600" : "text-blue-600",
                    )}
                  />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {location.name}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="mt-4 flex justify-center sm:justify-end">
                <div className="flex flex-row text-xs text-gray-500 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">
                      {t("start_time")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span className="font-semibold">
                        {format(
                          new Date(locationHistory.start_datetime),
                          "dd MMM yyyy, hh:mm a",
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs">{t("end_time")}</span>
                    <div className="flex items-center gap-1">
                      {locationHistory.end_datetime ? (
                        <>
                          <Clock className="size-3" />
                          <span className="font-semibold">
                            {format(
                              new Date(locationHistory.end_datetime),
                              "dd MMM yyyy, hh:mm a",
                            )}
                          </span>
                        </>
                      ) : (
                        // eslint-disable-next-line i18next/no-literal-string
                        <span className="text-xs text-gray-500">-- : --</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {onKeepBedActiveChange && (
        <div className="flex items-start gap-2 mt-1">
          <Checkbox
            id="keep-bed-as-active"
            checked={keepBedActive}
            onCheckedChange={onKeepBedActiveChange}
          />
          <div className="flex flex-col">
            <Label htmlFor="keep-bed-as-active">{t("bed_hold")}</Label>
            <span className="text-xs text-gray-500">
              {t("keep_bed_as_active")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
