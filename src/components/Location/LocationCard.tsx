import { format } from "date-fns";
import { BedSingle, Clock, MoveRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";

import { stringifyNestedObject } from "@/Utils/utils";
import { LocationHistory } from "@/types/emr/encounter/encounter";
import { LocationAssociationStatus } from "@/types/location/association";

interface LocationCardProps {
  locationHistory: LocationHistory;
  status: LocationAssociationStatus;
}

export function LocationCard({ locationHistory, status }: LocationCardProps) {
  const { t } = useTranslation();
  const location = locationHistory.location;

  return (
    <div
      className={cn(
        "rounded-lg border p-2",
        status === "active"
          ? "border-green-200 bg-green-50"
          : "border-blue-200 bg-blue-50",
      )}
    >
      <div className="flex flex-wrap justify-between items-start">
        <div className="space-y-2">
          {/* Parent locations */}
          {location.parent?.parent && (
            <div className="flex items-center text-sm font-medium text-gray-700">
              {stringifyNestedObject(
                location.parent.parent,
                <MoveRight className="mx-2 size-5" />,
                true,
              )}
            </div>
          )}

          {/* Immediate parent */}
          <div className="ml-4 flex items-center">
            <CareIcon
              icon="l-corner-down-right"
              className="size-4 mr-2 mb-1 text-gray-400"
            />
            <span className="text-sm font-medium text-gray-800">
              {location.parent?.name}
            </span>
          </div>

          {/* Current bed location */}
          <div className="ml-12 flex items-center">
            <CareIcon
              icon="l-corner-down-right"
              className="size-4 mr-2 mb-1 text-gray-400"
            />
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
          <Badge variant={status === "active" ? "primary" : "secondary"}>
            {t(status)}
          </Badge>
          <div className="mt-4 flex justify-center sm:justify-end">
            <div className="flex flex-row text-xs text-gray-500 gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium">{t("start_time")}</span>
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
  );
}
