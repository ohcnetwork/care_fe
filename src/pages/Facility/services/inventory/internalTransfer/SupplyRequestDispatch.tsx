import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, PlusCircle, X } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import {
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import {
  SUPPLY_REQUEST_PRIORITY_COLORS,
  SUPPLY_REQUEST_STATUS_COLORS,
  SupplyRequestStatus,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

const dispatchItemSchema = z.object({
  inventory_item_id: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const dispatchFormSchema = z.object({
  status: z.nativeEnum(SupplyDeliveryStatus),
  item_type: z.nativeEnum(SupplyDeliveryType),
  items: z.array(dispatchItemSchema).min(1, "At least one item is required"),
  is_fully_dispatched: z.boolean(),
});

interface Props {
  facilityId: string;
  locationId: string;
  supplyRequestId: string;
}

type FormValues = z.infer<typeof dispatchFormSchema>;

export default function SupplyRequestDispatch({
  facilityId,
  locationId,
  supplyRequestId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [qParams, setQueryParams] = useQueryParams();
  const [highlightedDeliveryId, setHighlightedDeliveryId] = useState(
    qParams.highlight_delivery,
  );
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedDeliveryId) {
      highlightedRef.current?.scrollIntoView();
      const timer = setTimeout(() => {
        setHighlightedDeliveryId(undefined);
        const newQParams = { ...qParams };
        delete newQParams.highlight_delivery;
        setQueryParams(newQParams, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedDeliveryId, qParams, setQueryParams]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: ReactNode;
    onConfirm: () => void;
    variant?: "primary" | "destructive" | "default" | "outline_primary";
    confirmText?: string;
    cancelText?: string;
    disabled?: boolean;
    hideCancel?: boolean;
  }>({
    open: false,
    title: "",
    description: <></>,
    onConfirm: () => {},
  });
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    data?: FormValues;
  }>({ open: false });

  const backUrl = `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_dispatch?${new URLSearchParams(
    qParams as Record<string, string>,
  ).toString()}`;

  // Fetch supply request details
  const { data: supplyRequest } = useQuery({
    queryKey: ["supplyRequest", supplyRequestId],
    queryFn: query(supplyRequestApi.retrieveSupplyRequest, {
      pathParams: { supplyRequestId },
    }),
  });

  // Fetch inventory items for the requested product
  const { data: inventoryItems } = useQuery({
    queryKey: ["inventoryItems", supplyRequest?.item.id],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: { product_knowledge: supplyRequest?.item.id },
    }),
    enabled: Boolean(supplyRequest?.item.id),
  });

  // Fetch existing deliveries for this request
  const { data: deliveriesResponse } = useQuery({
    queryKey: ["supplyDeliveries", supplyRequestId],
    queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        supply_request: supplyRequestId,
        origin: locationId,
      },
    }),
  });

  const deliveries = deliveriesResponse?.results || [];

  const alreadyDispatchedQuantity = deliveries.reduce(
    (sum, delivery) =>
      delivery.status !== SupplyDeliveryStatus.entered_in_error &&
      delivery.status !== SupplyDeliveryStatus.abandoned
        ? sum + delivery.supplied_item_quantity
        : sum,
    0,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(dispatchFormSchema),
    defaultValues: {
      status: SupplyDeliveryStatus.in_progress,
      item_type: SupplyDeliveryType.product,
      items: [{ inventory_item_id: "", quantity: 1 }],
      is_fully_dispatched: false,
    },
  });

  useEffect(() => {
    if (supplyRequest) {
      const remainingQuantity =
        supplyRequest.quantity - alreadyDispatchedQuantity;
      form.setValue("items", [
        {
          inventory_item_id: "",
          quantity: remainingQuantity > 0 ? remainingQuantity : 1,
        },
      ]);
    }
  }, [supplyRequest, alreadyDispatchedQuantity, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const isDispatchDisabled = items.some(
    (item) =>
      !item.inventory_item_id || isNaN(item.quantity) || item.quantity < 1,
  );

  const { mutateAsync: createDelivery, isPending: isCreatingDelivery } =
    useMutation({
      mutationFn: mutate(supplyDeliveryApi.createSupplyDelivery),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["supplyDeliveries", supplyRequestId],
        });
      },
    });

  const { mutate: updateRequest, isPending: isUpdatingRequest } = useMutation({
    mutationFn: mutate(supplyRequestApi.upsertSupplyRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyRequest"] });
      setConfirmDialog((d) => ({ ...d, open: false }));
    },
  });

  const { mutate: updateDelivery, isPending: isUpdatingDelivery } = useMutation(
    {
      mutationFn: (deliveryId: string) =>
        mutate(supplyDeliveryApi.updateSupplyDelivery, {
          pathParams: { supplyDeliveryId: deliveryId },
        })({
          status: SupplyDeliveryStatus.entered_in_error,
        }),
      onSuccess: () => {
        toast.success(t("supply_delivery_updated"));
        queryClient.invalidateQueries({
          queryKey: ["supplyDeliveries", supplyRequestId],
        });
        setConfirmDialog((d) => ({ ...d, open: false }));
      },
    },
  );

  async function executeDispatch(data: FormValues) {
    if (!supplyRequest) {
      toast.error(t("supply_request_not_loaded"));
      return;
    }

    try {
      const deliveryPromises = data.items.map((item) =>
        createDelivery({
          status: data.status,
          supplied_item_type: data.item_type,
          supplied_item_quantity: item.quantity,
          supplied_inventory_item: item.inventory_item_id,
          origin: locationId,
          destination: supplyRequest.deliver_to.id,
          supply_request: supplyRequestId,
        }),
      );

      const results = await Promise.allSettled(deliveryPromises);
      const rejected = results.filter((r) => r.status === "rejected");

      if (rejected.length === 0) {
        toast.success(t("all_items_dispatched_successfully"));
        if (data.is_fully_dispatched) {
          markRequestAsFulfilled();
        }
        form.reset({
          status: SupplyDeliveryStatus.in_progress,
          item_type: SupplyDeliveryType.product,
          items: [{ inventory_item_id: "", quantity: 1 }],
          is_fully_dispatched: false,
        });
      } else {
        toast.error(
          t("failed_to_dispatch_some_items", {
            failed: rejected.length,
            total: results.length,
          }),
        );
        const failedItems = data.items.filter(
          (_, index) => results[index].status === "rejected",
        );
        form.reset({
          ...data,
          items: failedItems,
          is_fully_dispatched: false,
        });
      }
    } catch {
      toast.error(t("something_went_wrong"));
    }
  }

  function markRequestAsFulfilled() {
    if (!supplyRequest) return;

    updateRequest({
      datapoints: [
        {
          id: supplyRequest.id,
          status: SupplyRequestStatus.processed,
          intent: supplyRequest.intent,
          category: supplyRequest.category,
          priority: supplyRequest.priority,
          reason: supplyRequest.reason,
          quantity: supplyRequest.quantity,
          deliver_from: supplyRequest.deliver_from?.id,
          deliver_to: supplyRequest.deliver_to.id,
          item: supplyRequest.item.id,
        },
      ],
    });
  }

  function handleMarkAsError(deliveryId: string) {
    updateDelivery(deliveryId);
  }

  async function onSubmit(data: FormValues) {
    if (!supplyRequest) {
      toast.error(t("supply_request_not_loaded"));
      return;
    }

    const currentDispatchQuantity = data.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const prospectiveTotal =
      alreadyDispatchedQuantity + currentDispatchQuantity;

    if (
      prospectiveTotal >= supplyRequest.quantity &&
      !data.is_fully_dispatched
    ) {
      setDialogState({ open: true, data });
    } else {
      executeDispatch(data);
    }
  }

  if (!supplyRequest) return null;

  return (
    <div className="space-y-2 container mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{t("SRD__page_title")}</h2>
        <Button
          variant="outline"
          size="sm"
          className="size-8 p-0 border-gray-400 shadow-sm text-gray-700"
          onClick={() => navigate(backUrl)}
        >
          <X className="size-5" />
        </Button>
      </div>

      <div className="text-sm text-gray-500">
        <Trans
          i18nKey="SRD__page_description_template"
          values={{
            action: t(
              {
                [SupplyRequestStatus.active]: "SRD__action_send",
                [SupplyRequestStatus.processed]: "SRD__action_sent",
                [SupplyRequestStatus.completed]: "SRD__action_delivered",
                [SupplyRequestStatus.entered_in_error]:
                  "SRD__action_entered_in_error",
                [SupplyRequestStatus.cancelled]: "SRD__action_cancelled",
                [SupplyRequestStatus.draft]: "SRD__action_draft",
                [SupplyRequestStatus.suspended]: "SRD__action_suspended",
              }[supplyRequest.status],
            ),
            from: supplyRequest.deliver_from?.name,
            to: supplyRequest.deliver_to.name,
          }}
        />
        {supplyRequest.status === SupplyRequestStatus.active &&
          ` ${t("SRD__page_description_end")}`}
      </div>

      {/* Summary */}
      <div className="flex items-center rounded-lg shadow-sm bg-white p-4 mb-0">
        <div className="grid grid-cols-5 gap-4 grow">
          <div>
            <div className="text-xs font-medium">
              {t("SRD__item_to_dispatch")}
            </div>
            <div className="text-sm font-semibold text-gray-950">
              {supplyRequest.item.name}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium">
              {t("SRD__qty_to_dispatch")}
            </div>
            <div className="text-sm font-semibold text-gray-950">
              {supplyRequest.quantity}{" "}
              {supplyRequest.item.definitional?.dosage_form?.display ||
                t("units")}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium">{t("deliver_to")}</div>
            <div className="text-sm font-semibold text-gray-950">
              {supplyRequest.deliver_to.name}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium">{t("priority")}</div>
            <Badge
              variant={SUPPLY_REQUEST_PRIORITY_COLORS[supplyRequest.priority]}
            >
              {t(supplyRequest.priority)}
            </Badge>
          </div>
          <div>
            <div className="text-xs font-medium">{t("status")}</div>
            <Badge variant={SUPPLY_REQUEST_STATUS_COLORS[supplyRequest.status]}>
              {t(supplyRequest.status)}
            </Badge>
          </div>
        </div>
        {deliveries.length > 0 &&
          supplyRequest.status === SupplyRequestStatus.active && (
            <div className="ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      setConfirmDialog({
                        open: true,
                        title: t("mark_as_fully_dispatched"),
                        description: (
                          <>
                            <Trans
                              i18nKey="confirm_action_description"
                              values={{
                                action: t(
                                  "mark_as_fully_dispatched",
                                ).toLowerCase(),
                              }}
                              components={{
                                1: <strong className="text-gray-900" />,
                              }}
                            />
                            <p className="mt-2">
                              {t("this_action_cannot_be_undone")}
                            </p>
                          </>
                        ),
                        onConfirm: markRequestAsFulfilled,
                        variant: "primary",
                        confirmText: isUpdatingRequest
                          ? t("updating")
                          : t("confirm"),
                        cancelText: t("cancel"),
                        disabled: isUpdatingRequest,
                      })
                    }
                  >
                    {t("mark_as_fully_dispatched")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
      </div>
      <div className="grid grid-cols-5 gap-4 rounded-b-lg mx-4 p-3 bg-gray-100 border border-t-0 border-gray-200 mt-0.5">
        <div>
          <div className="text-xs font-medium">{t("category")}</div>
          <div className="text-sm font-semibold text-gray-950">
            {t(supplyRequest.category)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium">{t("intent")}</div>
          <div className="text-sm font-semibold text-gray-950">
            {t(supplyRequest.intent)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium">{t("reason")}</div>
          <div className="text-sm font-semibold text-gray-950">
            {t(supplyRequest.reason)}
          </div>
        </div>
      </div>
      {/* Existing Deliveries */}
      {deliveries.length > 0 && (
        <div className="rounded-lg border bg-white mx-4 mb-4">
          <div className="p-4 border-b">
            <div className="text-sm font-semibold">
              {t("SRD__dispatched_items")}
            </div>
          </div>
          <div className="divide-y">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                ref={
                  delivery.id === highlightedDeliveryId ? highlightedRef : null
                }
                className={cn(
                  "p-4 flex items-center justify-between transition-all duration-1000",
                  delivery.id === highlightedDeliveryId && "bg-yellow-50",
                )}
              >
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-xs font-medium text-gray-500">
                      {t("SRD__dispatch_item")}
                    </div>
                    <div className="text-sm font-semibold">
                      {
                        delivery.supplied_inventory_item?.product
                          .product_knowledge.name
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">
                      {t("SRD__dispatch_quantity")}
                    </div>
                    <div className="text-sm font-semibold">
                      {delivery.supplied_item_quantity}{" "}
                      {delivery.supplied_inventory_item?.product.batch
                        ?.lot_number &&
                        t("SRD__lot_template", {
                          lotNumber:
                            delivery.supplied_inventory_item.product.batch
                              .lot_number,
                        })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">
                      {t("SRD__dispatched_to")}
                    </div>
                    <div className="text-sm font-semibold">
                      {delivery.destination?.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">
                      {t("condition")}
                    </div>
                    <div className="text-sm font-semibold">
                      {t(delivery.supplied_item_condition || "-")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}
                  >
                    {t(delivery.status)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          if (
                            delivery.status === SupplyDeliveryStatus.completed
                          ) {
                            setConfirmDialog({
                              open: true,
                              title: t("info"),
                              description: t(
                                "once_delivery_is_completed_you_can_not_change_the_status",
                              ),
                              onConfirm: () =>
                                setConfirmDialog({
                                  ...confirmDialog,
                                  open: false,
                                }),
                              variant: "outline_primary",
                              confirmText: t("got_it"),
                              hideCancel: true,
                              disabled: false,
                            });
                          } else {
                            setConfirmDialog({
                              open: true,
                              title: t("mark_as_entered_in_error"),
                              description: (
                                <>
                                  <Trans
                                    i18nKey="confirm_action_description"
                                    values={{
                                      action: t(
                                        "mark_as_entered_in_error",
                                      ).toLowerCase(),
                                    }}
                                    components={{
                                      1: <strong className="text-gray-900" />,
                                    }}
                                  />
                                  <p className="mt-2">
                                    {t("this_action_cannot_be_undone")}
                                  </p>
                                </>
                              ),
                              onConfirm: () => handleMarkAsError(delivery.id),
                              variant: "destructive",
                              confirmText: isUpdatingDelivery
                                ? t("updating")
                                : t("confirm"),
                              cancelText: t("cancel"),
                              disabled: isUpdatingDelivery,
                            });
                          }
                        }}
                        disabled={
                          delivery.status ===
                          SupplyDeliveryStatus.entered_in_error
                        }
                        className={cn(
                          "hover:bg-gray-100",
                          delivery.status ===
                            SupplyDeliveryStatus.entered_in_error &&
                            "opacity-50",
                        )}
                      >
                        {t("mark_as_entered_in_error")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText || t("confirm")}
        cancelText={confirmDialog.cancelText || t("cancel")}
        disabled={confirmDialog.disabled}
        hideCancel={confirmDialog.hideCancel}
      />

      <Dialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ ...dialogState, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("SRD__fulfill_request_title")}</DialogTitle>
            <DialogDescription>
              {t("SRD__fulfill_request_confirmation_message")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (dialogState.data) {
                  executeDispatch({
                    ...dialogState.data,
                    is_fully_dispatched: false,
                  });
                }
                setDialogState({ open: false });
              }}
            >
              {t("SRD__proceed_without_marking")}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (dialogState.data) {
                  executeDispatch({
                    ...dialogState.data,
                    is_fully_dispatched: true,
                  });
                }
                setDialogState({ open: false });
              }}
            >
              {t("SRD__mark_and_proceed")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Form */}
      {supplyRequest.status === SupplyRequestStatus.active && (
        <div className="rounded-lg border bg-gray-100 mx-4 mt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-2 p-2"
            >
              <div className="text-gray-950 font-semibold">
                {t("SRD__dispatch_details")}
              </div>
              <div className="space-y-4 bg-gray-50 p-4 rounded-md shadow-sm">
                {/* Dispatch Status */}
                {/* Item Type */}
                <div className="space-y-3">
                  <Label>{t("SRD__item_type")}</Label>
                  <FormField
                    control={form.control}
                    name="item_type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row"
                          >
                            <div className="flex flex-row gap-1 items-center justify-between rounded-md border border-gray-200 bg-white p-2 hover:bg-gray-50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary-100 shadow-sm">
                              <RadioGroupItem
                                value={SupplyDeliveryType.product}
                                id="product"
                              />
                              <Label htmlFor="product">
                                {t("SRD__product")}
                              </Label>
                            </div>
                            <div className="flex flex-row gap-1 items-center justify-between rounded-md border border-gray-200 bg-white p-2 hover:bg-gray-50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary-100 shadow-sm">
                              <RadioGroupItem
                                value={SupplyDeliveryType.device}
                                id="device"
                              />
                              <Label htmlFor="device">{t("SRD__device")}</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Select and Dispatch Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {t("SRD__select_and_dispatch_items")}
                  </div>
                </div>

                <Table className="bg-white shadow-sm rounded-md border border-gray-200">
                  <TableHeader className="bg-gray-200 border-gray-200">
                    <TableRow className="divide-x">
                      <TableHead>{t("SRD__select_item_from_lot")}</TableHead>
                      <TableHead>{t("SRD__qty_to_dispatch")}</TableHead>
                      <TableHead>{t("SRD__action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="divide-x">
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.inventory_item_id`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={t("select_product")}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {inventoryItems?.results.map((item) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.product.product_knowledge.name} (
                                        {t("lot")} #
                                        {item.product.batch?.lot_number})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      inventory_item_id: "",
                      quantity: supplyRequest.quantity,
                    })
                  }
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("SRD__add_item")}
                </Button>
              </div>

              {/* Mark as Fully Dispatched */}
              <FormField
                control={form.control}
                name="is_fully_dispatched"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label>{t("SRD__marked_as_fully_dispatched")}</Label>
                      <p className="text-sm text-gray-500">
                        {t("SRD__marked_as_fully_dispatched_description")}
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(backUrl)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingDelivery || isDispatchDisabled}
                >
                  {t("SRD__confirm_dispatch")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
