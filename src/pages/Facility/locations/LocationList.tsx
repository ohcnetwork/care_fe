import { useQuery } from "@tanstack/react-query";
import React from "react";

import { useLocationState } from "@/hooks/useLocationState";

import query from "@/Utils/request/query";
import LocationContent from "@/pages/Facility/locations/LocationContent";
import LocationNavbar from "@/pages/Facility/locations/LocationNavbar";
import { LocationRead as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

export default function LocationList({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId?: string;
}) {
  const {
    selectedLocationId,
    selectedLocation,
    expandedLocations,
    searchQuery,
    currentPage,
    handleLocationSelect,
    setSelectedLocation,
    handleToggleExpand,
    handleSearchChange,
    handlePageChange,
  } = useLocationState(
    `/facility/${facilityId}/encounters/locations`,
    "encounters",
    locationId,
  );

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
      setSelectedLocation(locationList);
    }
  }, [locationDetail, setSelectedLocation]);

  return (
    <div className="flex px-4 space-x-4 min-h-[calc(100vh-10rem)]">
      <LocationNavbar
        facilityId={facilityId}
        selectedLocationId={selectedLocationId}
        expandedLocations={expandedLocations}
        onLocationSelect={handleLocationSelect}
        onToggleExpand={handleToggleExpand}
      />
      <LocationContent
        facilityId={facilityId}
        selectedLocationId={selectedLocationId}
        selectedLocation={selectedLocation}
        searchQuery={searchQuery}
        currentPage={currentPage}
        onLocationSelect={handleLocationSelect}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
