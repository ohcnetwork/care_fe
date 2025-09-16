import { navigate } from "raviger";
import { useCallback, useState } from "react";

import { LocationList as LocationListType } from "@/types/location/location";

type LocationPathType = "encounters" | "beds";

// Types
interface LocationState {
  selectedLocationId: string | null;
  selectedLocation: LocationListType | null;
  expandedLocations: Set<string>;
  searchQuery: string;
  currentPage: number;
}

// Hook for location data management
export function useLocationState(
  basePath: string,
  pathType: LocationPathType,
  initialLocationId?: string,
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
        navigate(
          pathType === "encounters" ? `${basePath}` : `${basePath}/beds`,
        );
        setState((prev) => ({
          ...prev,
          selectedLocationId: null,
          selectedLocation: null,
          searchQuery: "",
        }));
        return;
      }

      // Navigate to the selected location URL
      navigate(
        pathType === "encounters"
          ? `${basePath}/${location.id}`
          : `${basePath}/${location.id}/beds`,
      );

      setState((prev) => ({
        ...prev,
        selectedLocationId: location.id,
        selectedLocation: location,
        searchQuery: "",
      }));
    },
    [basePath],
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
