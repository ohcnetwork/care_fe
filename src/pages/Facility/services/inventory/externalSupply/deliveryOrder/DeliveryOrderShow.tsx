import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, X } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";
import Page from "@/components/Common/Page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import useFilters from "@/hooks/useFilters";
import { AddSupplyDeliveryForm } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { SupplyDeliveryTable } from "@/pages/Facility/services/inventory/SupplyDeliveryTable";
import {
  DELIVERY_ORDER_STATUS_COLORS,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface Props {
  facilityId: string;
  deliveryOrderId: string;
  locationId: string;
  internal: boolean;
}

export function DeliveryOrderShow({
  facilityId,
  deliveryOrderId,
  locationId,
  internal,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [qParams] = useQueryParams();
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    status: SupplyDeliveryStatus.completed,
    condition: SupplyDeliveryCondition.normal,
  });
  const [showAllDeliveries, setShowAllDeliveries] = useState(false);
  const [selectedProductKnowledge, setSelectedProductKnowledge] =
    useState<ProductKnowledgeBase>();
  const [selectedProductKnowledgeDrawer, setSelectedProductKnowledgeDrawer] =
    useState<ProductKnowledgeBase>();
  const {
    qParams: filterParams,
    updateQuery,
    Pagination,
    resultsPerPage,
  } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
    disableCache: true,
  });

  const { data: deliveryOrder, isLoading } = useQuery({
    queryKey: ["deliveryOrders", deliveryOrderId],
    queryFn: query(deliveryOrderApi.retrieveDeliveryOrder, {
      pathParams: {
        facilityId: facilityId,
        deliveryOrderId: deliveryOrderId,
      },
    }),
  });

  const isRequester = locationId === deliveryOrder?.destination.id;

  const { data: supplyDeliveries, isLoading: isLoadingSupplyDeliveries } =
    useQuery({
      queryKey: [
        "supplyDeliveries",
        deliveryOrderId,
        filterParams,
        selectedProductKnowledge?.id,
      ],
      queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
        queryParams: {
          order: deliveryOrderId,
          facility: facilityId,
          limit: resultsPerPage,
          offset: ((filterParams.page ?? 1) - 1) * resultsPerPage,
          ...(internal
            ? {
                supplied_inventory_item_product_knowledge:
                  selectedProductKnowledge?.id,
              }
            : {
                supplied_item_product_knowledge: selectedProductKnowledge?.id,
              }),
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

  // Query for all supply deliveries related to this delivery order
  const { data: allSupplyDeliveries, isLoading: isLoadingAllSupplyDeliveries } =
    useQuery({
      queryKey: [
        "allSupplyDeliveries",
        deliveryOrder?.supplier?.id,
        locationId,
        selectedProductKnowledgeDrawer?.id,
      ],
      queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
        queryParams: {
          facility: facilityId,
          ...(internal
            ? {
                supplied_inventory_item_product_knowledge:
                  selectedProductKnowledgeDrawer?.id,
              }
            : {
                supplied_item_product_knowledge:
                  selectedProductKnowledgeDrawer?.id,
              }),
          ...(internal
            ? {
                ...(isRequester
                  ? { destination: locationId }
                  : { origin: locationId }),
              }
            : {
                supplier: deliveryOrder?.supplier?.id,
              }),
        },
      }),
      enabled: !!deliveryOrderId && showAllDeliveries,
    });

  const { mutate: upsertSupplyDeliveries, isPending: isUpsertingDeliveries } =
    useMutation({
      mutationFn: mutate(supplyDeliveryApi.upsertSupplyDelivery),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["supplyDeliveries", deliveryOrderId],
        });
        toast.success(t("supply_deliveries_updated_successfully"));
      },
      onError: (_error) => {
        toast.error(t("error_updating_supply_deliveries"));
      },
    });

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

  function handleUpdateDeliveryOrderStatus(status: DeliveryOrderStatus) {
    if (!deliveryOrder) return;

    updateDeliveryOrder({
      ...deliveryOrder,
      status,
      supplier: deliveryOrder.supplier?.id || undefined,
      origin: deliveryOrder.origin?.id || undefined,
      destination: deliveryOrder.destination.id,
    });
  }

  function handleMarkAsAbandoned() {
    if (!supplyDeliveries?.results) return;

    const selectedSupplyDeliveries = supplyDeliveries.results
      .filter((delivery) => selectedDeliveries.includes(delivery.id))
      .map((delivery) => ({
        id: delivery.id,
        status: SupplyDeliveryStatus.abandoned,
        supplied_item_quantity: delivery.supplied_item_quantity,
        supplied_item_condition: delivery.supplied_item_condition,
        supplied_item_type: delivery.supplied_item_type,
        supply_request: delivery.supply_request?.id,
      }));

    if (selectedSupplyDeliveries.length === 0) {
      toast.error(t("please_select_at_least_one_delivery"));
      return;
    }

    upsertSupplyDeliveries({
      datapoints: selectedSupplyDeliveries,
    });
    setSelectedDeliveries([]);
  }

  function handleMarkAsDamaged() {
    if (!supplyDeliveries?.results) return;

    const selectedSupplyDeliveries = supplyDeliveries.results
      .filter((delivery) => selectedDeliveries.includes(delivery.id))
      .map((delivery) => ({
        id: delivery.id,
        status: SupplyDeliveryStatus.completed,
        supplied_item_quantity: delivery.supplied_item_quantity,
        supplied_item_condition: SupplyDeliveryCondition.damaged,
        supplied_item_type: delivery.supplied_item_type,
        supply_request: delivery.supply_request?.id,
      }));

    if (selectedSupplyDeliveries.length === 0) {
      toast.error(t("please_select_at_least_one_delivery"));
      return;
    }

    upsertSupplyDeliveries({
      datapoints: selectedSupplyDeliveries,
    });
    setSelectedDeliveries([]);
  }

  function handleSubmitDialog() {
    if (!supplyDeliveries?.results) return;

    const selectedSupplyDeliveries = supplyDeliveries.results
      .filter((delivery) => selectedDeliveries.includes(delivery.id))
      .map((delivery) => ({
        id: delivery.id,
        status: confirmDialog.status,
        supplied_item: delivery.supplied_item?.id,
        supplied_inventory_item: delivery.supplied_inventory_item?.id,
        supplied_item_quantity: delivery.supplied_item_quantity,
        supplied_item_condition: confirmDialog.condition,
        supplied_item_type: delivery.supplied_item_type,
        supply_request: delivery.supply_request?.id,
      }));

    upsertSupplyDeliveries({
      datapoints: selectedSupplyDeliveries,
    });
    setSelectedDeliveries([]);
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }

  function handleConfirmUpdateStock() {
    if (!supplyDeliveries?.results) return;

    if (selectedDeliveries.length === 0) {
      toast.error(t("please_select_at_least_one_delivery"));
      return;
    }

    setConfirmDialog({
      open: true,
      status: SupplyDeliveryStatus.completed,
      condition: SupplyDeliveryCondition.normal,
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
              <Button
                onClick={() =>
                  handleUpdateDeliveryOrderStatus(DeliveryOrderStatus.pending)
                }
                disabled={isUpdating}
              >
                {isUpdating ? t("updating") : t("mark_as_approved")}
              </Button>
            )}
            {deliveryOrder.status === DeliveryOrderStatus.pending &&
              isRequester && (
                <Button
                  onClick={() =>
                    handleUpdateDeliveryOrderStatus(
                      DeliveryOrderStatus.completed,
                    )
                  }
                  disabled={isUpdating}
                >
                  {isUpdating ? t("updating") : t("mark_as_completed")}
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
          <CardHeader className="text-lg flex flex-row justify-between">
            <CardTitle>{t("supply_deliveries")}</CardTitle>
            <div className="flex gap-2">
              <div className="flex items-center">
                <div>
                  <ProductKnowledgeSelect
                    value={selectedProductKnowledge}
                    onChange={(value) => {
                      setSelectedProductKnowledge(value);
                      updateQuery({ page: 1 }); // Reset to first page when filter changes
                    }}
                    placeholder={t("filter_by_product")}
                  />
                </div>
                {selectedProductKnowledge && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedProductKnowledge(undefined);
                      updateQuery({ page: 1 });
                    }}
                  >
                    <X className="h-4 w-4" />
                    {t("clear")}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAllDeliveries(true)}
                >
                  {t("view_all_deliveries")}
                </Button>

                {deliveryOrder.status === DeliveryOrderStatus.pending &&
                  isRequester && (
                    <>
                      <Button
                        onClick={handleConfirmUpdateStock}
                        className="h-10"
                        disabled={
                          isUpdating ||
                          isUpsertingDeliveries ||
                          selectedDeliveries.length === 0
                        }
                      >
                        {isUpsertingDeliveries
                          ? t("updating")
                          : t("confirm_update_stock")}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={handleMarkAsAbandoned}
                            disabled={
                              isUpdating ||
                              isUpsertingDeliveries ||
                              selectedDeliveries.length === 0
                            }
                          >
                            {t("mark_as_abandoned")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleMarkAsDamaged}
                            disabled={
                              isUpdating ||
                              isUpsertingDeliveries ||
                              selectedDeliveries.length === 0
                            }
                          >
                            {t("mark_as_damaged")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
              </div>
            </div>
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
                      <SupplyDeliveryTable
                        deliveries={supplyDeliveries.results}
                        showCheckbox={
                          deliveryOrder.status ===
                            DeliveryOrderStatus.pending && isRequester
                        }
                        selectedDeliveries={selectedDeliveries}
                        onDeliverySelect={(deliveryId, checked) => {
                          if (checked) {
                            setSelectedDeliveries([
                              ...selectedDeliveries,
                              deliveryId,
                            ]);
                          } else {
                            setSelectedDeliveries(
                              selectedDeliveries.filter(
                                (id) => id !== deliveryId,
                              ),
                            );
                          }
                        }}
                        onSelectAll={(checked) => {
                          if (checked) {
                            setSelectedDeliveries(
                              supplyDeliveries.results
                                .filter(
                                  (d) =>
                                    d.status ===
                                    SupplyDeliveryStatus.in_progress,
                                )
                                .map((d) => d.id),
                            );
                          } else {
                            setSelectedDeliveries([]);
                          }
                        }}
                        internal={internal}
                        onDeliveryClick={(delivery) => {
                          setShowAllDeliveries(true);
                          setSelectedProductKnowledgeDrawer(
                            internal
                              ? delivery.supplied_inventory_item?.product
                                  ?.product_knowledge
                              : delivery.supplied_item?.product_knowledge,
                          );
                        }}
                      />
                      {supplyDeliveries && (
                        <Pagination totalCount={supplyDeliveries.count} />
                      )}
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

        <Drawer open={showAllDeliveries} onOpenChange={setShowAllDeliveries}>
          <DrawerContent className="max-w-7xl mx-auto px-4 sm:px-16 pb-10 ">
            <DrawerHeader>
              <DrawerTitle>{t("all_deliveries")}</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <div>
                  <ProductKnowledgeSelect
                    value={selectedProductKnowledgeDrawer}
                    onChange={(value) => {
                      setSelectedProductKnowledgeDrawer(value);
                    }}
                    placeholder={t("filter_by_product")}
                  />
                </div>
                {selectedProductKnowledgeDrawer && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedProductKnowledgeDrawer(undefined);
                    }}
                  >
                    <X className="h-4 w-4" />
                    {t("clear")}
                  </Button>
                )}
              </div>
              {isLoadingAllSupplyDeliveries ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : allSupplyDeliveries?.results &&
                allSupplyDeliveries.results.length > 0 ? (
                <SupplyDeliveryTable
                  deliveries={allSupplyDeliveries.results}
                  internal={internal}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">{t("no_deliveries_found")}</p>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>

        <Dialog
          open={confirmDialog.open}
          onOpenChange={(open) =>
            setConfirmDialog((prev) => ({ ...prev, open }))
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("confirm_update_stock")}</DialogTitle>
              <DialogDescription>
                {t("apply_updates_selected", {
                  count: selectedDeliveries.length,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 bg-gray-50 p-4 rounded-md">
              <div className="space-y-4">
                <Label>{t("receiving_status")}</Label>
                <RadioGroup
                  value={confirmDialog.status}
                  onValueChange={(value: SupplyDeliveryStatus) =>
                    setConfirmDialog((prev) => ({ ...prev, status: value }))
                  }
                  className="flex flex-wrap gap-3"
                >
                  <Label
                    htmlFor={SupplyDeliveryStatus.completed}
                    className="flex items-center justify-center px-4 py-3 rounded-md border-[1.5px] cursor-pointer transition-all border-gray-300 bg-white hover:border-gray-400"
                  >
                    <RadioGroupItem
                      value={SupplyDeliveryStatus.completed}
                      id={SupplyDeliveryStatus.completed}
                    />
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{t("completed")}</span>
                    </div>
                  </Label>
                  <Label
                    htmlFor={SupplyDeliveryStatus.abandoned}
                    className="flex items-center justify-center px-4 py-3 rounded-md border-[1.5px] cursor-pointer transition-all border-gray-300 bg-white hover:border-gray-400"
                  >
                    <RadioGroupItem
                      value={SupplyDeliveryStatus.abandoned}
                      id={SupplyDeliveryStatus.abandoned}
                    />
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{t("abandoned")}</span>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {confirmDialog.status === SupplyDeliveryStatus.completed && (
                <div className="space-y-4">
                  <Label>{t("item_condition")}</Label>
                  <RadioGroup
                    value={confirmDialog.condition}
                    onValueChange={(value: SupplyDeliveryCondition) =>
                      setConfirmDialog((prev) => ({
                        ...prev,
                        condition: value,
                      }))
                    }
                    className="flex flex-wrap gap-3"
                  >
                    <Label
                      htmlFor={SupplyDeliveryCondition.normal}
                      className="flex items-center justify-center px-4 py-3 rounded-md border-[1.5px] cursor-pointer transition-all border-gray-300 bg-white hover:border-gray-400"
                    >
                      <RadioGroupItem
                        value={SupplyDeliveryCondition.normal}
                        id={SupplyDeliveryCondition.normal}
                      />
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{t("normal")}</span>
                      </div>
                    </Label>
                    <Label
                      htmlFor={SupplyDeliveryCondition.damaged}
                      className="flex items-center justify-center px-4 py-3 rounded-md border-[1.5px] cursor-pointer transition-all border-gray-300 bg-white hover:border-gray-400"
                    >
                      <RadioGroupItem
                        value={SupplyDeliveryCondition.damaged}
                        id={SupplyDeliveryCondition.damaged}
                      />
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{t("damaged")}</span>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmDialog((prev) => ({ ...prev, open: false }))
                }
              >
                {t("cancel")}
              </Button>
              <Button
                variant={
                  confirmDialog.status === SupplyDeliveryStatus.abandoned
                    ? "destructive"
                    : "primary"
                }
                onClick={handleSubmitDialog}
                disabled={isUpsertingDeliveries}
              >
                {isUpsertingDeliveries ? t("updating") : t("confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Page>
  );
}
