import { format } from "date-fns";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { LocationList } from "@/types/location/location";

interface LocationPathProps {
  location: LocationList;
  datetime?: string;
  isLatest?: boolean;
  showTimeline?: boolean;
}

function getLocationHierarchy(location: LocationList): LocationList[] {
  const hierarchy: LocationList[] = [];
  let current: LocationList | undefined = location;

  while (current?.id) {
    hierarchy.unshift(current);
    current = current.parent;
  }

  return hierarchy;
}

export function LocationTree({
  location,
  datetime,
  isLatest,
  showTimeline = false,
}: LocationPathProps) {
  const hierarchy = getLocationHierarchy(location);

  return (
    <div
      className={`relative flex ${showTimeline ? "gap-8 pl-12" : ""} pb-4 pt-0.5`}
    >
      {showTimeline && (
        <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
          <div
            className={`absolute w-[1px] bg-gray-200 h-full ${isLatest ? "top-3" : "-top-3"}`}
          />
          {isLatest ? (
            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center z-10">
              <CareIcon
                icon="l-location-point"
                className="h-4 w-4 text-green-600"
              />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center z-10">
              <CareIcon icon="l-check" className="h-4 w-4 text-gray-600" />
            </div>
          )}
          {!isLatest && <div className="flex-1 w-[1px] bg-gray-200" />}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {hierarchy.map((loc, index) => (
          <div key={loc.id}>
            <div
              className="flex items-center text-sm"
              style={{ paddingLeft: `${index * 24}px` }}
            >
              {index === 0 ? (
                <span className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
              ) : (
                <CareIcon
                  icon="l-corner-down-right"
                  className="w-4 h-4 mr-2 mb-1 text-gray-400"
                />
              )}
              <span
                className={
                  index === hierarchy.length - 1
                    ? "font-semibold"
                    : "text-gray-700 font-medium"
                }
              >
                {loc.name}
              </span>
            </div>
            {index === hierarchy.length - 1 && datetime && (
              <div
                className="flex items-center text-sm font-normal text-gray-700 italic"
                style={{ paddingLeft: `${index * 24 + 24}px` }}
              >
                {format(new Date(datetime), "MMM d, yyyy h:mm a")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
