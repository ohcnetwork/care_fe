import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { handleLocationReorder } from "@/Utils/locationOrder";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

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
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: children, isLoading } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      parentId ? "children" : "all",
      parentId,
      { page, limit: itemsPerPage + 2, searchQuery },
    ],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: parentId || "",
        offset: Math.max(0, (page - 1) * itemsPerPage - 1),
        limit: itemsPerPage + 2,
        name: searchQuery || undefined,
        mode: parentId ? undefined : "kind",
        ordering: "sort_index",
      },
    }),
  });

  // Filter the results to show only the current page items
  const currentPageItems = children?.results?.slice(
    page === 1 ? 0 : 1,
    page === 1 ? itemsPerPage : itemsPerPage + 1,
  );

  const { mutate: updateLocationOrder } = useMutation({
    mutationFn: (params: {
      locations: { locationId: string; data: any }[];
      previousData?: any;
      onSuccess?: () => void;
    }) => {
      const batchRequests = params.locations.map(
        ({ locationId, data }, index) => ({
          url: locationApi.update.path
            .replace("{facility_id}", facilityId)
            .replace("{id}", locationId),
          method: locationApi.update.method,
          reference_id: `location_${index}`,
          body: {
            ...data,
            id: locationId,
            location_type: {
              code: data.location_type?.code || "OTHER",
            },
          },
        }),
      );

      return mutate(routes.batchRequest)({
        requests: batchRequests,
      });
    },
    onSuccess: (data, variables) => {
      if (!variables.onSuccess) {
        queryClient.invalidateQueries({
          queryKey: [
            "locations",
            facilityId,
            parentId ? "children" : "all",
            parentId,
          ],
        });
        toast.success("Location order updated");
      } else {
        variables.onSuccess();
        toast.success("Location order updated");
      }
    },
    onError: (error, variables) => {
      if (variables.previousData) {
        queryClient.setQueryData(
          [
            "locations",
            facilityId,
            parentId ? "children" : "all",
            parentId,
            { page, limit: itemsPerPage + 2, searchQuery },
          ],
          variables.previousData,
        );
      }
      toast.error("Failed to update order");
      console.error("Failed to update location order:", error);
    },
  });

  const handleMove = (location: LocationList, direction: "up" | "down") => {
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

    const params = {
      location,
      locations: children.results,
      queryClient,
      queryKey: [
        "locations",
        facilityId,
        parentId ? "children" : "all",
        parentId,
        { page, limit: itemsPerPage + 2, searchQuery },
      ],
      previousData: children,
      direction,
      updateMutation: updateLocationOrder,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "locations",
            facilityId,
            parentId ? "children" : "all",
            parentId,
          ],
        });
      },
    };

    handleLocationReorder(params);
  };

  const handleAddLocation = () => {
    setSelectedLocation(null);
    setIsSheetOpen(true);
  };

  const handleEditLocation = (location: LocationList) => {
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
