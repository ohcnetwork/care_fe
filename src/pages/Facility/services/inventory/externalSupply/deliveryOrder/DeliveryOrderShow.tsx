import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { AddSupplyDeliveryForm } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm";

import {
  DELIVERY_ORDER_STATUS_COLORS,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import {
  SUPPLY_DELIVERY_CONDITION_COLORS,
  SUPPLY_DELIVERY_STATUS_COLORS,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Link } from "raviger";

interface Props {
  facilityId: string;
  deliveryOrderId: string;
}

export function DeliveryOrderShow({ facilityId, deliveryOrderId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [qParams] = useQueryParams();

  const { data: deliveryOrder, isLoading } = useQuery({
    queryKey: ["deliveryOrders", deliveryOrderId],
    queryFn: query(deliveryOrderApi.retrieveDeliveryOrder, {
      pathParams: {
        facilityId: facilityId,
        deliveryOrderId: deliveryOrderId,
      },
    }),
  });

  const { data: supplyDeliveries, isLoading: isLoadingSupplyDeliveries } =
    useQuery({
      queryKey: ["supplyDeliveries", deliveryOrderId],
      queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
        queryParams: {
          order: deliveryOrderId,
          facility: facilityId,
        },
      }),
      enabled: !!deliveryOrderId,
    });

  // Load supply requests when supplyOrder query parameter is present
  const { data: supplyRequests, isLoading: isLoadingSupplyRequests } = useQuery(
    {
      queryKey: ["supplyRequests", qParams.supplyOrder],
      queryFn: query(supplyRequestApi.listSupplyRequest, {
        queryParams: {
          order: qParams.supplyOrder,
        },
      }),
      enabled: !!qParams.supplyOrder,
    },
  );

  const { mutate: updateDeliveryOrder, isPending: isUpdating } = useMutation({
    mutationFn: mutate(deliveryOrderApi.updateDeliveryOrder, {
      pathParams: {
        facilityId: facilityId,
        deliveryOrderId: deliveryOrderId,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deliveryOrders", deliveryOrderId],
      });
      toast.success(t("order_updated_successfully"));
    },
    onError: (_error) => {
      toast.error(t("error_updating_order"));
    },
  });

  function handleSupplyDeliverySuccess() {
    queryClient.invalidateQueries({
      queryKey: ["supplyDeliveries", deliveryOrderId],
    });
  }

  function handleMarkAsApproved() {
    if (!deliveryOrder) return;

    updateDeliveryOrder({
      ...deliveryOrder,
      status: DeliveryOrderStatus.pending,
      supplier: deliveryOrder.supplier?.id || "",
      origin: deliveryOrder.origin?.id || undefined,
      destination: deliveryOrder.destination.id,
    });
  }

  function handleMarkAsComplete() {
    if (!deliveryOrder) return;

    updateDeliveryOrder({
      ...deliveryOrder,
      status: DeliveryOrderStatus.completed,
      supplier: deliveryOrder.supplier?.id || "",
      origin: deliveryOrder.origin?.id || undefined,
      destination: deliveryOrder.destination.id,
    });
  }

  if (isLoading) {
    return (
      <Page title={t("delivery_order_details")} hideTitleOnPage>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </Page>
    );
  }

  if (!deliveryOrder) {
    return (
      <Page title={t("delivery_order_details")} hideTitleOnPage>
        <div className="space-y-4">
          <div className="text-center py-8">
            <p className="text-gray-500">{t("delivery_order_not_found")}</p>
          </div>
        </div>
      </Page>
    );
  }

  const canAddSupplyDeliveries =
    deliveryOrder.status === DeliveryOrderStatus.draft;

  return (
    <Page
      title={t("delivery_order_details")}
      hideTitleOnPage
      shortCutContext="facility:inventory:delivery"
    >
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`${deliveryOrderId}/edit`}>{t("edit")}</Link>
            </Button>
            {deliveryOrder.status === DeliveryOrderStatus.draft && (
              <Button onClick={handleMarkAsApproved} disabled={isUpdating}>
                {isUpdating ? t("updating") : t("mark_as_approved")}
              </Button>
            )}
            {deliveryOrder.status === DeliveryOrderStatus.pending && (
              <Button onClick={handleMarkAsComplete} disabled={isUpdating}>
                {isUpdating ? t("updating") : t("mark_as_complete")}
              </Button>
            )}
          </div>
        </div>
        {/* Delivery Order Details */}
        <Card>
          <CardHeader>
            <div className="flex md:flex-row flex-col justify-between">
              <CardTitle className="text-xl">{deliveryOrder.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={DELIVERY_ORDER_STATUS_COLORS[deliveryOrder.status]}
                >
                  {t(deliveryOrder.status)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {deliveryOrder.note && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("notes")}
                </label>
                <p className="text-sm">{deliveryOrder.note}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("destination")}
                </label>
                <p className="text-sm">{deliveryOrder.destination.name}</p>
              </div>
              {deliveryOrder.supplier && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("supplier")}
                  </label>
                  <p className="text-sm">{deliveryOrder.supplier.name}</p>
                </div>
              )}
              {deliveryOrder.origin && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("origin")}
                  </label>
                  <p className="text-sm">{deliveryOrder.origin.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supply Deliveries Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("supply_deliveries")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSupplyDeliveries ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Existing Supply Deliveries Table */}
                {supplyDeliveries?.results &&
                  supplyDeliveries.results.length > 0 && (
                    <div className="space-y-4">
                      <div className="rounded-md overflow-x-auto border-2 border-white shadow-md">
                        <Table className="rounded-lg border shadow-sm w-full bg-white">
                          <TableHeader className="bg-gray-100">
                            <TableRow className="border-b">
                              <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                                {t("item")}
                              </TableHead>
                              <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                                {t("quantity")}
                              </TableHead>
                              <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                                {t("status")}
                              </TableHead>
                              <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                                {t("condition")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="bg-white">
                            {supplyDeliveries.results.map((supplyDelivery) => (
                              <TableRow
                                key={supplyDelivery.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <TableCell className="border-x p-3 text-gray-950">
                                  <Link
                                    href={`/external_supply/deliveries/${supplyDelivery.id}`}
                                  >
                                    <div className="font-medium">
                                      {supplyDelivery.supplied_item
                                        ?.product_knowledge?.name ||
                                        supplyDelivery.supplied_inventory_item
                                          ?.product?.product_knowledge?.name}
                                    </div>
                                  </Link>
                                </TableCell>
                                <TableCell className="border-x p-3 text-gray-950">
                                  {supplyDelivery.supplied_item_quantity}
                                </TableCell>
                                <TableCell className="border-x p-3 text-gray-950">
                                  <Badge
                                    variant={
                                      SUPPLY_DELIVERY_STATUS_COLORS[
                                        supplyDelivery.status
                                      ]
                                    }
                                  >
                                    {t(supplyDelivery.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="border-x p-3 text-gray-950">
                                  {supplyDelivery.supplied_item_condition && (
                                    <Badge
                                      variant={
                                        SUPPLY_DELIVERY_CONDITION_COLORS[
                                          supplyDelivery.supplied_item_condition
                                        ] as "secondary" | "destructive"
                                      }
                                    >
                                      {t(
                                        supplyDelivery.supplied_item_condition,
                                      )}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                {/* Add New Supply Delivery Form - Always show when in draft mode */}
                {canAddSupplyDeliveries && !isLoadingSupplyRequests && (
                  <AddSupplyDeliveryForm
                    deliveryOrderId={deliveryOrderId}
                    facilityId={facilityId}
                    origin={deliveryOrder.origin?.id}
                    destination={deliveryOrder.destination.id}
                    onSuccess={handleSupplyDeliverySuccess}
                    supplyRequests={supplyRequests?.results || []}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
