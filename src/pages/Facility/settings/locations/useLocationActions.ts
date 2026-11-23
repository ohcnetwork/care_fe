import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useBatchRequest } from "@/Utils/request/batch";
import mutate from "@/Utils/request/mutate";
import { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

/** Deleting and reordering locations, with the lists refreshed afterwards. */
export function useLocationActions(facilityId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["locations", facilityId] });
    queryClient.invalidateQueries({ queryKey: ["location", facilityId] });
  };

  const { mutate: remove } = useMutation({
    mutationFn: (location: LocationRead) =>
      mutate(locationApi.delete, {
        pathParams: { facility_id: facilityId, id: location.id },
      })({}),
    onSuccess: () => {
      toast.success(t("location_removed_successfully"));
      refresh();
    },
  });

  const { mutateAsync: updateOrder } = useBatchRequest({});

  /**
   * Swaps a location with the one before or after it. `siblings` is the
   * list the location is shown in, in display order.
   */
  const move = async (
    siblings: LocationRead[],
    location: LocationRead,
    direction: "up" | "down",
  ) => {
    const index = siblings.findIndex((sibling) => sibling.id === location.id);
    const neighbour = siblings[direction === "up" ? index - 1 : index + 1];
    if (index < 0 || !neighbour) return;

    const swapped = [
      { ...location, sort_index: neighbour.sort_index },
      { ...neighbour, sort_index: location.sort_index },
    ];
    try {
      await updateOrder(
        swapped.map((item, position) => ({
          api: locationApi.update,
          pathParams: { facility_id: facilityId, id: item.id },
          referenceId: `location_${position}`,
          body: {
            ...item,
            location_type: { code: item.location_type?.code || "OTHER" },
          },
        })),
      );
    } catch {
      return;
    }
    toast.success(t("location_order_updated"));
    refresh();
  };

  return { remove, move, refresh };
}
