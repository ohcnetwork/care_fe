import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { CardListWithHeaderSkeleton } from "@/components/Common/SkeletonLoading";
import { SupplyDeliveryRead } from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

interface SupplyDeliveryListProps {
  facilityId: string;
  locationId: string;
  selectedDelivery?: SupplyDeliveryRead;
  onSelectDelivery: (DeliveryId: string) => void;
  onSetNextDeliveryUrl?: (url: string) => void;
  mode: "internal" | "external";
}

export default function SupplyDeliveryList({
  facilityId,
  locationId,
  selectedDelivery,
  onSelectDelivery,
  onSetNextDeliveryUrl,
  mode,
}: SupplyDeliveryListProps) {
  const { t } = useTranslation();

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["supplyDeliveries", facilityId, locationId],
    queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        deliver_to: locationId,
        facility: facilityId,
        status: "in_progress",
        destination: locationId,
        ordering: "-created_date",
        ...(mode === "external"
          ? {
              origin_isnull: true,
              supplier: selectedDelivery?.supplier?.id,
            }
          : {
              origin: selectedDelivery?.origin?.id,
            }),
        limit: 200,
      },
    }),
    enabled: !!facilityId && !!locationId && !!selectedDelivery,
  });

  // Set next/previous delivery URL when list changes
  React.useEffect(() => {
    if (
      deliveries?.results?.length &&
      selectedDelivery &&
      onSetNextDeliveryUrl
    ) {
      const currentIndex = deliveries.results.findIndex(
        (d) => d.id === selectedDelivery.id,
      );
      // Try to get next delivery, if not available get previous one
      const nextDelivery =
        deliveries.results[currentIndex + 1] ||
        deliveries.results[currentIndex - 1];

      onSetNextDeliveryUrl(
        nextDelivery
          ? mode === "external"
            ? `/facility/${facilityId}/locations/${locationId}/external_supply/deliveries/${nextDelivery.id}`
            : `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_receive/${nextDelivery.id}`
          : "",
      );
    }
  }, [deliveries?.results, selectedDelivery?.id]);

  if (isLoading || !deliveries || !selectedDelivery) {
    return (
      <div className="grid grid-cols-1 gap-1">
        <CardListWithHeaderSkeleton count={1} />
      </div>
    );
  }

  if (!deliveries?.results?.length) {
    return null;
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] border-r">
      <div className="space-y-1 p-2">
        <span className="font-semibold">
          <span className="text-gray-600 font-medium">
            {t(mode === "external" ? "supplier" : "dispatched_from")}:
          </span>{" "}
          {mode === "external"
            ? selectedDelivery?.supplier?.name
            : selectedDelivery?.origin?.name}
        </span>
        {deliveries.results.map((delivery) => {
          const isSelected = selectedDelivery?.id === delivery.id;
          return (
            <Card
              key={delivery.id}
              className={cn(
                "rounded-md relative cursor-pointer transition-colors w-full",
                isSelected
                  ? "bg-white border-primary-600 shadow-md"
                  : "bg-gray-100 hover:bg-gray-100 shadow-none",
              )}
              onClick={() => onSelectDelivery(delivery.id)}
            >
              {isSelected && (
                <div className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
              )}
              <CardContent className="flex flex-col px-4 py-3 gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-start">
                      <span className="text-base font-medium">
                        {mode === "external"
                          ? delivery.supplied_item?.product_knowledge.name
                          : delivery.supplied_inventory_item?.product
                              .product_knowledge.name}
                      </span>
                      <span className="text-sm text-gray-700">
                        {formatDateTime(
                          delivery.created_date,
                          "DD/MM/YYYY hh:mm A",
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700">
                      {t("qty")}: {delivery.supplied_item_quantity}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
