import { QueryClient } from "@tanstack/react-query";

import { LocationList } from "@/types/location/location";

interface LocationOrderParams {
  location: LocationList;
  locations: LocationList[];
  queryClient: QueryClient;
  queryKey: any[];
  previousData: any;
  direction: "up" | "down";
  updateMutation: (params: {
    locations: { locationId: string; data: any }[];
    previousData?: any;
    onSuccess?: () => void;
  }) => void;
  onSuccess?: () => void;
}

export function handleLocationReorder({
  location,
  locations,
  queryClient,
  queryKey,
  previousData,
  direction,
  updateMutation,
  onSuccess,
}: LocationOrderParams): void {
  const index = locations.findIndex((loc) => loc.id === location.id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  // Check if movement is possible
  if (targetIndex < 0 || targetIndex >= locations.length) {
    return;
  }

  const targetLocation = locations[targetIndex];

  // Swap positions in local state for animation
  const updatedLocations = [...locations];
  [updatedLocations[targetIndex], updatedLocations[index]] = [
    updatedLocations[index],
    updatedLocations[targetIndex],
  ];

  // Optimistically update the UI
  queryClient.setQueryData(queryKey, {
    ...previousData,
    results: updatedLocations,
  });

  // Swap sort_index values between the two locations
  updateMutation({
    locations: [
      {
        locationId: location.id,
        data: {
          ...location,
          sort_index: targetLocation.sort_index,
        },
      },
      {
        locationId: targetLocation.id,
        data: {
          ...targetLocation,
          sort_index: location.sort_index,
        },
      },
    ],
    previousData,
    onSuccess: () => {
      // Ensure the optimistic update stays
      queryClient.setQueryData(queryKey, {
        ...previousData,
        results: updatedLocations,
      });
      // Call the provided onSuccess callback if it exists
      onSuccess?.();
    },
  });
}
