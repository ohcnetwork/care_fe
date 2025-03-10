import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useState } from "react";
import React from "react";

import query from "@/Utils/request/query";
import LocationContent from "@/pages/Facility/locations/LocationContent";
import LocationNavbar from "@/pages/Facility/locations/LocationNavbar";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

// Types
interface LocationState {
  selectedLocationId: string | null;
  selectedLocation: LocationListType | null;
  expandedLocations: Set<string>;
  searchQuery: string;
  currentPage: number;
}

function getParentChain(location: LocationListType): Set<string> {
  const parentIds = new Set<string>();
  let current = location.parent;

  while (current) {
    parentIds.add(current.id);
    current = current.parent;
  }

  return parentIds;
}

// Hook for location data management
function useLocationState(
  initialLocationId?: string,
  facilityId?: string,
): LocationState & {
  handleLocationSelect: (location: LocationListType) => void;
  handleToggleExpand: (locationId: string) => void;
  handleSearchChange: (value: string) => void;
  handlePageChange: (page: number) => void;
} {
  const [state, setState] = useState<LocationState>({
    selectedLocationId: initialLocationId || null,
    selectedLocation: null,
    expandedLocations: new Set(),
    searchQuery: "",
    currentPage: 1,
  });

  const handleLocationSelect = useCallback(
    (location: LocationListType) => {
      if (!location.id) {
        // Navigate to the base locations URL when deselecting
        navigate(`/facility/${facilityId}/encounters/locations`);
        setState((prev) => ({
          ...prev,
          selectedLocationId: null,
          selectedLocation: null,
          searchQuery: "",
        }));
        return;
      }

      // Navigate to the selected location URL
      navigate(`/facility/${facilityId}/encounters/locations/${location.id}`);

      // Get parent chain and include the current location ID
      const parentIds = getParentChain(location);
      parentIds.add(location.id);

      setState((prev) => ({
        ...prev,
        selectedLocationId: location.id,
        selectedLocation: location,
        searchQuery: "",
        expandedLocations: new Set([...prev.expandedLocations, ...parentIds]),
      }));
    },
    [facilityId],
  );

  const handleToggleExpand = useCallback((locationId: string) => {
    setState((prev) => {
      const next = new Set(prev.expandedLocations);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return { ...prev, expandedLocations: next };
    });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      searchQuery: value,
      currentPage: 1, // Reset to first page when search changes
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  return {
    ...state,
    handleLocationSelect,
    handleToggleExpand,
    handleSearchChange,
    handlePageChange,
  };
}

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
    handleToggleExpand,
    handleSearchChange,
    handlePageChange,
  } = useLocationState(locationId, facilityId);

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
