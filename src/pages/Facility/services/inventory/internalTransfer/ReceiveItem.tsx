import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  MoreVertical,
  XIcon,
} from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Page from "@/components/Common/Page";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { makeUrl } from "@/Utils/request/utils";
import {
  SUPPLY_DELIVERY_CONDITION_COLORS,
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryUpdate,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import {
  SUPPLY_REQUEST_PRIORITY_COLORS,
  SUPPLY_REQUEST_STATUS_COLORS,
} from "@/types/inventory/supplyRequest/supplyRequest";
import {
  SupplyRequestCreate,
  SupplyRequestStatus,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

const receiveItemSchema = z.object({
  condition: z.nativeEnum(SupplyDeliveryCondition),
  receivingStatus: z.enum([
    SupplyDeliveryStatus.completed,
    SupplyDeliveryStatus.abandoned,
  ]),
  markAsFullyReceived: z.boolean(),
});

type ReceiveItemForm = z.infer<typeof receiveItemSchema>;

interface Props {
  facilityId: string;
  locationId: string;
  deliveryId: string;
  mode: "internal" | "external";
}

type ActionType = "receive" | "abandon";

export default function ReceiveItem({
  facilityId,
  locationId,
  deliveryId,
  mode,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isReceivingAbandonedItem, setIsReceivingAbandonedItem] =
    useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: ReactNode;
    onConfirm: () => void;
    variant: "primary" | "destructive" | "outline_primary";
    confirmText?: string;
    hideCancel?: boolean;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "primary",
  });

  const [qParams] = useQueryParams();

  const form = useForm<ReceiveItemForm>({
    resolver: zodResolver(receiveItemSchema),
    defaultValues: {
      condition: SupplyDeliveryCondition.normal,
      receivingStatus: SupplyDeliveryStatus.completed,
      markAsFullyReceived: false,
    },
  });

  const receivingStatus = form.watch("receivingStatus");

  const buttonTextMap: Record<
    SupplyDeliveryStatus.completed | SupplyDeliveryStatus.abandoned,
    string
  > = {
    [SupplyDeliveryStatus.completed]: t("mark_as_received"),
    [SupplyDeliveryStatus.abandoned]: t("mark_as_abandoned"),
  };
  const buttonText = buttonTextMap[receivingStatus] || t("mark_as_received");

  const buttonVariant =
    receivingStatus === SupplyDeliveryStatus.abandoned
      ? "destructive"
      : "primary";

  const ButtonIcon =
    receivingStatus === SupplyDeliveryStatus.abandoned ? XIcon : CheckIcon;

  const { data: delivery, isLoading } = useQuery({
    queryKey: ["supplyDelivery", deliveryId],
    queryFn: query(supplyDeliveryApi.retrieveSupplyDelivery, {
      pathParams: { supplyDeliveryId: deliveryId },
    }),
    enabled: !!deliveryId,
  });
  const { mutateAsync: updateSupplyDelivery, isPending: isUpdatingDelivery } =
    useMutation({
      mutationFn: mutate(supplyDeliveryApi.updateSupplyDelivery, {
        pathParams: { supplyDeliveryId: deliveryId },
      }),
    });

  const { mutateAsync: updateSupplyRequest, isPending: isUpdatingRequest } =
    useMutation({
      mutationFn: mutate(supplyRequestApi.updateSupplyRequest, {
        pathParams: { supplyRequestId: delivery?.supply_request?.id || "" },
      }),
    });

  const handleSubmit = async (data: ReceiveItemForm) => {
    if (!delivery) return;

    try {
      await updateSupplyDelivery({
        status: data.receivingStatus,
        ...(data.receivingStatus !== SupplyDeliveryStatus.abandoned && {
          supplied_item_condition: data.condition,
        }),
      });

      if (data.markAsFullyReceived && delivery.supply_request) {
        await updateSupplyRequest({
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

      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
      queryClient.invalidateQueries({ queryKey: ["supplyRequests"] });
      queryClient.invalidateQueries({
        queryKey: ["supplyDelivery", deliveryId],
      });

      if (data.receivingStatus === SupplyDeliveryStatus.completed) {
        toast.success(t("item_marked_as_received"));
      } else {
        toast.success(t("item_marked_as_abandoned"));
      }

      setIsReceivingAbandonedItem(false);
    } catch {
      toast.error(t("error_updating_delivery"));
    } finally {
      setDialog((d) => ({ ...d, open: false }));
    }
  };

  const handleCancel = () => {
    const path =
      mode === "external"
        ? `/facility/${facilityId}/locations/${locationId}/external_supply/inward_entry`
        : `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_receive`;
    const { deliveryId: _, from: __, ...cleanParams } = qParams;
    navigate(makeUrl(path, cleanParams));
  };

  const openDialog = (action: ActionType) => {
    if (!delivery) return;
    const currentReceivingStatus = form.watch("receivingStatus");

    if (action === "receive") {
      const isCompleted =
        currentReceivingStatus === SupplyDeliveryStatus.completed;
      const actionText =
        buttonTextMap[currentReceivingStatus] || t("mark_as_received");
      setDialog({
        open: true,
        title: t("confirm_submission"),
        description: (
          <>
            <Trans
              i18nKey="confirm_action_description"
              values={{
                action: actionText.toLowerCase(),
              }}
              components={{
                1: <strong className="text-gray-900" />,
              }}
            />
            {isCompleted && (
              <p className="mt-2">{t("you_cannot_change_once_submitted")}</p>
            )}
          </>
        ),
        onConfirm: form.handleSubmit(handleSubmit),
        variant: isCompleted ? "primary" : "destructive",
        confirmText: t("done"),
      });
      return;
    }

    // Logic for 'abandon'
    if (delivery.status === SupplyDeliveryStatus.completed) {
      setDialog({
        open: true,
        title: t("info"),
        description: t(
          "once_delivery_is_completed_you_can_not_change_the_status",
        ),
        onConfirm: () => setDialog({ ...dialog, open: false }),
        variant: "outline_primary",
        confirmText: t("got_it"),
        hideCancel: true,
      });
      return;
    }

    const actionText = t("mark_as_abandoned");
    setDialog({
      open: true,
      title: t("confirm_submission"),
      description: (
        <Trans
          i18nKey="confirm_action_description"
          values={{
            action: actionText.toLowerCase(),
          }}
          components={{
            1: <strong className="text-gray-900" />,
          }}
        />
      ),
      onConfirm: handleMarkAsAbandoned,
      variant: "destructive",
      confirmText: actionText,
    });
  };

  const handleMarkAsAbandoned = async () => {
    if (!delivery) return;
    try {
      await updateSupplyDelivery({
        status: SupplyDeliveryStatus.abandoned,
        ...(delivery.supplied_item_condition && {
          supplied_item_condition: delivery.supplied_item_condition,
        }),
      } satisfies SupplyDeliveryUpdate);

      toast.success(t("item_marked_as_abandoned"));
      queryClient.invalidateQueries({
        queryKey: ["supplyDelivery", deliveryId],
      });
    } catch {
      toast.error(t("error_updating_delivery"));
    } finally {
      setDialog((d) => ({ ...d, open: false }));
    }
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

  const storageGuidelines = delivery &&
    delivery.supply_request &&
    delivery.supply_request?.item.storage_guidelines &&
    delivery.supply_request.item.storage_guidelines.length > 0 && (
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
    );

  const receivedQuantity = delivery && (
    <div>
      <Label className="text-sm font-medium text-gray-700">
        {t("received_quantity")}
      </Label>
      <div className="text-lg font-bold mt-1">
        {delivery.supplied_item_quantity}{" "}
        {delivery.supplied_item?.product_knowledge.definitional?.dosage_form
          .display || t("units")}
      </div>

      {delivery.supplied_item_quantity !==
        delivery.supply_request?.quantity && (
        <div className="flex items-center gap-2 text-yellow-900 text-sm mt-2 bg-yellow-50 rounded-md p-1">
          <AlertTriangleIcon className="w-4 h-4" />
          <span>
            {t("received_quantity_is_different_from_requested_quantity")}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <Page title={t("to_receive")} hideTitleOnPage>
      <div className="max-w-6xl container mx-auto">
        <div className="flex justify-between">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("to_receive")}
            </h1>
            <div className="text-sm text-gray-600">
              {delivery.status === "in_progress" ? (
                <>
                  {t("dispatch_in_progress_from")}{" "}
                  {delivery.origin?.name || delivery.supplier?.name} {t("to")}{" "}
                  {delivery.destination.name}
                </>
              ) : delivery.status === "completed" ? (
                <>
                  {t("received")} {t("from")}{" "}
                  {delivery.origin?.name || delivery.supplier?.name} {t("to")}{" "}
                  {delivery.destination.name}
                </>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0 border-gray-400 shadow-sm text-gray-700"
              onClick={() => handleCancel()}
            >
              <XIcon className="size-5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Dispatch Details */}
          <div
            className={cn(
              "bg-white rounded-lg border p-6 space-y-6 lg:col-span-1",
              (delivery.status === SupplyDeliveryStatus.abandoned ||
                delivery.status === SupplyDeliveryStatus.entered_in_error) &&
                !isReceivingAbandonedItem &&
                "lg:col-span-3",
            )}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t("item")}:
                  </Label>
                  <div className="text-normal font-semibold text-gray-950">
                    {delivery.supplied_item?.product_knowledge.name ||
                      delivery.supplied_inventory_item?.product
                        .product_knowledge.name}
                  </div>
                </div>
                {delivery.status === SupplyDeliveryStatus.abandoned &&
                  !isReceivingAbandonedItem && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="size-8 p-0"
                        >
                          <MoreVertical className="size-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setIsReceivingAbandonedItem(true);
                            form.setValue(
                              "receivingStatus",
                              SupplyDeliveryStatus.completed,
                            );
                          }}
                        >
                          {t("mark_as_received")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
                  {delivery.origin?.name || delivery.supplier?.name || t("N/A")}
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
                  <div className="text-gray-950 text-normal font-semibold break-all">
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
                      variant={
                        SUPPLY_DELIVERY_CONDITION_COLORS[
                          delivery.supplied_item_condition
                        ]
                      }
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
                    variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}
                  >
                    {t(delivery.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Verify Received Items Form */}
          {(delivery.status === SupplyDeliveryStatus.in_progress ||
            isReceivingAbandonedItem) && (
            <div className="bg-white rounded-lg border p-6 lg:col-span-2">
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
                        ].filter(
                          (option) =>
                            !(
                              isReceivingAbandonedItem &&
                              option.value === SupplyDeliveryStatus.abandoned
                            ),
                        );

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

                    {receivingStatus !== SupplyDeliveryStatus.abandoned && (
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
                    )}

                    {receivingStatus === SupplyDeliveryStatus.completed &&
                      receivedQuantity}

                    {receivingStatus === SupplyDeliveryStatus.completed &&
                      storageGuidelines}

                    {receivingStatus === SupplyDeliveryStatus.completed && (
                      <FormField
                        control={form.control}
                        name="markAsFullyReceived"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center">
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id="markAsFullyReceived"
                                  />
                                </FormControl>
                              </div>
                              <div className="text-xs text-gray-600 flex flex-col">
                                <Label
                                  className="text-sm font-medium"
                                  htmlFor="markAsFullyReceived"
                                >
                                  {t("mark_as_fully_received")}
                                </Label>
                                <div className="text-xs text-gray-600">
                                  {t(
                                    "tick_if_all_items_are_received_the_request_will_be_cleared_from_the_pending_list",
                                  )}
                                </div>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (isReceivingAbandonedItem) {
                          setIsReceivingAbandonedItem(false);
                        } else {
                          handleCancel();
                        }
                      }}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      variant={buttonVariant}
                      type="button"
                      disabled={isPending}
                      onClick={() => openDialog("receive")}
                    >
                      <ButtonIcon className="size-4" />
                      {buttonText}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
          {delivery.status === SupplyDeliveryStatus.completed && (
            <div className="bg-white rounded-lg border p-6 space-y-6 lg:col-span-2">
              <div className="flex justify-between">
                {receivedQuantity}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="size-8 p-0">
                      <MoreVertical className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {delivery.status === SupplyDeliveryStatus.completed && (
                      <DropdownMenuItem onClick={() => openDialog("abandon")}>
                        {t("mark_as_abandoned")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {storageGuidelines}
            </div>
          )}
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
                    variant={
                      SUPPLY_REQUEST_PRIORITY_COLORS[
                        delivery.supply_request.priority
                      ]
                    }
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
                    variant={
                      SUPPLY_REQUEST_STATUS_COLORS[
                        delivery.supply_request.status
                      ]
                    }
                  >
                    {t(delivery.supply_request.status)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm p-2 space-x-6 items-end justify-between">
              <div className="flex gap-6">
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
              <Button
                variant="link"
                size="sm"
                className="gap-1 underline hover:text-primary-700"
                onClick={() =>
                  navigate(
                    makeUrl(
                      mode === "external"
                        ? `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders/${delivery.supply_request?.id}`
                        : `/facility/${facilityId}/locations/${locationId}/internal_transfers/requests/${delivery.supply_request?.id}`,
                      { ...qParams, from: "receive_item", deliveryId },
                    ),
                  )
                }
              >
                {t("view") + " " + t("request")}{" "}
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        )}

        <ConfirmActionDialog
          open={dialog.open}
          onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
          title={dialog.title}
          description={dialog.description}
          onConfirm={dialog.onConfirm}
          variant={dialog.variant}
          confirmText={dialog.confirmText || t("confirm")}
          cancelText={t("cancel")}
          disabled={isPending}
          hideCancel={dialog.hideCancel}
        />
      </div>
    </Page>
  );
}
