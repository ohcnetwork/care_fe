import { useQuery } from "@tanstack/react-query";
import React from "react";

import { useLocationState } from "@/hooks/useLocationState";

import query from "@/Utils/request/query";
import LocationContent from "@/pages/Facility/locations/LocationContent";
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
    setSelectedLocation,
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
      setSelectedLocation(locationDetail);
    }
  }, [locationDetail, setSelectedLocation]);

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
