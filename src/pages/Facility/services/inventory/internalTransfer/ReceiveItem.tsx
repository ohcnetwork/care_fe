import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { AlertTriangleIcon, CheckIcon } from "lucide-react";
import { navigate } from "raviger";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import Page from "@/components/Common/Page";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryUpdate,
  getSupplyDeliveryConditionBadgeColor,
  getSupplyDeliveryStatusBadgeColor,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import {
  SupplyRequestCreate,
  SupplyRequestStatus,
  getSupplyRequestStatusBadgeColor,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

const receiveItemSchema = z.object({
  condition: z.nativeEnum(SupplyDeliveryCondition),
  receivingStatus: z.nativeEnum(SupplyDeliveryStatus),
  markAsFullyReceived: z.boolean(),
});

type ReceiveItemForm = z.infer<typeof receiveItemSchema>;

interface Props {
  facilityId: string;
  locationId: string;
  deliveryId: string;
}

export default function ReceiveItem({
  facilityId,
  locationId,
  deliveryId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<ReceiveItemForm>({
    resolver: zodResolver(receiveItemSchema),
    defaultValues: {
      condition: SupplyDeliveryCondition.normal,
      receivingStatus: SupplyDeliveryStatus.completed,
      markAsFullyReceived: false,
    },
  });

  const { data: delivery, isLoading } = useQuery({
    queryKey: ["supplyDelivery", deliveryId],
    queryFn: query(supplyDeliveryApi.retrieveSupplyDelivery, {
      pathParams: { supplyDeliveryId: deliveryId },
    }),
    enabled: !!deliveryId,
  });

  const { mutate: updateSupplyDelivery, isPending: isUpdatingDelivery } =
    useMutation({
      mutationFn: mutate(supplyDeliveryApi.updateSupplyDelivery, {
        pathParams: { supplyDeliveryId: deliveryId },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["supplyDeliveries"],
        });
        queryClient.invalidateQueries({
          queryKey: ["supplyDelivery", deliveryId],
        });
      },
    });

  const { mutate: updateSupplyRequest, isPending: isUpdatingRequest } =
    useMutation({
      mutationFn: mutate(supplyRequestApi.updateSupplyRequest, {
        pathParams: { supplyRequestId: delivery?.supply_request?.id || "" },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["supplyRequests"],
        });
      },
    });

  const handleSubmit = async (data: ReceiveItemForm) => {
    if (!delivery) return;

    try {
      // Update supply delivery
      updateSupplyDelivery({
        status: data.receivingStatus,
        supplied_item_condition: data.condition,
      } satisfies SupplyDeliveryUpdate);

      // Update supply request if checkbox is checked
      if (data.markAsFullyReceived && delivery.supply_request) {
        updateSupplyRequest({
          status: SupplyRequestStatus.completed,
          intent: delivery.supply_request.intent,
          category: delivery.supply_request.category,
          priority: delivery.supply_request.priority,
          reason: delivery.supply_request.reason,
          quantity: delivery.supply_request.quantity,
          deliver_from: delivery.supply_request.deliver_from?.id,
          deliver_to: delivery.supply_request.deliver_to.id,
          item: delivery.supply_request.item.id,
        } satisfies SupplyRequestCreate);
      }

      toast.success(t("item_marked_as_received"));
      navigate(
        `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_receive`,
      );
    } catch {
      toast.error(t("error_updating_delivery"));
    }
  };

  const handleCancel = () => {
    navigate(
      `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_receive`,
    );
  };

  if (isLoading || !delivery) {
    return (
      <Page title={t("to_receive")} hideTitleOnPage>
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("to_receive")}
            </h1>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">{t("loading")}</div>
          </div>
        </div>
      </Page>
    );
  }

  const isPending = isUpdatingDelivery || isUpdatingRequest;

  return (
    <Page title={t("to_receive")} hideTitleOnPage>
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {t("to_receive")}
          </h1>
          <div className="text-sm text-gray-600">
            {delivery.status === "in_progress" ? (
              <>
                {t("dispatch_in_progress_from")} {delivery.origin?.name}{" "}
                {t("to")} {delivery.destination.name}
              </>
            ) : delivery.status === "completed" ? (
              <>
                {t("received")} {t("from")} {delivery.destination.name}{" "}
                {t("to")} {delivery.origin?.name}
              </>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Dispatch Details */}
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t("item")}:
                </Label>
                <div className="text-normal font-semibold text-gray-950">
                  {delivery.supplied_item?.product_knowledge.name ||
                    delivery.supplied_inventory_item?.product.product_knowledge
                      .name}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t("dispatched_quantity")}:
                </Label>
                <div className="text-normal font-semibold">
                  {delivery.supplied_item_quantity}{" "}
                  {delivery.supplied_item?.product_knowledge.definitional
                    ?.dosage_form.display || t("units")}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t("expiry") + " " + t("date")}:
                </Label>
                <div className="text-gray-950 text-normal font-semibold">
                  {delivery.supplied_item?.expiration_date
                    ? formatDate(
                        delivery.supplied_item.expiration_date,
                        "dd-MMM-yyyy",
                      )
                    : t("n/a")}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t("dispatched_from")}:
                </Label>
                <div className="text-gray-950 text-normal font-semibold">
                  {delivery.origin?.name || t("N/A")}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t("dispatched_at")}:
                </Label>
                <div className="text-gray-950 text-normal font-semibold">
                  {delivery.modified_date
                    ? formatDate(delivery.modified_date, "dd-MMM-yyyy, h:mm a")
                    : t("n/a")}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t("type")}:
                  </Label>
                  <div className="text-gray-950 text-normal font-semibold capitalize">
                    {delivery.supplied_item?.product_knowledge.product_type
                      ? t(delivery.supplied_item.product_knowledge.product_type)
                      : delivery.supplied_inventory_item?.product
                            .product_knowledge.product_type
                        ? t(
                            delivery.supplied_inventory_item.product
                              .product_knowledge.product_type,
                          )
                        : t("n/a")}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t("lot") + "/" + t("batch") + " " + t("no")}:
                  </Label>
                  <div className="text-gray-950 text-normal font-semibold">
                    {delivery.supplied_item?.batch?.lot_number ||
                      delivery.supplied_inventory_item?.product?.batch
                        ?.lot_number ||
                      t("n/a")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t("condition")}:
                  </Label>
                  {delivery.supplied_item_condition && (
                    <Badge
                      variant="outline"
                      className={getSupplyDeliveryConditionBadgeColor(
                        delivery.supplied_item_condition,
                      )}
                    >
                      {t(delivery.supplied_item_condition)}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t("status")}:
                  </Label>
                  <Badge
                    variant="outline"
                    className={getSupplyDeliveryStatusBadgeColor(
                      delivery.status,
                    )}
                  >
                    {t(delivery.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Verify Received Items Form */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold">
              {t("verify_received_items")}
            </h2>
            <div className="text-sm text-gray-600 mb-2">
              {t("check_item_condition_and_verify_receipt")}
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-2"
              >
                <div className="bg-gray-50 rounded-md py-2 px-3 space-y-6">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => {
                      const conditionOptions = [
                        {
                          value: SupplyDeliveryCondition.normal,
                          label: "normal",
                        },
                        {
                          value: SupplyDeliveryCondition.damaged,
                          label: "damaged",
                        },
                      ];

                      return (
                        <FormItem>
                          <FormLabel>{t("item_condition")}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex flex-wrap gap-3"
                            >
                              {conditionOptions.map((option) => (
                                <Label
                                  key={option.value}
                                  htmlFor={option.value}
                                  className={cn(
                                    "flex items-center justify-center px-4 py-3 rounded-md border-[1.5px] cursor-pointer transition-all text-gray-950",
                                    field.value === option.value
                                      ? "border-primary-600 bg-primary-100"
                                      : "border-gray-300 bg-white hover:border-gray-400",
                                  )}
                                >
                                  <RadioGroupItem
                                    value={option.value}
                                    id={option.value}
                                  />
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                      {t(option.label)}
                                    </span>
                                  </div>
                                </Label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="receivingStatus"
                    render={({ field }) => {
                      const statusOptions = [
                        {
                          value: SupplyDeliveryStatus.completed,
                          label: "completed",
                        },
                        {
                          value: SupplyDeliveryStatus.abandoned,
                          label: "abandoned",
                        },
                        {
                          value: SupplyDeliveryStatus.entered_in_error,
                          label: "entered_in_error",
                        },
                      ];

                      return (
                        <FormItem>
                          <FormLabel>{t("receiving_status")}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex flex-wrap gap-3"
                            >
                              {statusOptions.map((option) => (
                                <Label
                                  key={option.value}
                                  htmlFor={option.value}
                                  className={`flex items-center justify-center px-4 py-3 rounded-md border-[1.5px] cursor-pointer transition-all ${
                                    field.value === option.value
                                      ? "border-primary-600 bg-primary-100"
                                      : "border-gray-300 bg-white hover:border-gray-400"
                                  }`}
                                >
                                  <RadioGroupItem
                                    value={option.value}
                                    id={option.value}
                                  />
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                      {t(option.label)}
                                    </span>
                                  </div>
                                </Label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <div>
                    <FormLabel>{t("received_quantity")}</FormLabel>
                    <div className="text-lg font-bold mt-1">
                      {delivery.supplied_item_quantity}{" "}
                      {delivery.supplied_item?.product_knowledge.definitional
                        ?.dosage_form.display || t("units")}
                    </div>

                    {delivery.supplied_item_quantity !==
                      delivery.supply_request?.quantity && (
                      <div className="flex items-center gap-2 text-yellow-900 text-sm mt-2 bg-yellow-50 rounded-md p-1">
                        <AlertTriangleIcon className="w-4 h-4" />
                        <span>
                          {t(
                            "received_quantity_is_different_from_requested_quantity",
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {delivery.supply_request?.item.storage_guidelines &&
                    delivery.supply_request.item.storage_guidelines.length >
                      0 && (
                      <div className="space-y-2">
                        {delivery.supply_request.item.storage_guidelines.map(
                          (guideline, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200"
                            >
                              <div className="bg-blue-100 text-blue-950 px-2 py-1 rounded-full text-xs border border-blue-700">
                                {t("storage")}
                              </div>
                              <div className="text-blue-900 font-medium text-sm">
                                {guideline.note}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                  {delivery.supply_request?.status ===
                    SupplyRequestStatus.active && (
                    <FormField
                      control={form.control}
                      name="markAsFullyReceived"
                      render={({ field }) => (
                        <FormItem>
                          <div>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <Label className="text-sm font-medium">
                                {t("mark_as_fully_received")}
                              </Label>
                            </div>
                            <div className="text-xs text-gray-600 text-center -ml-6">
                              {t(
                                "tick_if_all_items_are_received_the_request_will_be_cleared_from_the_pending_list",
                              )}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button variant="outline" onClick={handleCancel}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    <CheckIcon className="w-4 h-4" />
                    {delivery.status !== SupplyDeliveryStatus.in_progress
                      ? t("update_delivery")
                      : t("mark_as_received")}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Bottom section - Request raised by */}
        {delivery.supply_request && (
          <div className="mt-8 bg-gray-100 rounded-lg border p-2">
            <h3 className="text-base font-semibold">
              {t("request_raised_by")} {delivery.supply_request.deliver_to.name}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 text-sm bg-white rounded-lg border p-2">
              <div>
                <Label className="text-gray-700 text-sm font-medium">
                  {t("item_requested")}:
                </Label>
                <div className="font-semibold text-gray-950 text-normal">
                  {delivery.supply_request.item.name}
                </div>
              </div>
              <div>
                <Label className="text-gray-700 text-sm font-medium">
                  {t("requested_qty")}:
                </Label>
                <div className="font-semibold text-gray-950 text-normal">
                  {delivery.supply_request.quantity}{" "}
                  {delivery.supplied_item?.product_knowledge.definitional
                    ?.dosage_form.display || t("units")}
                </div>
              </div>
              <div>
                <Label className="text-gray-700 text-sm font-medium">
                  {t("requested_by")}:
                </Label>
                <div className="font-semibold text-gray-950 text-normal">
                  {delivery.supply_request.deliver_to.name}
                </div>
              </div>
              <div>
                <Label className="text-gray-700 text-sm font-medium">
                  {t("priority")}:
                </Label>
                <div className="font-semibold text-gray-950 text-normal mt-0.5">
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800"
                  >
                    {t(delivery.supply_request.priority)}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-gray-700 text-sm font-medium">
                  {t("status")}:
                </Label>
                <div className="font-semibold text-gray-950 text-normal mt-0.5">
                  <Badge
                    variant="outline"
                    className={getSupplyRequestStatusBadgeColor(
                      delivery.supply_request.status,
                    )}
                  >
                    {t(delivery.supply_request.status)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm p-2 space-x-6">
              <div className="flex flex-col items-start justify-start">
                <Label className="text-gray-700 text-sm font-medium">
                  {t("category")}
                </Label>
                <div className="font-semibold text-gray-950 text-normal">
                  {t(delivery.supply_request.category)}
                </div>
              </div>
              <div className="flex flex-col items-start justify-start">
                <Label className="text-gray-700 text-sm font-medium">
                  {t("intent")}
                </Label>
                <div className="font-semibold text-gray-950 text-normal">
                  {t(delivery.supply_request.intent)}
                </div>
              </div>
              <div className="flex flex-col items-start justify-start">
                <Label className="text-gray-700 text-sm font-medium">
                  {t("reason")}
                </Label>
                <div className="font-semibold text-gray-950 text-normal">
                  {t(delivery.supply_request.reason)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
