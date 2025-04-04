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
  currentPage?: number;
  setPage?: (page: number) => void;
  isLastPage?: boolean;
  isFirstPage?: boolean;
  itemsPerPage?: number;
}

export function handleLocationReorder({
  location,
  locations,
  queryClient,
  queryKey,
  previousData,
  direction,
  updateMutation,
  currentPage = 1,
  setPage,
  isLastPage = false,
  isFirstPage = true,
  itemsPerPage = 10,
}: LocationOrderParams): void {
  const index = locations.findIndex((loc) => loc.id === location.id);

  // Check if movement is possible within the current page
  const isFirstItem = index === 0;
  const isLastItem = index === locations.length - 1;

  // For cross-page movement, we need to check if we're at page boundaries
  if (
    (direction === "up" && isFirstItem && isFirstPage) ||
    (direction === "down" && isLastItem && isLastPage)
  ) {
    // Cannot move beyond the boundaries of all data
    return;
  }

  // Handle cross-page movement
  if (
    (direction === "up" && isFirstItem) ||
    (direction === "down" && isLastItem)
  ) {
    // We need to move to previous/next page
    if (setPage) {
      if (direction === "up" && currentPage > 1) {
        // Move to bottom of previous page
        const targetPage = currentPage - 1;

        // Store the item we're moving for later reference
        const movingItem = locations[0];

        // We'll update the sort_index to place it at the end of the previous page
        // Calculate the sort_index for the item being moved to the previous page
        // We need to place it after the last item of the previous page
        const targetSortIndex = targetPage * itemsPerPage - 0.5;

        // Update backend without optimistic update (we'll change pages)
        updateMutation({
          locations: [
            {
              locationId: movingItem.id,
              data: {
                name: movingItem.name,
                description: movingItem.description,
                status: movingItem.status,
                operational_status: movingItem.operational_status,
                form: movingItem.form,
                mode: movingItem.mode,
                availability_status: movingItem.availability_status,
                organizations: [],
                sort_index: targetSortIndex,
              },
            },
          ],
          onSuccess: () => {
            // After successful update, navigate to the target page
            setPage(targetPage);

            // Invalidate queries for both pages to ensure fresh data
            queryClient.invalidateQueries({
              queryKey: queryKey.slice(0, -1), // Remove the page-specific part
            });
          },
        });
        return;
      } else if (direction === "down" && isLastItem && isLastPage === false) {
        // Move to top of next page
        const targetPage = currentPage + 1;

        // Store the item we're moving for later reference
        const movingItem = locations[locations.length - 1];

        // Calculate the sort_index for the item being moved to the next page
        // We need to place it before the first item of the next page
        const targetSortIndex = (targetPage - 1) * itemsPerPage + 0.5;

        // Update backend without optimistic update (we'll change pages)
        updateMutation({
          locations: [
            {
              locationId: movingItem.id,
              data: {
                name: movingItem.name,
                description: movingItem.description,
                status: movingItem.status,
                operational_status: movingItem.operational_status,
                form: movingItem.form,
                mode: movingItem.mode,
                availability_status: movingItem.availability_status,
                organizations: [],
                sort_index: targetSortIndex,
              },
            },
          ],
          onSuccess: () => {
            // After successful update, navigate to the target page
            setPage(targetPage);

            // Invalidate queries for both pages to ensure fresh data
            queryClient.invalidateQueries({
              queryKey: queryKey.slice(0, -1), // Remove the page-specific part
            });
          },
        });
        return;
      }
    }
  }

  // Regular within-page movement (original code)
  const targetIndex = direction === "up" ? index - 1 : index + 1;
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

  // Swap sort_index values
  const currentSortIndex = location.sort_index ?? index;
  const targetSortIndex = targetLocation.sort_index ?? targetIndex;

  // Call the mutation to update the backend, but don't invalidate the query on success
  // to avoid flickering or undoing our optimistic update
  updateMutation({
    locations: [
      {
        locationId: location.id,
        data: {
          name: location.name,
          description: location.description,
          status: location.status,
          operational_status: location.operational_status,
          form: location.form,
          mode: location.mode,
          availability_status: location.availability_status,
          organizations: [],
          sort_index: targetSortIndex,
        },
      },
      {
        locationId: targetLocation.id,
        data: {
          name: targetLocation.name,
          description: targetLocation.description,
          status: targetLocation.status,
          operational_status: targetLocation.operational_status,
          form: targetLocation.form,
          mode: targetLocation.mode,
          availability_status: targetLocation.availability_status,
          organizations: [],
          sort_index: currentSortIndex,
        },
      },
    ],
    previousData,
    // We're already optimistically updated, no need to invalidate and refetch
    onSuccess: () => {
      // Instead of invalidating, we'll just make sure the optimistic update stays
      // by setting the data again (in case there was any race condition)
      queryClient.setQueryData(queryKey, {
        ...previousData,
        results: updatedLocations,
      });
    },
  });
}
