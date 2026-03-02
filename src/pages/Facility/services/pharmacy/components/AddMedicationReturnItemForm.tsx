import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Search, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { DisablingCover } from "@/components/Common/DisablingCover";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import StockLotSelector from "@/pages/Facility/services/inventory/StockLotSelector";
import batchApi from "@/types/base/batch/batchApi";
import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import { roundWhole, zodDecimal } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import { formatDateTime } from "@/Utils/utils";

const returnItemSchema = z.object({
  supplied_inventory_item: z.string().min(1, "Please select a stock item"),
  supplied_item: z.string().optional(), // Product ID from the inventory item
  supplied_item_quantity: zodDecimal({ min: 1 }),
  original_dispense_quantity: z.string().optional(),
  product_knowledge: z
    .custom<ProductKnowledgeBase>()
    .refine((data) => data?.slug, {
      message: "Item is required",
    }),
});

const formSchema = z.object({
  items: z.array(returnItemSchema).min(1, "At least one item is required"),
});

type FormValues = z.infer<typeof formSchema>;
type ReturnItemValues = z.infer<typeof returnItemSchema>;

interface Props {
  deliveryOrderId: string;
  facilityId: string;
  locationId: string;
  onSuccess: () => void;
  medicationDispenses?: MedicationDispenseRead[];
}

