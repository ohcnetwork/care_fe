import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import React from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { TableCell, TableRow } from "@/components/ui/table";

import query from "@/Utils/request/query";
import {
  LocationList as LocationListType,
  getLocationFormLabel,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface Props {
  facilityId: string;
  location: LocationListType;
  level: number;
}

export function LocationChildren({ facilityId, location, level }: Props) {
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );

  const { data: children, isLoading } = useQuery({
    queryKey: ["locations", facilityId, location?.id, "children"],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: location?.id,
      },
    }),
  });

  const toggleExpand = (locationId: string) => {
    setExpandedLocations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  return (
    <>
      {children?.results?.map((childLocation: LocationListType) => (
        <React.Fragment key={childLocation.id}>
          <TableRow
            className="divide-x font-medium cursor-pointer bg-gray-50 dark:bg-gray-800"
            onClick={() => toggleExpand(childLocation.id)}
          >
            <TableCell className={`pl-${level * 4} flex items-center`}>
              {childLocation.has_children ? (
                <CareIcon
                  icon={
                    expandedLocations.has(childLocation.id)
                      ? "l-angle-down"
                      : "l-angle-right"
                  }
                  className="w-5 h-5 mr-2"
                />
              ) : (
                <CareIcon icon="l-corner-down-right" className="w-4 h-4 mr-2" />
              )}

              {childLocation.name}
              {isLoading ? <span>Loading...</span> : null}
            </TableCell>
            <TableCell>{getLocationFormLabel(childLocation?.form)}</TableCell>
          </TableRow>
          {expandedLocations.has(childLocation.id) &&
            childLocation.has_children && (
              <LocationChildren
                facilityId={facilityId}
                location={childLocation}
                level={level + 1}
              />
            )}
        </React.Fragment>
      ))}
    </>
  );
}
