import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, PlusCircle, X } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

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

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import {
  SupplyDeliveryStatus,
  SupplyDeliveryType,
  getSupplyDeliveryStatusBadgeColor,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import {
  SupplyRequestStatus,
  getSupplyRequestPriorityBadgeColor,
  getSupplyRequestStatusBadgeColor,
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
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null,
  );

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
      },
    }),
  });

  const deliveries = deliveriesResponse?.results || [];

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
      form.setValue("items", [
        { inventory_item_id: "", quantity: supplyRequest.quantity },
      ]);
    }
  }, [supplyRequest, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { mutate: createDelivery, isPending: isCreatingDelivery } = useMutation(
    {
      mutationFn: mutate(supplyDeliveryApi.createSupplyDelivery),
      onSuccess: () => {
        toast.success(t("supply_delivery_created"));
        queryClient.invalidateQueries({
          queryKey: ["supplyDeliveries", supplyRequestId],
        });

        // If marked as fully dispatched, update the request status
        if (form.getValues("is_fully_dispatched")) {
          markRequestAsFulfilled();
        }
      },
    },
  );

  const { mutate: updateRequest } = useMutation({
    mutationFn: mutate(supplyRequestApi.upsertSupplyRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyRequest"] });
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
        setSelectedDeliveryId(null);
      },
    },
  );

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

  function onSubmit(data: FormValues) {
    // Check if the total quantity of items is equal to the requested quantity
    const totalQuantity = data.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    if (totalQuantity !== supplyRequest?.quantity) {
      toast.error(
        "Total quantity of items must be equal to the requested quantity",
      );
      return;
    }

    // Create a delivery for each item
    data.items.forEach((item) => {
      createDelivery({
        status: data.status,
        supplied_item_type: data.item_type,
        supplied_item_quantity: item.quantity,
        supplied_inventory_item: item.inventory_item_id,
        origin: locationId,
        destination: supplyRequest?.deliver_to.id || "",
        supply_request: supplyRequestId,
      });
    });
  }

  if (!supplyRequest) return null;

  return (
    <div className="space-y-2 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Dispatch Items</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/locations/${locationId}/supply_requests`,
            )
          }
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm text-gray-500">
        Send items from {supplyRequest.deliver_from?.name} to{" "}
        {supplyRequest.deliver_to.name} as per the request. Review and fill in
        the dispatch details below.
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-4 rounded-lg shadow-sm bg-white p-4 mb-0">
        <div>
          <div className="text-xs font-medium">Item to dispatch</div>
          <div className="text-sm font-semibold text-gray-950">
            {supplyRequest.item.name}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium">Qty to Dispatch</div>
          <div className="text-sm font-semibold text-gray-950">
            {supplyRequest.quantity} tablets
          </div>
        </div>
        <div>
          <div className="text-xs font-medium">Deliver To</div>
          <div className="text-sm font-semibold text-gray-950">
            {supplyRequest.deliver_to.name}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium">Priority</div>
          <Badge
            variant="outline"
            className={getSupplyRequestPriorityBadgeColor(
              supplyRequest.priority,
            )}
          >
            {t(supplyRequest.priority)}
          </Badge>
        </div>
        <div>
          <div className="text-xs font-medium">Status</div>
          <Badge
            variant="outline"
            className={getSupplyRequestStatusBadgeColor(supplyRequest.status)}
          >
            {t(supplyRequest.status)}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4 rounded-b-lg mx-4 p-3 bg-gray-100 border border-t-0 border-gray-200 mt-0.5">
        <div>
          <div className="text-xs font-medium">Category</div>
          <div className="text-sm font-semibold text-gray-950">
            {t(supplyRequest.category)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium">Intent</div>
          <div className="text-sm font-semibold text-gray-950">
            {t(supplyRequest.intent)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium">Reason</div>
          <div className="text-sm font-semibold text-gray-950">
            {t(supplyRequest.reason)}
          </div>
        </div>
      </div>
      {/* Existing Deliveries */}
      {deliveries.length > 0 && (
        <div className="rounded-lg border bg-white mx-4 mb-4">
          <div className="p-4 border-b">
            <div className="text-sm font-semibold">Dispatched Items</div>
          </div>
          <div className="divide-y">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-xs font-medium text-gray-500">
                      Dispatch Item
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
                      Dispatch Quantity
                    </div>
                    <div className="text-sm font-semibold">
                      {delivery.supplied_item_quantity}{" "}
                      {delivery.supplied_inventory_item?.product.batch
                        ?.lot_number &&
                        `(${delivery.supplied_inventory_item.product.batch.lot_number})`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">
                      Dispatched To
                    </div>
                    <div className="text-sm font-semibold">
                      {delivery.destination?.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">
                      Condition
                    </div>
                    <div className="text-sm font-semibold">
                      {t(delivery.supplied_item_condition || "")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getSupplyDeliveryStatusBadgeColor(
                      delivery.status,
                    )}
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
                        onClick={() => setSelectedDeliveryId(delivery.id)}
                        disabled={
                          delivery.status ===
                          SupplyDeliveryStatus.entered_in_error
                        }
                      >
                        Mark as entered in error
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
      <Dialog
        open={Boolean(selectedDeliveryId)}
        onOpenChange={() => setSelectedDeliveryId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Entered in Error</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this delivery as entered in error?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedDeliveryId(null)}
              disabled={isUpdatingDelivery}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedDeliveryId && handleMarkAsError(selectedDeliveryId)
              }
              disabled={isUpdatingDelivery}
            >
              {isUpdatingDelivery ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Form */}
      {supplyRequest.status === SupplyRequestStatus.active && (
        <div className="rounded-lg border bg-gray-100 mx-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-2 p-2"
            >
              <div className="text-gray-950 font-semibold">
                Dispatch Details
              </div>
              <div className="space-y-4 bg-gray-50 p-4 rounded-md shadow-sm">
                {/* Dispatch Status */}
                {/* Item Type */}
                <div className="space-y-3">
                  <Label>Item Type:</Label>
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
                              <Label htmlFor="product">Product</Label>
                            </div>
                            <div className="flex flex-row gap-1 items-center justify-between rounded-md border border-gray-200 bg-white p-2 hover:bg-gray-50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary-100 shadow-sm">
                              <RadioGroupItem
                                value={SupplyDeliveryType.device}
                                id="device"
                              />
                              <Label htmlFor="device">Device</Label>
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
                    Select and Dispatch Items
                  </div>
                </div>

                <Table className="bg-white shadow-sm rounded-md border border-gray-200 rounded-md">
                  <TableHeader className="bg-gray-200 border-gray-200">
                    <TableRow className="divide-x">
                      <TableHead>Select Item from Lot</TableHead>
                      <TableHead>Qty to Dispatch</TableHead>
                      <TableHead>Action</TableHead>
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
                                      <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {inventoryItems?.results.map((item) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.product.product_knowledge.name}{" "}
                                        (Lot #{item.product.batch?.lot_number})
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
                  Add Item
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
                      <Label>Marked as Fully Dispatched</Label>
                      <p className="text-sm text-gray-500">
                        Tick if all items have been dispatched. This delivery
                        will be marked fulfilled and removed from the pending
                        dispatch list.
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
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/locations/${locationId}/supply_requests`,
                    )
                  }
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingDelivery}>
                  Confirm Dispatch
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