export function AddMedicationReturnItemForm({
  deliveryOrderId,
  facilityId,
  locationId,
  onSuccess,
  medicationDispenses = [],
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [newlyAddedRowIndex, setNewlyAddedRowIndex] = useState<number | null>(
    null,
  );
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [selectedDispenses, setSelectedDispenses] = useState<string[]>([]);
  const [dispenseSearchQuery, setDispenseSearchQuery] = useState("");

  const filteredDispenses = useMemo(() => {
    if (!dispenseSearchQuery) return medicationDispenses;
    const query = dispenseSearchQuery.toLowerCase();
    return medicationDispenses.filter((dispense) => {
      const productName =
        dispense.item.product.product_knowledge.name?.toLowerCase() || "";
      const batchNumber =
        dispense.item.product.batch?.lot_number?.toLowerCase() || "";
      return productName.includes(query) || batchNumber.includes(query);
    });
  }, [medicationDispenses, dispenseSearchQuery]);

  const createEmptyItem = useCallback(
    (): ReturnItemValues => ({
      product_knowledge: {} as ProductKnowledgeBase,
      supplied_inventory_item: "",
      supplied_item: "",
      supplied_item_quantity: "1",
      original_dispense_quantity: undefined,
    }),
    [],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleAddAnotherItem = () => {
    const newIndex = fields.length;
    append(createEmptyItem());
    setNewlyAddedRowIndex(newIndex);
  };

  const loadFromMedicationDispenses = () => {
    setIsSelectDialogOpen(true);
    setSelectedDispenses([]);
    setDispenseSearchQuery("");
  };

  const handleSelectAll = (
    checked: boolean,
    dispenses: MedicationDispenseRead[] = filteredDispenses,
  ) => {
    if (checked) {
      setSelectedDispenses(dispenses.map((dispense) => dispense.id));
    } else {
      setSelectedDispenses([]);
    }
  };

  const handleSelectDispense = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDispenses((prev) => [...prev, id]);
    } else {
      setSelectedDispenses((prev) =>
        prev.filter((dispenseId) => dispenseId !== id),
      );
    }
  };

  const handleSelectDispenses = () => {
    const selectedMedicationDispenses = medicationDispenses.filter((dispense) =>
      selectedDispenses.includes(dispense.id),
    );
    const itemsFromDispenses = selectedMedicationDispenses.map((dispense) => ({
      supplied_inventory_item: dispense.item.id,
      supplied_item: dispense.item.product.id,
      supplied_item_quantity: roundWhole(dispense.quantity),
      original_dispense_quantity: roundWhole(dispense.quantity),
      product_knowledge: dispense.item.product.product_knowledge,
    }));
    form.setValue("items", itemsFromDispenses);
    setIsSelectDialogOpen(false);
    setSelectedDispenses([]);
  };

  const { mutateAsync: createSupplyDeliveries } = useMutation({
    mutationFn: mutate(batchApi.batchRequest),
  });

  const validateFormWithToasts = useCallback(
    (data: FormValues) => {
      if (data.items.length === 0) {
        toast.error(t("at_least_one_item_required"));
        return false;
      }

      for (const [index, item] of data.items.entries()) {
        if (!item.product_knowledge?.slug) {
          toast.error(t("select_product_at_row", { row: index + 1 }));
          return false;
        }
        if (!item.supplied_inventory_item || !item.supplied_item) {
          toast.error(t("select_stock_at_row", { row: index + 1 }));
          return false;
        }
      }

      return true;
    },
    [t],
  );

  async function onSubmit(data: FormValues) {
    if (!validateFormWithToasts(data)) {
      return;
    }

    setIsProcessing(true);

    try {
      // Build batch request for all supply deliveries
      const requests = data.items.map((item, index) => ({
        url: `/api/v1/supply_delivery/`,
        method: "POST",
        reference_id: `supply_delivery_${index}`,
        body: {
          status: SupplyDeliveryStatus.in_progress,
          supplied_item_type: SupplyDeliveryType.product,
          supplied_item_condition: SupplyDeliveryCondition.normal,
          supplied_item_quantity: item.supplied_item_quantity,
          supplied_item: item.supplied_item, // Product ID
          destination: locationId,
          order: deliveryOrderId,
          extensions: {},
        },
      }));

      const response = await createSupplyDeliveries({ requests });

      // Check for any failures in the batch response
      const failedRequests = response.results.filter(
        (result) => result.status_code >= 400,
      );

      if (failedRequests.length === 0) {
        // All succeeded
        toast.success(
          t("medication_return_completed_successfully", {
            count: data.items.length,
          }),
        );
        queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
        onSuccess();
        form.reset();
      } else if (failedRequests.length < response.results.length) {
        // Partial success
        const successCount = response.results.length - failedRequests.length;
        toast.success(
          t("partially_completed_medication_return", { count: successCount }),
        );
        queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });

        // Remove successful items from form (in reverse order)
        const successfulIndices = response.results
          .map((result, index) => (result.status_code < 400 ? index : null))
          .filter((index): index is number => index !== null);

        [...successfulIndices]
          .sort((a, b) => b - a)
          .forEach((idx) => remove(idx));
      } else {
        // All failed
        toast.error(t("error_completing_medication_return_items"));
      }
    } catch (_) {
      toast.error(t("error_completing_medication_return_items"));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <DisablingCover disabled={isProcessing} message={t("saving")}>
      <Card className="bg-gray-50 py-4 rounded-md">
        <CardContent className="space-y-4">
          {fields.length > 0 ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="rounded-md border border-gray-200 bg-white shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow className="divide-x divide-gray-200">
                          <TableHead className="min-w-[180px] text-xs font-semibold">
                            {t("product")}
                          </TableHead>
                          <TableHead className="min-w-[200px] text-xs font-semibold">
                            {t("stock_lot")}
                          </TableHead>
                          <TableHead className="w-24 text-xs font-semibold">
                            {t("quantity")}
                          </TableHead>
                          <TableHead className="w-16 text-xs font-semibold">
                            {t("actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow
                            key={field.id}
                            className="divide-x divide-gray-200"
                          >
                            <TableCell className="align-top p-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.product_knowledge`}
                                render={({ field }) => {
                                  const isLoadedFromDispense = !!form.watch(
                                    `items.${index}.original_dispense_quantity`,
                                  );
                                  return (
                                    <FormItem>
                                      <FormControl>
                                        <ProductKnowledgeSelect
                                          value={field.value}
                                          onChange={(productKnowledge) => {
                                            field.onChange(productKnowledge);
                                            setNewlyAddedRowIndex(null);
                                            // Reset inventory item when product changes
                                            form.setValue(
                                              `items.${index}.supplied_inventory_item`,
                                              "",
                                            );
                                          }}
                                          placeholder={t("select_product")}
                                          className="w-full"
                                          disableFavorites
                                          hideClearButton
                                          defaultOpen={
                                            newlyAddedRowIndex === index
                                          }
                                          disabled={isLoadedFromDispense}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell className="align-top p-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.supplied_inventory_item`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <StockLotSelector
                                        net_content_gt={-1}
                                        hideQuantity
                                        selectedLots={
                                          field.value
                                            ? [
                                                {
                                                  selectedInventoryId:
                                                    field.value,
                                                  quantity: "1",
                                                },
                                              ]
                                            : []
                                        }
                                        onLotSelectionChange={(lots) => {
                                          const lot = lots[0];
                                          const inventoryId =
                                            lot?.selectedInventoryId || "";
                                          field.onChange(inventoryId);

                                          // Use the inventory from the lot to get the product ID
                                          if (lot?.inventory) {
                                            form.setValue(
                                              `items.${index}.supplied_item`,
                                              lot.inventory.product.id,
                                            );
                                          } else {
                                            form.setValue(
                                              `items.${index}.supplied_item`,
                                              "",
                                            );
                                          }
                                        }}
                                        facilityId={facilityId}
                                        locationId={locationId}
                                        productKnowledge={form.watch(
                                          `items.${index}.product_knowledge`,
                                        )}
                                        enableSearch={true}
                                        multiSelect={false}
                                        className="w-full h-9"
                                        dontRestrictExpired
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell className="align-top p-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.supplied_item_quantity`}
                                render={({ field }) => {
                                  const originalQuantity = form.watch(
                                    `items.${index}.original_dispense_quantity`,
                                  );
                                  return (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={1}
                                          max={
                                            originalQuantity
                                              ? Number(originalQuantity)
                                              : undefined
                                          }
                                          step="1"
                                          className="w-20"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell className="align-top p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                aria-label={t("remove")}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex flex-row gap-2 mt-4 items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAnotherItem}
                  >
                    <PlusCircle className="mr-2 size-4" />
                    {t("add_another")}
                  </Button>
                  {medicationDispenses.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={loadFromMedicationDispenses}
                    >
                      {t("load_from_order")} ({medicationDispenses.length}{" "}
                      {t("items")})
                      <ShortcutBadge actionId="load-from-order" />
                    </Button>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessing}
                    onClick={() => form.reset()}
                  >
                    {t("cancel")}
                  </Button>
                  <div className="flex space-x-3">
                    <Button type="submit" disabled={isProcessing}>
                      {isProcessing ? t("saving") : t("save")}
                      <ShortcutBadge actionId="submit-action" />
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col gap-3 items-center">
              <h4>{t("add_items_to_return")}</h4>
              <p className="text-sm text-gray-500">
                {t("select_items_from_stock_to_return")}
              </p>
              <div className="flex flex-row gap-2 items-center mt-2">
                {medicationDispenses.length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="outline_primary"
                      onClick={loadFromMedicationDispenses}
                    >
                      {t("load_from_order")} ({medicationDispenses.length}{" "}
                      {t("items")})
                      <ShortcutBadge actionId="load-from-order" />
                    </Button>
                    <p>- {t("or")} -</p>
                  </>
                )}
                <Button
                  type="button"
                  variant="outline_primary"
                  onClick={() => handleAddAnotherItem()}
                >
                  <PlusCircle className="mr-2 size-4" />
                  {t("add_item")}
                  <ShortcutBadge actionId="add-item" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {medicationDispenses.length > 0 && (
        <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
          <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>{t("select_items_to_add")}</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder={t("search_items")}
                value={dispenseSearchQuery}
                onChange={(e) => setDispenseSearchQuery(e.target.value)}
                className="pl-9"
                aria-label={t("search_items")}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredDispenses.length === 0 ? (
                <EmptyState
                  icon={<Search className="size-4 text-gray-400" />}
                  title={t("no_results_found")}
                  description={t("try_different_search")}
                  className="rounded-md shadow-none border-solid"
                />
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">
                          <Checkbox
                            id="select-all"
                            checked={
                              filteredDispenses.length > 0 &&
                              filteredDispenses.every((d) =>
                                selectedDispenses.includes(d.id),
                              )
                            }
                            onCheckedChange={(checked) =>
                              handleSelectAll(checked as boolean)
                            }
                            data-shortcut-id="select-all"
                          />
                        </TableHead>
                        <TableHead>{t("item")}</TableHead>
                        <TableHead className="text-center">
                          {t("qty")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDispenses.map((dispense) => (
                        <TableRow
                          key={dispense.id}
                          className="hover:bg-gray-50 cursor-pointer select-none"
                          onClick={() =>
                            handleSelectDispense(
                              dispense.id,
                              !selectedDispenses.includes(dispense.id),
                            )
                          }
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              id={dispense.id}
                              checked={selectedDispenses.includes(dispense.id)}
                              onCheckedChange={(checked) =>
                                handleSelectDispense(
                                  dispense.id,
                                  checked as boolean,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {dispense.item.product.product_knowledge.name}
                              </span>
                              {(dispense.item.product.batch?.lot_number ||
                                dispense.item.product.expiration_date) && (
                                <span className="text-xs text-gray-500">
                                  {dispense.item.product.batch?.lot_number &&
                                    `${t("lot")}: ${dispense.item.product.batch.lot_number}`}
                                  {dispense.item.product.batch?.lot_number &&
                                    dispense.item.product.expiration_date &&
                                    " | "}
                                  {dispense.item.product.expiration_date &&
                                    `${t("expiry")}: ${formatDateTime(dispense.item.product.expiration_date)}`}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium">
                            {roundWhole(dispense.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <DialogFooter className="pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setIsSelectDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSelectDispenses}
                disabled={selectedDispenses.length === 0}
              >
                {t("done")}
                <ShortcutBadge actionId="enter-action" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DisablingCover>
  );
}
