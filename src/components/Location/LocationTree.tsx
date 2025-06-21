import { format } from "date-fns";
import React from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { LocationList } from "@/types/location/location";

interface LocationPathProps {
  location: LocationList;
  startTime?: string;
  endTime?: string;
  isLatest?: boolean;
  showTimeline?: boolean;
}

interface LocationNodeProps {
  location: LocationList;
  isLast: boolean;
  startTime?: string;

  endTime?: string;
  children?: React.ReactNode;
}

function LocationNode({
  location,
  isLast,
  startTime,
  endTime,
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
        {isLast && (startTime || endTime) && (
          <div className="pl-6 text-sm font-normal text-gray-700 italic">
            {[
              startTime && format(new Date(startTime), "MMM d, yyyy h:mm a"),
              endTime && format(new Date(endTime), "MMM d, yyyy h:mm a"),
            ]
              .filter(Boolean)
              .join(" - ")}
          </div>
        )}
      </div>
    );
  }

  return (
    <LocationNode
      location={location.parent}
      isLast={false}
      startTime={startTime}
      endTime={endTime}
    >
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
        {isLast && (startTime || endTime) && (
          <div className="pl-6 text-sm font-normal text-gray-700 italic">
            {[
              startTime && format(new Date(startTime), "MMM d, yyyy h:mm a"),
              endTime && format(new Date(endTime), "MMM d, yyyy h:mm a"),
            ]
              .filter(Boolean)
              .join(" - ")}
          </div>
        )}
      </div>
    </LocationNode>
  );
}

export function LocationTree({
  location,
  startTime,
  endTime,
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
        <LocationNode
          location={location}
          isLast={true}
          startTime={startTime}
          endTime={endTime}
        />
      </div>
    </div>
  );
}
