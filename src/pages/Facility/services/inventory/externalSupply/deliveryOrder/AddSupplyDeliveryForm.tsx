import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import Autocomplete from "@/components/ui/autocomplete";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductRead } from "@/types/inventory/product/product";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatDate } from "date-fns";

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
  supplyRequests?: SupplyRequestRead[];
  onSuccess: () => void;
}

export function AddSupplyDeliveryForm({
  deliveryOrderId,
  facilityId,
  origin,
  destination,
  supplyRequests = [],
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchInventoryItem, setSearchInventoryItem] = useState("");

  const { data: inventoryItems, isLoading: isLoadingInventoryItems } = useQuery(
    {
      queryKey: [
        "inventoryItems",
        facilityId,
        destination,
        searchInventoryItem,
      ],
      queryFn: query(inventoryApi.list, {
        pathParams: { facilityId, locationId: origin || "" },
        queryParams: { product_knowledge: searchInventoryItem },
      }),
      enabled: !!searchInventoryItem && !!origin,
    },
  );

  const inventoryItemOptions =
    inventoryItems?.results.map((item: InventoryRead) => ({
      label: `#${item.product.batch?.lot_number} ${item.product.expiration_date ? `(${formatDate(item.product.expiration_date, "dd/MM/yyyy")})` : ""}, QTY: ${item.net_content}`,
      value: item.id,
    })) || [];

  type FormValues = z.infer<typeof createFormSchema>;

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
    if (supplyRequests.length > 0) {
      const itemsFromRequests = supplyRequests.map((request) => ({
        supplied_inventory_item: undefined,
        supplied_item_quantity: request.quantity,
        product_knowledge: request.item,
        supplied_item: undefined,
        supply_request: request,
        _is_inward_stock: !origin,
      }));
      form.setValue("items", itemsFromRequests);
    }
  };

  const { mutate: upsertDelivery, isPending } = useMutation({
    mutationFn: mutate(supplyDeliveryApi.upsertSupplyDelivery),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });

      toast.success(t("supply_delivery_created"));
      onSuccess();
      form.reset();
    },
  });

  function onSubmit(data: FormValues) {
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
                      <TableHead className="w-[100px]">
                        {t("actions")}
                      </TableHead>
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
                                    value={field.value}
                                    onChange={(productKnowledge) => {
                                      field.onChange(productKnowledge);
                                      // Reset inventory item when product changes
                                      form.setValue(
                                        `items.${index}.supplied_inventory_item`,
                                        "",
                                      );
                                      setSearchInventoryItem(
                                        productKnowledge.id,
                                      );
                                    }}
                                    placeholder={t("select_product")}
                                    className="w-full"
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
                                    <Autocomplete
                                      options={inventoryItemOptions}
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      isLoading={isLoadingInventoryItems}
                                      // TODO: Make this work
                                      //   onSearch={setSearchInventoryItem}
                                      placeholder={t("select_inventory_item")}
                                      inputPlaceholder={t(
                                        "search_inventory_item",
                                      )}
                                      noOptionsMessage={t(
                                        "no_inventory_items_found",
                                      )}
                                      disabled={
                                        !form.watch(
                                          `items.${index}.product_knowledge`,
                                        )
                                      }
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
                              productKnowledgeId={
                                form.watch(`items.${index}.product_knowledge`)
                                  ?.id
                              }
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
                                    product_knowledge: form.watch(
                                      `items.${index}.product_knowledge`,
                                    ),
                                    supplied_item: product,
                                  });
                                }
                              }}
                              selectedProductId={
                                form.watch(`items.${index}.supplied_item`)?.id
                              }
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
                        <TableCell className="align-top">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-row gap-2 mt-4">
                {supplyRequests.length > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={loadFromSupplyRequests}
                  >
                    {t("load_from_order")} ({supplyRequests.length} {t("items")}
                    )
                    <ShortcutBadge actionId="load-from-order" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      product_knowledge: {} as ProductKnowledgeBase,
                      supplied_inventory_item: "",
                      supplied_item_quantity: 1,
                      supplied_item: undefined,
                      supply_request: undefined,
                      _is_inward_stock: !origin,
                    })
                  }
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
    </>
  );
}
