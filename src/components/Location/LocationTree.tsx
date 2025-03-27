import { format } from "date-fns";
import React from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { LocationList } from "@/types/location/location";

interface LocationPathProps {
  location: LocationList;
  datetime?: string;
  isLatest?: boolean;
  showTimeline?: boolean;
}

interface LocationNodeProps {
  location: LocationList;
  isLast: boolean;
  datetime?: string;
  children?: React.ReactNode;
}

function LocationNode({
  location,
  isLast,
  datetime,
  children,
}: LocationNodeProps) {
  if (!location.parent?.id) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center text-sm">
          <span className="size-2 rounded-full bg-gray-400 mr-2" />
          <span
            className={isLast ? "font-semibold" : "text-gray-700 font-medium"}
          >
            {location.name}
          </span>
        </div>
        {children}
        {isLast && datetime && (
          <div className="pl-6 flex items-center text-sm font-normal text-gray-700 italic">
            {format(new Date(datetime), "MMM d, yyyy h:mm a")}
          </div>
        )}
      </div>
    );
  }

  return (
    <LocationNode location={location.parent} isLast={false} datetime={datetime}>
      <div className="flex flex-col gap-2 ml-2">
        <div className="flex items-center text-sm">
          <CareIcon
            icon="l-corner-down-right"
            className="size-4 mr-2 mb-1 text-gray-400"
          />
          <span
            className={isLast ? "font-semibold" : "text-gray-700 font-medium"}
          >
            {location.name}
          </span>
        </div>
        {children}
        {isLast && datetime && (
          <div className="pl-6 flex items-center text-sm font-normal text-gray-700 italic">
            {format(new Date(datetime), "MMM d, yyyy h:mm a")}
          </div>
        )}
      </div>
    </LocationNode>
  );
}

export function LocationTree({
  location,
  datetime,
  isLatest,
  showTimeline = false,
}: LocationPathProps) {
  return (
    <div
      className={`relative flex ${showTimeline ? "gap-8 pl-12" : ""}  pt-0.5`}
    >
      {showTimeline && (
        <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
          <div
            className={`absolute w-px bg-gray-200 h-full ${isLatest ? "top-3" : "-top-3"}`}
          />
          <div
            className={`size-6 rounded-full ${isLatest ? "bg-green-100" : "bg-gray-100"} flex items-center justify-center z-10`}
          >
            <CareIcon
              icon={isLatest ? "l-location-point" : "l-check"}
              className={`size-4 ${isLatest ? "text-green-600" : "text-gray-600"}`}
            />
          </div>
          {!isLatest && <div className="flex-1 w-px bg-gray-200" />}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <LocationNode location={location} isLast={true} datetime={datetime} />
      </div>
    </div>
  );
}
