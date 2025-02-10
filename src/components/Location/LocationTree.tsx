import { format } from "date-fns";

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
  depth: number;
  isLast: boolean;
  datetime?: string;
}

function LocationNode({
  location,
  depth,
  isLast,
  datetime,
}: LocationNodeProps) {
  return (
    <>
      {location.parent?.id && (
        <LocationNode
          location={location.parent}
          depth={depth - 1}
          isLast={false}
          datetime={datetime}
        />
      )}
      <div
        className="flex items-center text-sm"
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        {depth === 0 ? (
          <span className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
        ) : (
          <CareIcon
            icon="l-corner-down-right"
            className="w-4 h-4 mr-2 mb-1 text-gray-400"
          />
        )}
        <span
          className={isLast ? "font-semibold" : "text-gray-700 font-medium"}
        >
          {location.name}
        </span>
      </div>
      {isLast && datetime && (
        <div
          className="flex items-center text-sm font-normal text-gray-700 italic"
          style={{ paddingLeft: `${depth * 24 + 24}px` }}
        >
          {format(new Date(datetime), "MMM d, yyyy h:mm a")}
        </div>
      )}
    </>
  );
}

export function LocationTree({
  location,
  datetime,
  isLatest,
  showTimeline = false,
}: LocationPathProps) {
  const getDepth = (loc: LocationList): number =>
    loc.parent?.id ? getDepth(loc.parent) + 1 : 0;

  return (
    <div
      className={`relative flex ${showTimeline ? "gap-8 pl-12" : ""} pb-4 pt-0.5`}
    >
      {showTimeline && (
        <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
          <div
            className={`absolute w-px bg-gray-200 h-full ${isLatest ? "top-3" : "-top-3"}`}
          />
          <div
            className={`h-6 w-6 rounded-full ${isLatest ? "bg-green-100" : "bg-gray-100"} flex items-center justify-center z-10`}
          >
            <CareIcon
              icon={isLatest ? "l-location-point" : "l-check"}
              className={`h-4 w-4 ${isLatest ? "text-green-600" : "text-gray-600"}`}
            />
          </div>
          {!isLatest && <div className="flex-1 w-px bg-gray-200" />}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <LocationNode
          location={location}
          depth={getDepth(location)}
          isLast={true}
          datetime={datetime}
        />
      </div>
    </div>
  );
}
