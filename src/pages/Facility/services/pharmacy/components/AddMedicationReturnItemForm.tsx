import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { DisablingCover } from "@/components/Common/DisablingCover";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { zodDecimal } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

const returnItemSchema = z.object({
  supplied_inventory_item: z.string().min(1, "Please select a stock item"),
  supplied_item: z.string().optional(), // Product ID from the inventory item
  supplied_item_quantity: zodDecimal({ min: 1 }),
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
}

export function AddMedicationReturnItemForm({
  deliveryOrderId,
  facilityId,
  locationId,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [newlyAddedRowIndex, setNewlyAddedRowIndex] = useState<number | null>(
    null,
  );

  const createEmptyItem = useCallback(
    (): ReturnItemValues => ({
      product_knowledge: {} as ProductKnowledgeBase,
      supplied_inventory_item: "",
      supplied_item: "",
      supplied_item_quantity: "1",
    }),
    [],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  });

  // Query inventories for the location (to look up product IDs when user selects stock)
  const { data: inventoriesData } = useQuery({
    queryKey: ["inventoryItemsForReturn", facilityId, locationId],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        limit: 100,
      },
    }),
    enabled: Boolean(facilityId && locationId),
  });

  const inventories = inventoriesData?.results || [];

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleAddAnotherItem = () => {
    const newIndex = fields.length;
    append(createEmptyItem());
    setNewlyAddedRowIndex(newIndex);
  };

  const { mutateAsync: createSupplyDelivery } = useMutation({
    mutationFn: mutate(supplyDeliveryApi.createSupplyDelivery),
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

    const results = await Promise.allSettled(
      data.items.map(async (item, index) => {
        // For medication returns (no origin), we use supplied_item (Product ID)
        // not supplied_inventory_item (InventoryItem ID)
        const deliveryPayload = {
          status: SupplyDeliveryStatus.in_progress,
          supplied_item_type: SupplyDeliveryType.product,
          supplied_item_condition: SupplyDeliveryCondition.normal,
          supplied_item_quantity: item.supplied_item_quantity,
          supplied_item: item.supplied_item, // Product ID
          destination: locationId,
          order: deliveryOrderId,
          extensions: {},
        };

        await createSupplyDelivery(deliveryPayload);
        return index;
      }),
    );

    const successfulIndices = results
      .map((result) => (result.status === "fulfilled" ? result.value : null))
      .filter((index): index is number => index !== null);

    const failedCount = results.filter(
      (result) => result.status === "rejected",
    ).length;

    // Remove successful rows from form (in reverse order to maintain correct indices)
    [...successfulIndices].sort((a, b) => b - a).forEach((idx) => remove(idx));

    if (successfulIndices.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
    }

    setIsProcessing(false);

    if (failedCount === 0) {
      toast.success(
        t("items_created_successfully", { count: successfulIndices.length }),
      );
      onSuccess();
      form.reset();
    } else if (successfulIndices.length > 0) {
      toast.success(
        t("items_created_successfully", { count: successfulIndices.length }),
      );
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
                                render={({ field }) => (
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
                                name={`items.${index}.supplied_inventory_item`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <StockLotSelector
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
                                          const inventoryId =
                                            lots[0]?.selectedInventoryId || "";
                                          field.onChange(inventoryId);

                                          // Find the inventory item and store the product ID
                                          const selectedInventory =
                                            inventories.find(
                                              (inv) => inv.id === inventoryId,
                                            );
                                          if (selectedInventory) {
                                            form.setValue(
                                              `items.${index}.supplied_item`,
                                              selectedInventory.product.id,
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
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={1}
                                        className="w-20"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
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
          )}
        </CardContent>
      </Card>
    </DisablingCover>
  );
}
