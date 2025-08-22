import { useQuery } from "@tanstack/react-query";
import React from "react";

import { useLocationState } from "@/hooks/useLocationState";

import query from "@/Utils/request/query";
import LocationContent from "@/pages/Facility/locations/LocationContent";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

export default function BedsList({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const {
    selectedLocationId,
    selectedLocation,
    searchQuery,
    currentPage,
    handleLocationSelect,
    handleSearchChange,
    handlePageChange,
  } = useLocationState(`/facility/${facilityId}/locations`, "beds", locationId);

  // Fetch location details if locationId is provided
  const { data: locationDetail } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
    enabled: !!locationId,
  });

  // Update selected location when locationDetail is fetched
  React.useEffect(() => {
    if (locationDetail) {
      // Transform LocationDetail to LocationList
      const locationList: LocationListType = {
        ...locationDetail,
        has_children: false, // Since this is a detail view, we assume no children initially
        current_encounter: undefined, // LocationDetail doesn't have this field
      };
      handleLocationSelect(locationList);
    }
  }, [locationDetail, handleLocationSelect]);

  return (
    <div className="flex px-4 space-x-4 min-h-[calc(100vh-10rem)]">
      <LocationContent
        facilityId={facilityId}
        selectedLocationId={selectedLocationId}
        selectedLocation={selectedLocation}
        searchQuery={searchQuery}
        currentPage={currentPage}
        onLocationSelect={handleLocationSelect}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        hideBreadcrumbs={true}
      />
    </div>
  );
}
