import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
        ordering: "sort_index",
      },
    }),
  });

  const { t } = useTranslation();
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

      return mutate(routes.batchRequest, { silent: true })({
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
        toast.success(t("location_order_updated"));
      } else {
        variables.onSuccess();
        toast.success(t("location_order_updated"));
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
      let errorMessage = t("failed_to_update_order");

      if (error && typeof error === "object" && "cause" in error) {
        const errorObj = error as { cause: unknown };
        const errorData = errorObj.cause as {
          results?: Array<{
            reference_id: string;
            status_code: number;
            data: {
              detail?: string;
              errors?: Array<{
                msg?: string;
                error?: string;
                detail?: string;
                type?: string;
                loc?: string[];
              }>;
            };
          }>;
        };

        if (errorData?.results) {
          const failedResults = errorData.results.filter(
            (result) => result.status_code >= 400,
          );

          if (failedResults.length > 0) {
            for (const result of failedResults) {
              if (result.data?.detail) {
                errorMessage = result.data.detail;
                break;
              }

              const errors = result.data?.errors || [];
              if (errors.length > 0) {
                const firstError = errors[0];
                errorMessage =
                  firstError.msg ||
                  firstError.error ||
                  firstError.detail ||
                  errorMessage;
                break;
              }
            }
          }
        }
      }

      toast.error(errorMessage);
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

    // Check if movement is possible
    if (targetIndex < 0 || targetIndex >= children.results.length) {
      return;
    }

    const targetLocation = children.results[targetIndex];

    // Swap sort_index values between the two locations
    updateLocationOrder({
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
      previousData: children,
      onSuccess: () => {
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
      },
    });
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
