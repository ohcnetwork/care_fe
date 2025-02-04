import { useQuery } from "@tanstack/react-query";
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
  const paddingClasses = ["pl-4", "pl-8", "pl-12", "pl-16", "pl-20"];
  const { data: children } = useQuery({
    queryKey: ["locations", facilityId, location?.id, "children"],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: location?.id,
      },
    }),
  });
  return children?.results?.map((childLocation: LocationListType) => (
    <React.Fragment key={childLocation.id}>
      <TableRow className="divide-x font-medium cursor-pointer bg-gray-50 dark:bg-gray-800">
        <TableCell className={paddingClasses[level]}>
          {" "}
          {/* Indentation for hierarchy */}
          <CareIcon icon="l-corner-down-right" /> {childLocation.name}
        </TableCell>
        <TableCell>{getLocationFormLabel(childLocation?.form)}</TableCell>
      </TableRow>
      {childLocation.has_children && (
        <LocationChildren
          facilityId={facilityId}
          location={childLocation}
          level={level + 1}
        />
      )}
    </React.Fragment>
  ));
}
