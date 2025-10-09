import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import ProductSelect from "@/pages/Facility/services/inventory/ProductSelect";
import StockLotSelector from "@/pages/Facility/services/inventory/StockLotSelector";
import { ProductRead } from "@/types/inventory/product/product";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useQueryParams } from "raviger";

const supplyDeliveryItemSchema = z.object({
  supplied_inventory_item: z.string().optional(),
  supplied_item_quantity: z.number().min(1, "Quantity must be at least 1"),
  product_knowledge: z
    .custom<ProductKnowledgeBase>()
    .refine((data) => data?.slug, {
      message: "Item is required",
    }),
  supplied_item: z.custom<ProductRead>().optional(),
  supply_request: z.custom<SupplyRequestRead>().optional(),
  _is_inward_stock: z.boolean().optional(),
});

const createFormSchema = z.object({
  supplied_item_type: z.nativeEnum(SupplyDeliveryType),
  items: z
    .array(supplyDeliveryItemSchema)
    .min(1, "At least one item is required"),
});

interface Props {
  deliveryOrderId: string;
  facilityId: string;
  origin?: string;
  destination: string;
  onSuccess: () => void;
}

export function AddSupplyDeliveryForm({
  deliveryOrderId,
  facilityId,
  origin,
  destination,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [qParams] = useQueryParams();
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const productKnowledgeRef = useRef<HTMLButtonElement | null>(null);

  type FormValues = z.infer<typeof createFormSchema>;

  // Load supply requests when supplyOrder query parameter is present
  const { data: supplyRequests } = useQuery({
    queryKey: ["supplyRequests", qParams.supplyOrder],
    queryFn: query.paginated(supplyRequestApi.listSupplyRequest, {
      queryParams: {
        order: qParams.supplyOrder,
      },
    }),
    enabled: !!qParams.supplyOrder,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      supplied_item_type: SupplyDeliveryType.product,
      items: [
        {
          supplied_inventory_item: "",
          supplied_item_quantity: 1,
          product_knowledge: {} as ProductKnowledgeBase,
          supplied_item: undefined,
          supply_request: undefined,
          _is_inward_stock: !origin,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const loadFromSupplyRequests = () => {
    setIsSelectDialogOpen(true);
    handleSelectAll(true);
  };

  const { mutate: upsertDelivery, isPending } = useMutation({
    mutationFn: mutate(supplyDeliveryApi.upsertSupplyDelivery),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });

      toast.success(t("supply_delivery_created"));
      onSuccess();
      form.reset();
    },
    onError: (_error) => {
      toast.error(t("error_creating_supply_delivery"));
    },
  });

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(
        supplyRequests?.results.map((request) => request.id) || [],
      );
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleSelectRequests = () => {
    const selectedRequests = supplyRequests?.results.filter((request) =>
      selectedItems.includes(request.id),
    );
    const itemsFromRequests = selectedRequests?.map((request) => ({
      supplied_inventory_item: undefined,
      supplied_item_quantity: request.quantity,
      product_knowledge: request.item,
      supplied_item: undefined,
      supply_request: request,
      _is_inward_stock: !origin,
    }));
    form.setValue("items", itemsFromRequests || []);
    setIsSelectDialogOpen(false);
    setSelectedItems([]);
  };

  const setProductKnowledgeRef = useCallback(
    (element: HTMLButtonElement | null, index: number) => {
      if (element && index === fields.length - 1) {
        productKnowledgeRef.current = element;
      }
    },
    [fields.length],
  );

  const handleAddAnotherItem = () => {
    append({
      product_knowledge: {} as ProductKnowledgeBase,
      supplied_inventory_item: "",
      supplied_item_quantity: 1,
      supplied_item: undefined,
      supply_request: undefined,
      _is_inward_stock: !origin,
    });
    setTimeout(() => {
      if (productKnowledgeRef.current) {
        productKnowledgeRef.current.click();
      }
    });
    // Set ref to the newly added item's product knowledge select
  };

  const validateFormWithToasts = useCallback(
    (data: FormValues) => {
      let hasErrors = false;

      if (data.items.length === 0) {
        toast.error(t("at_least_one_item_required"));
        return false;
      }

      // Validate each item
      for (const [_index, item] of data.items.entries()) {
        if (!item.product_knowledge?.slug) {
          toast.error(t("select_product"));
          hasErrors = true;
          break;
        }

        if (origin) {
          if (!item.supplied_inventory_item) {
            toast.error(t("select_stock"));
            hasErrors = true;
            break;
          }
        }

        if (!origin && !item.supplied_item) {
          toast.error(t("select_product"));
          hasErrors = true;
          break;
        }
      }

      return !hasErrors;
    },
    [origin, t],
  );

  function onSubmit(data: FormValues) {
    if (!validateFormWithToasts(data)) {
      return;
    }
    upsertDelivery({
      datapoints: data.items.map((item) => ({
        status: SupplyDeliveryStatus.in_progress,
        supplied_item_type: data.supplied_item_type,
        supplied_item_condition: SupplyDeliveryCondition.normal,
        supplied_item_quantity: item.supplied_item_quantity,
        ...(origin
          ? { supplied_inventory_item: item.supplied_inventory_item }
          : {}),
        supplied_item: item.supplied_item?.id,
        supply_request: item.supply_request?.id,
        origin: origin,
        destination: destination,
        order: deliveryOrderId,
      })),
    });
  }

  return (
    <>
      <Card className="bg-gray-50 py-4 rounded-md">
        <CardContent className="space-y-4 ">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="supplied_item_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("item_type")}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex flex-col sm:flex-row gap-2"
                        >
                          {Object.values(SupplyDeliveryType).map((type) => (
                            <div
                              key={type}
                              className={cn(
                                "flex items-center space-x-2 rounded-md border border-gray-200 bg-white p-2",
                                field.value === type &&
                                  "border-primary bg-primary/10",
                              )}
                            >
                              <RadioGroupItem value={type} id={type} />
                              <Label htmlFor={type}>{t(type)}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-md border border-gray-200 bg-gray-50 shadow">
                <Table>
                  <TableHeader className="bg-gray-200/80">
                    <TableRow className="divide-x divide-gray-300">
                      <TableHead>{t("product_knowledge")}</TableHead>
                      {origin && <TableHead>{t("inventory_item")}</TableHead>}
                      {!origin && <TableHead>{t("product")}</TableHead>}
                      <TableHead>{t("quantity")}</TableHead>
                      <TableHead className="w-28">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow
                        key={field.id}
                        className="divide-x divide-gray-300"
                      >
                        <TableCell className="align-top">
                          <FormField
                            control={form.control}
                            name={`items.${index}.product_knowledge`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <ProductKnowledgeSelect
                                    ref={(element) =>
                                      setProductKnowledgeRef(element, index)
                                    }
                                    value={field.value}
                                    onChange={(productKnowledge) => {
                                      field.onChange(productKnowledge);
                                      // Reset inventory item when product changes
                                      form.setValue(
                                        `items.${index}.supplied_inventory_item`,
                                        "",
                                      );
                                      form.setValue(
                                        `items.${index}.supplied_item`,
                                        undefined,
                                      );
                                    }}
                                    placeholder={t("select_product")}
                                    className="w-full"
                                    disableFavorites
                                    hideClearButton
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        {origin && (
                          <TableCell className="align-top">
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
                                                quantity: 1,
                                              },
                                            ]
                                          : []
                                      }
                                      onLotSelectionChange={(lots) =>
                                        field.onChange(
                                          lots[0]?.selectedInventoryId || "",
                                        )
                                      }
                                      facilityId={facilityId}
                                      locationId={origin || ""}
                                      productKnowledge={form.watch(
                                        `items.${index}.product_knowledge`,
                                      )}
                                      enableSearch={true}
                                      multiSelect={false}
                                      className="w-full h-9"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                        )}
                        {!origin && (
                          <TableCell className="align-top">
                            <ProductSelect
                              facilityId={facilityId}
                              productKnowledgeSlug={
                                form.watch(`items.${index}.product_knowledge`)
                                  ?.slug
                              }
                              receivingItem={
                                form.watch(`items.${index}.product_knowledge`)
                                  ?.name
                              }
                              quantity={form
                                .watch(`items.${index}.supplied_item_quantity`)
                                .toString()}
                              onSelect={(product: ProductRead) => {
                                if (
                                  index !== null &&
                                  form.watch(`items.${index}.product_knowledge`)
                                ) {
                                  form.setValue(`items.${index}`, {
                                    ...form.watch(`items.${index}`),
                                    supplied_item: product,
                                  });
                                }
                              }}
                              selectedProduct={form.watch(
                                `items.${index}.supplied_item`,
                              )}
                              disabled={
                                !form.watch(`items.${index}.product_knowledge`)
                                  .slug
                              }
                            />
                          </TableCell>
                        )}
                        <TableCell className="align-top">
                          <FormField
                            control={form.control}
                            name={`items.${index}.supplied_item_quantity`}
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
                            variant="outline"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="size-4" />
                            {t("remove")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-row gap-2 mt-4">
                {supplyRequests?.results?.length &&
                  supplyRequests?.results?.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={loadFromSupplyRequests}
                    >
                      {t("load_from_order")} ({supplyRequests?.count}{" "}
                      {t("items")}
                      )
                      <ShortcutBadge actionId="load-from-order" />
                    </Button>
                  )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddAnotherItem()}
                >
                  <PlusCircle className="mr-2 size-4" />
                  {t("add_another_item")}
                  <ShortcutBadge actionId="add-item" />
                </Button>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="submit" disabled={isPending}>
                  {isPending ? t("creating") : t("add_items")}
                  <ShortcutBadge actionId="submit-action" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {supplyRequests && (
        <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t("select_items_to_add")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedItems.length === supplyRequests.results.length
                  }
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked as boolean)
                  }
                  data-shortcut-id="select-all"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("select_all")}
                </label>
              </div>
              <div className="border rounded-md divide-y">
                {supplyRequests.results.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center space-x-4 p-2 hover:bg-gray-50"
                  >
                    <Checkbox
                      id={request.id}
                      checked={selectedItems.includes(request.id)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(request.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={request.id}
                        className="text-sm font-medium leading-none"
                      >
                        {request.item.name}
                      </label>
                    </div>
                    <div className="text-sm font-medium">
                      {request.quantity} {request.item.base_unit.display}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSelectDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSelectRequests}
                disabled={selectedItems.length === 0}
              >
                {t("done")}
                <ShortcutBadge actionId="enter-action" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
