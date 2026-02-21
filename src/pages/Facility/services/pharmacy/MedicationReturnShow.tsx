import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChevronLeft,
  Edit,
  EllipsisVertical,
  ExternalLink,
  MoreVertical,
  Printer,
  Truck,
} from "lucide-react";
import { Link, navigate, useQueryParams } from "raviger";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";
import BackButton from "@/components/Common/BackButton";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { AddMedicationReturnItemForm } from "@/pages/Facility/services/pharmacy/components/AddMedicationReturnItemForm";
import { MedicationReturnItemsTable } from "@/pages/Facility/services/pharmacy/components/MedicationReturnItemsTable";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import {
  DELIVERY_ORDER_STATUS_COLORS,
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
  DeliveryOrderUpdate,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface Props {
  facilityId: string;
  deliveryOrderId: string;
  locationId: string;
}

export default function MedicationReturnShow({
  facilityId,
  deliveryOrderId,
  locationId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    status: SupplyDeliveryStatus.completed,
    condition: SupplyDeliveryCondition.normal,
  });
  const [deliveryOrderStatusDialog, setDeliveryOrderStatusDialog] = useState<{
    open: boolean;
    status: DeliveryOrderStatus | null;
  }>({
    open: false,
    status: null,
  });
  const [{ dispenseOrderIds: dispenseOrderIdsParam }] = useQueryParams<{
    dispenseOrderIds?: string;
  }>();

  const dispenseOrderIds =
    dispenseOrderIdsParam?.split(",").filter(Boolean) || [];

  const { data: deliveryOrder, isLoading } = useQuery({
    queryKey: ["medicationReturns", deliveryOrderId],
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
      queryFn: query.paginated(supplyDeliveryApi.listSupplyDelivery, {
        queryParams: {
          order: deliveryOrderId,
          facility: facilityId,
        },
      }),
      enabled: !!deliveryOrderId,
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
      onError: () => {
        toast.error(t("error_updating_supply_deliveries"));
      },
    });

  const { mutate: updateDeliveryOrder, isPending: isUpdating } = useMutation<
    DeliveryOrderRetrieve,
    Error,
    DeliveryOrderUpdate
  >({
    mutationFn: mutate(deliveryOrderApi.updateDeliveryOrder, {
      pathParams: {
        facilityId: facilityId,
        deliveryOrderId: deliveryOrderId,
      },
    }),
    onSuccess: (updatedDeliveryOrder: DeliveryOrderRetrieve) => {
      queryClient.invalidateQueries({
        queryKey: ["medicationReturns", deliveryOrderId],
      });

      toast.success(
        updatedDeliveryOrder.status === DeliveryOrderStatus.pending
          ? t("order_marked_as_approved_successfully")
          : t("order_marked_as_successfully_toast", {
              status: t(updatedDeliveryOrder.status),
            }),
      );
    },
  });

  const { data: medicationDispenses } = useQueries({
    queries: dispenseOrderIds.map((orderId) => ({
      queryKey: ["medication_dispense", orderId, locationId],
      queryFn: query(medicationDispenseApi.list, {
        queryParams: {
          location: locationId,
          limit: 100,
          order: orderId,
        },
      }),
      enabled: !!orderId && !!locationId,
    })),
    combine: (results) => {
      return {
        data: results.flatMap((result) => result.data?.results || []),
        loading: results.some((result) => result.isLoading),
      };
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
        extensions: delivery.extensions,
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
        extensions: delivery.extensions,
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
      .filter(
        (delivery) => delivery.status === SupplyDeliveryStatus.in_progress,
      )
      .map((delivery) => ({
        id: delivery.id,
        status: confirmDialog.status,
        supplied_item: delivery.supplied_item?.id,
        supplied_inventory_item: delivery.supplied_inventory_item?.id,
        supplied_item_quantity: delivery.supplied_item_quantity,
        supplied_item_condition: confirmDialog.condition,
        supplied_item_type: delivery.supplied_item_type,
        supply_request: delivery.supply_request?.id,
        extensions: delivery.extensions,
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

  const basePath = `/facility/${facilityId}/locations/${locationId}/medication_return`;

  if (isLoading) {
    return (
      <Page title={t("medication_return")} hideTitleOnPage>
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
      <Page title={t("medication_return")} hideTitleOnPage>
        <div className="space-y-4">
          <div className="text-center py-8">
            <p className="text-gray-500">{t("medication_return_not_found")}</p>
          </div>
        </div>
      </Page>
    );
  }

  const canAddSupplyDeliveries =
    deliveryOrder.status === DeliveryOrderStatus.draft;

  return (
    <Page
      title={t("medication_return")}
      hideTitleOnPage
      className="max-w-[100vw] mx-auto"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <BackButton size="icon" className="shrink-0" to={basePath}>
              <ChevronLeft />
            </BackButton>
            <div>
              <h4>{deliveryOrder.name}</h4>
              {deliveryOrder.patient && (
                <p className="text-sm text-gray-700">
                  <Trans
                    i18nKey="medication_return_for_patient"
                    values={{
                      patient: deliveryOrder.patient.name,
                    }}
                    components={{
                      strong: <span className="font-semibold text-gray-700" />,
                    }}
                  />
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            {deliveryOrder.status === DeliveryOrderStatus.completed && (
              <Button variant="outline" asChild>
                <Link
                  href={`${basePath}/order/${deliveryOrderId}/print`}
                  basePath="/"
                >
                  <Printer className="size-4" /> {t("print")}
                </Link>
              </Button>
            )}

            {deliveryOrder.status === DeliveryOrderStatus.draft && (
              <Button variant="outline" asChild>
                <Link
                  basePath="/"
                  href={`${basePath}/order/${deliveryOrderId}/edit`}
                >
                  <Edit /> {t("edit")}
                  <ShortcutBadge actionId="edit-order" />
                </Link>
              </Button>
            )}

            {deliveryOrder.status === DeliveryOrderStatus.draft && (
              <Button
                onClick={() =>
                  handleUpdateDeliveryOrderStatus(DeliveryOrderStatus.pending)
                }
                disabled={isUpdating || supplyDeliveries?.results.length === 0}
              >
                {isUpdating ? t("updating") : t("mark_as_approved")}
                <ShortcutBadge actionId="mark-as" />
              </Button>
            )}
            {deliveryOrder.status === DeliveryOrderStatus.pending && (
              <Button
                onClick={() =>
                  handleUpdateDeliveryOrderStatus(DeliveryOrderStatus.completed)
                }
                disabled={isUpdating || selectedDeliveries.length !== 0}
              >
                {isUpdating ? t("updating") : t("mark_as_completed")}
                <ShortcutBadge actionId="mark-as" />
              </Button>
            )}

            {deliveryOrder.status === DeliveryOrderStatus.draft && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <EllipsisVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setDeliveryOrderStatusDialog({
                          open: true,
                          status: DeliveryOrderStatus.entered_in_error,
                        })
                      }
                      disabled={isUpdating}
                      className="w-full flex justify-stretch"
                    >
                      <CareIcon icon="l-exclamation-circle" />
                      <span>{t("mark_as_entered_in_error")}</span>
                    </Button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setDeliveryOrderStatusDialog({
                          open: true,
                          status: DeliveryOrderStatus.abandoned,
                        })
                      }
                      disabled={isUpdating}
                      className="w-full flex justify-stretch"
                    >
                      <CareIcon icon="l-ban" />
                      <span>{t("mark_as_abandoned")}</span>
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Medication Return Details */}
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {deliveryOrder.patient && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("patient")}
                  </label>
                  <div className="text-lg font-semibold text-gray-950">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-lg font-semibold"
                      onClick={() =>
                        navigate(`/patient/${deliveryOrder.patient?.id}`)
                      }
                    >
                      {deliveryOrder.patient.name}
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("return_to")}
                </label>
                <div className="text-lg font-semibold text-gray-950">
                  {deliveryOrder.destination.name}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("status")}
                </label>
                <div>
                  <Badge
                    className="rounded-sm"
                    variant={DELIVERY_ORDER_STATUS_COLORS[deliveryOrder.status]}
                  >
                    {t(deliveryOrder.status)}
                  </Badge>
                </div>
              </div>

              {deliveryOrder.note && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("note")}
                  </label>
                  <p className="text-sm whitespace-pre-wrap">
                    {deliveryOrder.note}
                  </p>
                </div>
              )}

              {deliveryOrder.patient_invoice_id && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("invoice")}
                  </label>
                  <div>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary-600 font-semibold"
                      onClick={() => {
                        // Filter out the return invoice itself from related invoices
                        const relatedInvoiceIds = [
                          ...new Set(
                            medicationDispenses.flatMap(
                              (item) =>
                                item.charge_item?.paid_invoice?.id ?? [],
                            ) || [],
                          ),
                        ].filter(
                          (id) => id !== deliveryOrder.patient_invoice_id,
                        );
                        const queryParams = new URLSearchParams({
                          sourceUrl: basePath + "/order/" + deliveryOrderId,
                        });
                        if (relatedInvoiceIds.length > 0) {
                          queryParams.set(
                            "relatedInvoices",
                            relatedInvoiceIds.join(","),
                          );
                        }
                        navigate(
                          `/facility/${facilityId}/billing/invoices/${deliveryOrder.patient_invoice_id}?${queryParams.toString()}`,
                        );
                      }}
                    >
                      {t("view_invoice")}
                      <ExternalLink className="ml-1 size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supply Deliveries Section */}
        <Card>
          <CardHeader className="text-lg flex flex-row justify-between">
            <CardTitle>
              {deliveryOrder.status === DeliveryOrderStatus.completed
                ? t("items_returned")
                : t("items_to_return")}
            </CardTitle>
            <div className="flex items-center gap-2">
              {deliveryOrder.status === DeliveryOrderStatus.pending && (
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
                      : t("receive_update_stock")}
                    <ShortcutBadge actionId="enter-action" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10">
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
          </CardHeader>
          <CardContent className="p-2">
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
                {supplyDeliveries?.results &&
                supplyDeliveries.results.length > 0 ? (
                  <div className="space-y-4">
                    <MedicationReturnItemsTable
                      deliveries={supplyDeliveries.results}
                      showCheckbox={
                        deliveryOrder.status === DeliveryOrderStatus.pending
                      }
                      autoSelectOnMount={
                        deliveryOrder.status === DeliveryOrderStatus.pending
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
                                  d.status === SupplyDeliveryStatus.in_progress,
                              )
                              .map((d) => d.id),
                          );
                        } else {
                          setSelectedDeliveries([]);
                        }
                      }}
                      deliveryOrderStatus={deliveryOrder.status}
                    />
                  </div>
                ) : (
                  <EmptyState
                    icon={<Truck className="size-5 text-primary-600" />}
                    title={t("no_items_added")}
                    description={t("add_items_to_return")}
                  />
                )}

                {canAddSupplyDeliveries && (
                  <AddMedicationReturnItemForm
                    deliveryOrderId={deliveryOrderId}
                    facilityId={facilityId}
                    locationId={locationId}
                    onSuccess={handleSupplyDeliverySuccess}
                    medicationDispenses={
                      dispenseOrderIds.length > 0 ? medicationDispenses : []
                    }
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={confirmDialog.open}
          onOpenChange={(open) =>
            setConfirmDialog((prev) => ({ ...prev, open }))
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("receive_update_stock")}</DialogTitle>
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
                <ShortcutBadge actionId="submit-action" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmActionDialog
          open={deliveryOrderStatusDialog.open}
          onOpenChange={(open) =>
            setDeliveryOrderStatusDialog((prev) => ({ ...prev, open }))
          }
          title={
            deliveryOrderStatusDialog.status ===
            DeliveryOrderStatus.entered_in_error
              ? t("mark_as_entered_in_error")
              : t("mark_as_abandoned")
          }
          description={
            deliveryOrderStatusDialog.status ===
            DeliveryOrderStatus.entered_in_error
              ? t("mark_order_as_entered_in_error_confirmation_description")
              : t("mark_order_as_abandoned_confirmation_description")
          }
          confirmText={t("confirm")}
          variant="destructive"
          onConfirm={() => {
            if (deliveryOrderStatusDialog.status) {
              handleUpdateDeliveryOrderStatus(deliveryOrderStatusDialog.status);
            }
            setDeliveryOrderStatusDialog({ open: false, status: null });
          }}
          disabled={isUpdating}
        />
      </div>
    </Page>
  );
}
