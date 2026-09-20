import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { useBatchRequest } from "@/Utils/request/batch";
import query from "@/Utils/request/query";

interface UseLocationManagementProps {
  facilityId: string;
  parentId?: string;
  itemsPerPage?: number;
  isNested?: boolean;
}

export function useLocationManagement({
  facilityId,
  parentId,
  itemsPerPage = 12,
}: UseLocationManagementProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationRead | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Reset searchQuery and page when parentId changes
  useEffect(() => {
    setSearchQuery("");
    setPage(1);
  }, [parentId, facilityId]);

  const { data: children, isLoading } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      parentId ? "children" : "all",
      parentId,
      { page, limit: itemsPerPage + 2, searchQuery },
    ],
    /* The weird offset calculation is to include overlapping items between pages.
    Offset is calculated using (page - 1) * itemsPerPage - 1 to include overlapping items between pages.
    This enables smooth reordering across pages by showing one item from the previous and one from the next page.*/
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: parentId || "",
        offset: Math.max(0, (page - 1) * itemsPerPage - 1),
        limit: itemsPerPage + 2,
        name: searchQuery || undefined,
        mode: parentId ? undefined : "kind",
      },
    }),
  });

  const { t } = useTranslation();
  // Filter the results to show only the current page items
  const currentPageItems = children?.results?.slice(
    page === 1 ? 0 : 1,
    page === 1 ? itemsPerPage : itemsPerPage + 1,
  );

  const { mutateAsync: updateLocationOrder } = useBatchRequest({});

  const handleMove = async (
    location: LocationRead,
    direction: "up" | "down",
  ) => {
    if (!children?.results) return;

    const currentIndex = children.results.findIndex(
      (loc) => loc.id === location.id,
    );
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Check if we need to change pages
    if (targetIndex < 0 && page > 1) {
      setPage(page - 1);
      return;
    }
    if (
      targetIndex >= children.results.length &&
      children.count > page * itemsPerPage
    ) {
      setPage(page + 1);
      return;
    }

    // Check if movement is possible
    if (targetIndex < 0 || targetIndex >= children.results.length) {
      return;
    }

    const targetLocation = children.results[targetIndex];

    // Swap sort_index values between the two locations
    const swapped = [
      { ...location, sort_index: targetLocation.sort_index },
      { ...targetLocation, sort_index: location.sort_index },
    ];

    try {
      await updateLocationOrder(
        swapped.map((data, index) => ({
          api: locationApi.update,
          pathParams: { facility_id: facilityId, id: data.id },
          referenceId: `location_${index}`,
          body: {
            ...data,
            location_type: {
              code: data.location_type?.code || "OTHER",
            },
          },
        })),
      );
    } catch {
      return;
    }

    toast.success(t("location_order_updated"));

    // Update the UI only after successful API call
    const updatedLocations = [...children.results];
    [updatedLocations[targetIndex], updatedLocations[currentIndex]] = [
      updatedLocations[currentIndex],
      updatedLocations[targetIndex],
    ];

    // Update the local state
    queryClient.setQueryData(
      [
        "locations",
        facilityId,
        parentId ? "children" : "all",
        parentId,
        { page, limit: itemsPerPage + 2, searchQuery },
      ],
      {
        ...children,
        results: updatedLocations,
      },
    );

    // Then invalidate to ensure data is fresh
    queryClient.invalidateQueries({
      queryKey: [
        "locations",
        facilityId,
        parentId ? "children" : "all",
        parentId,
      ],
    });
  };

  const handleAddLocation = () => {
    setSelectedLocation(null);
    setIsSheetOpen(true);
  };

  const handleEditLocation = (location: LocationRead) => {
    setSelectedLocation(location);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedLocation(null);
    queryClient.invalidateQueries({
      queryKey: [
        "locations",
        facilityId,
        parentId ? "children" : "all",
        parentId,
      ],
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  return {
    page,
    setPage,
    searchQuery,
    setSearchQuery: handleSearchChange,
    selectedLocation,
    isSheetOpen,
    children,
    isLoading,
    currentPageItems,
    handleMove,
    handleAddLocation,
    handleEditLocation,
    handleSheetClose,
    isLastPage: children?.count ? children.count <= page * itemsPerPage : false,
  };
}
