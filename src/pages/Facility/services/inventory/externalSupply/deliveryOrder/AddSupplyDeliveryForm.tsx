import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { useQueryParams } from "raviger";
import { useCallback, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import careConfig from "@/../care.config";
import { cn } from "@/lib/utils";

import { DisablingCover } from "@/components/Common/DisablingCover";
import Autocomplete from "@/components/ui/autocomplete";
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

import {
  getExtensionFieldsWithName,
  processExtensions,
} from "@/hooks/useExtensions";
import useExtensionSchemas from "@/hooks/useExtensionSchemas";
import { SmartExternalDeliveryRow } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/SmartExternalDeliveryRow";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import StockLotSelector from "@/pages/Facility/services/inventory/StockLotSelector";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { ExtensionEntityType } from "@/types/extensions/extensions";
import {
  ProductCreate,
  ProductRead,
  ProductStatusOptions,
} from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { RequestOrderStatus } from "@/types/inventory/requestOrder/requestOrder";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { round, zodDecimal } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

const supplyDeliveryItemSchema = z.object({
  supplied_inventory_item: z.string().optional(),
  supplied_item_quantity: zodDecimal({ min: 1 }),
  supplied_item_pack_quantity: z.number().optional(),
  supplied_item_pack_size: z.number().optional(),
  product_knowledge: z
    .custom<ProductKnowledgeBase>()
    .refine((data) => data?.slug, {
      message: "Item is required",
    }),
  supplied_item: z.custom<ProductRead>().optional(),
  supply_request: z.custom<SupplyRequestRead>().optional(),
  _is_inward_stock: z.boolean().optional(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  charge_item_definition: z.object({ slug: z.string() }).optional(),
  unit_price: zodDecimal({ min: 0 }).optional(),
  purchase_price: zodDecimal({ min: 0 }).optional(),
  total_purchase_price: zodDecimal({ min: 0 }).optional(),
  is_manually_edited: z.boolean().optional(),
  is_tax_inclusive: z.boolean().optional(),
  charge_item_category: z.string().optional(),
  informational_components: z.array(z.custom<MonetaryComponent>()).optional(),
  tax_components: z.array(z.custom<MonetaryComponent>()).optional(),
  discount_components: z.array(z.custom<MonetaryComponent>()).optional(),
  extensions: z.record(z.unknown()).optional(),
});

export const createFormSchema = z.object({
  supplied_item_type: z.nativeEnum(SupplyDeliveryType),
  items: z
    .array(supplyDeliveryItemSchema)
    .min(1, "At least one item is required"),
});

export type SupplyDeliveryFormValues = z.infer<typeof createFormSchema>;
export type SupplyDeliveryItemValues = z.infer<typeof supplyDeliveryItemSchema>;

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
  const [qParams, setQueryParams] = useQueryParams();
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [requestOrderSearch, setRequestOrderSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [newlyAddedRowIndex, setNewlyAddedRowIndex] = useState<number | null>(
    null,
  );

  // Get facility data from hook
  const { facility } = useCurrentFacility();
  const { getExtensions } = useExtensionSchemas();

  const informationalCodes = facility?.instance_informational_codes || [];

  // Get extensions from API
  const allExtensions = getExtensions(
    ExtensionEntityType.supply_delivery,
    "write",
  );

  // Process extensions for form rendering (includes owner, defaults, fieldMetadata)
  const processedExtensions = useMemo(
    () => processExtensions(allExtensions),
    [allExtensions],
  );

  // Get extension field metadata with extension name for table headers
  const extensionFields = useMemo(
    () => getExtensionFieldsWithName(allExtensions),
    [allExtensions],
  );

  // Default values for a new empty item row
  const createEmptyItem = useCallback(
    (): SupplyDeliveryItemValues => ({
      product_knowledge: {} as ProductKnowledgeBase,
      supplied_inventory_item: "",
      supplied_item_quantity: "1",
      supplied_item_pack_quantity: origin ? undefined : 1,
      supplied_item_pack_size: origin ? undefined : 1,
      supplied_item: undefined,
      supply_request: undefined,
      _is_inward_stock: !origin,
      is_tax_inclusive: careConfig.inventory.defaultTaxInclusive,
      extensions: {},
    }),
    [origin],
  );

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

  const { data: requestOrders, isLoading: isLoadingRequestOrders } = useQuery({
    queryKey: [
      "requestOrders",
      facilityId,
      requestOrderSearch,
      destination,
      origin,
    ],
    queryFn: query.debounced(requestOrderApi.listRequestOrder, {
      pathParams: { facilityId },
      queryParams: {
        search: requestOrderSearch || undefined,
        status: RequestOrderStatus.pending,
        ...(!origin ? { destination } : { origin }),
      },
    }),
    enabled: !qParams.supplyOrder,
  });

  const form = useForm<SupplyDeliveryFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      supplied_item_type: SupplyDeliveryType.product,
      items: [],
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

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Render the request order selector dropdown
  const renderRequestOrderSelector = () => (
    <Autocomplete
      options={
        requestOrders?.results?.map((order) => ({
          label: order.name,
          value: order.id,
        })) || []
      }
      value=""
      onChange={(value) => {
        if (value) {
          setQueryParams({
            ...qParams,
            supplyOrder: value,
          });
        }
      }}
      isLoading={isLoadingRequestOrders}
      onSearch={setRequestOrderSearch}
      placeholder={t("select_order")}
      inputPlaceholder={t("search_order")}
      noOptionsMessage={t("no_orders_found")}
      className="px-10"
      popoverContentClassName="w-auto"
    />
  );

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
      supplied_item_pack_quantity: origin ? undefined : 1,
      supplied_item_pack_size: origin ? undefined : 1,
      product_knowledge: request.item,
      supplied_item: undefined,
      supply_request: request,
      _is_inward_stock: !origin,
      is_tax_inclusive: careConfig.inventory.defaultTaxInclusive,
      extensions: {},
    }));
    form.setValue("items", itemsFromRequests || []);
    setIsSelectDialogOpen(false);
    setSelectedItems([]);
  };

  const handleAddAnotherItem = () => {
    const newIndex = fields.length;
    append(createEmptyItem());
    setNewlyAddedRowIndex(newIndex);
  };

  const { mutateAsync: createProduct } = useMutation({
    mutationFn: mutate(productApi.createProduct, {
      pathParams: { facilityId },
    }),
  });

  const { mutateAsync: createChargeItemDefinition } = useMutation({
    mutationFn: mutate(chargeItemDefinitionApi.createChargeItemDefinition, {
      pathParams: { facilityId },
    }),
  });

  const { mutateAsync: createSupplyDelivery } = useMutation({
    mutationFn: mutate(supplyDeliveryApi.createSupplyDelivery),
  });

  /**
   * Build price components array from item's monetary components
   */
  const buildPriceComponents = (
    item: SupplyDeliveryFormValues["items"][number],
  ): MonetaryComponent[] => {
    const components: MonetaryComponent[] = [];

    // Base price component
    if (item.unit_price != null) {
      components.push({
        monetary_component_type: MonetaryComponentType.base,
        amount: item.unit_price,
      });
    }

    // Informational components (MRP, Purchase Price, etc.)
    if (item.informational_components?.length) {
      components.push(...item.informational_components);
    }

    // Tax components
    if (item.tax_components?.length) {
      components.push(...item.tax_components);
    }

    // Discount components
    if (item.discount_components?.length) {
      components.push(...item.discount_components);
    }

    return components;
  };

  const validateFormWithToasts = useCallback(
    (data: SupplyDeliveryFormValues) => {
      let hasErrors = false;

      if (data.items.length === 0) {
        toast.error(t("at_least_one_item_required"));
        return false;
      }

      // Validate each item
      for (const [index, item] of data.items.entries()) {
        if (!item.product_knowledge?.slug) {
          toast.error(t("select_product_at_row", { row: index + 1 }));
          hasErrors = true;
          break;
        }

        if (origin) {
          if (!item.supplied_inventory_item) {
            toast.error(t("select_stock_at_row", { row: index + 1 }));
            hasErrors = true;
            break;
          }
        }

        // Only validate supplied_item for external if it's NOT a new creation
        if (!origin) {
          // If we are creating/editing, we need batch and expiry
          if (!item.supplied_item || item.is_manually_edited) {
            if (!item.batch_number) {
              toast.error(
                t("batch_number_required_at_row", { row: index + 1 }),
              );
              hasErrors = true;
              break;
            }
            if (!item.expiry_date) {
              toast.error(t("expiry_date_required_at_row", { row: index + 1 }));
              hasErrors = true;
              break;
            }
            if (!item.charge_item_category) {
              toast.error(t("category_required_at_row", { row: index + 1 }));
              hasErrors = true;
              break;
            }
          }
          if (item.unit_price === undefined) {
            toast.error(t("unit_price_required_at_row", { row: index + 1 }));
            hasErrors = true;
            break;
          }
        }
      }

      return !hasErrors;
    },
    [origin, t],
  );

  async function processRowItem(
    item: SupplyDeliveryFormValues["items"][number],
    index: number,
    suppliedItemType: SupplyDeliveryType,
  ) {
    let productId = item.supplied_item?.id;
    let chargeItemSlug = item.charge_item_definition?.slug;

    // Create ChargeItemDefinition and Product for external supply (no origin)
    if (!origin && (!productId || item.is_manually_edited)) {
      // If is_manually_edited is true, we're creating NEW entities
      // Any existing IDs are from a reference product selection, not our creation
      // Clear them so we create fresh ones (but only on first attempt)
      if (item.is_manually_edited) {
        productId = undefined;
        chargeItemSlug = undefined;
      }

      // Only create ChargeItemDefinition if we don't already have one from our creation
      if (!chargeItemSlug) {
        const category = item.charge_item_category;
        if (!category) {
          throw new Error(
            t("charge_item_category_required_for_item", {
              item: item.product_knowledge.name,
            }),
          );
        }

        const priceComponents = buildPriceComponents(item);
        const chargeItemCreate: ChargeItemDefinitionCreate = {
          slug_value: crypto.randomUUID(),
          category,
          title: `${item.product_knowledge.name}${item.batch_number ? ` - ${item.batch_number}` : ""}`,
          status: ChargeItemDefinitionStatus.active,
          can_edit_charge_item: false,
          price_components:
            priceComponents.length > 0
              ? priceComponents
              : [
                  {
                    monetary_component_type: MonetaryComponentType.base,
                    amount: "0",
                  },
                ],
        };

        const newChargeItem =
          await createChargeItemDefinition(chargeItemCreate);
        chargeItemSlug = newChargeItem.slug;

        // Persist to form state and mark as no longer manually edited
        // This ensures on retry: we reuse our ChargeItem but still create Product if needed
        form.setValue(`items.${index}.charge_item_definition`, {
          slug: chargeItemSlug,
        });
        form.setValue(`items.${index}.is_manually_edited`, false);
      }

      // Only create Product if we don't already have one from our creation
      if (!productId) {
        const productCreate: ProductCreate = {
          status: ProductStatusOptions.active,
          batch: {
            lot_number: item.batch_number!,
          },
          expiration_date: item.expiry_date!,
          product_knowledge: item.product_knowledge.slug,
          charge_item_definition: chargeItemSlug,
          standard_pack_size: item.supplied_item_pack_size,
          purchase_price: item.purchase_price
            ? parseFloat(item.purchase_price)
            : undefined,
          extensions: {},
        };

        const newProduct = await createProduct(productCreate);
        productId = newProduct.id;

        // Immediately persist Product to form state
        // So if Delivery fails, we won't recreate it on retry
        form.setValue(`items.${index}.supplied_item`, {
          id: productId,
        } as ProductRead);
      }
    }

    // Create the SupplyDelivery for this item
    const deliveryPayload = {
      status: SupplyDeliveryStatus.in_progress,
      supplied_item_type: suppliedItemType,
      supplied_item_condition: SupplyDeliveryCondition.normal,
      supplied_item_quantity: item.supplied_item_quantity,
      ...(origin
        ? { supplied_inventory_item: item.supplied_inventory_item }
        : {
            supplied_item: productId,
            supplied_item_pack_quantity: item.supplied_item_pack_quantity,
            supplied_item_pack_size: item.supplied_item_pack_size,
            total_purchase_price: item.total_purchase_price
              ? parseFloat(item.total_purchase_price)
              : undefined,
          }),
      supply_request: item.supply_request?.id,
      origin: origin,
      destination: destination,
      order: deliveryOrderId,
      extensions: item.extensions || {},
    };

    await createSupplyDelivery(deliveryPayload);
  }

  async function onSubmit(data: SupplyDeliveryFormValues) {
    if (!validateFormWithToasts(data)) {
      return;
    }

    setIsProcessing(true);

    // Process all rows in parallel
    const results = await Promise.allSettled(
      data.items.map((item, index) =>
        processRowItem(item, index, data.supplied_item_type).then(() => index),
      ),
    );

    // Separate successful and failed results
    const successfulIndices = results
      .map((result) => (result.status === "fulfilled" ? result.value : null))
      .filter((index): index is number => index !== null);

    const failedCount = results.filter(
      (result) => result.status === "rejected",
    ).length;

    // Remove successful rows from form (in reverse order to maintain correct indices)
    [...successfulIndices].sort((a, b) => b - a).forEach((idx) => remove(idx));

    // Invalidate queries if any items were successful
    if (successfulIndices.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
      queryClient.invalidateQueries({ queryKey: ["products", facilityId] });
      queryClient.invalidateQueries({
        queryKey: ["chargeItemDefinitions", facilityId],
      });
    }

    setIsProcessing(false);

    // Handle completion based on success/failure
    if (failedCount === 0) {
      // All items succeeded
      toast.success(
        t("items_created_successfully", { count: successfulIndices.length }),
      );

      onSuccess();
      form.reset();
    } else if (successfulIndices.length > 0) {
      // Partial success - show success count but don't close form
      toast.success(
        t("items_created_successfully", { count: successfulIndices.length }),
      );
    }
  }

  return (
    <>
      <DisablingCover disabled={isProcessing} message={t("saving")}>
        <Card className="bg-gray-50 py-4 rounded-md">
          <CardContent className="space-y-4 ">
            {fields.length > 0 ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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

                  <div className="rounded-md border border-gray-200 bg-white shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-100">
                          {origin ? (
                            <TableRow className="divide-x divide-gray-200">
                              <TableHead className="min-w-[180px] text-xs font-semibold">
                                {t("product")}
                              </TableHead>
                              <TableHead className="text-xs font-semibold">
                                {t("inventory_item")}
                              </TableHead>
                              <TableHead className="text-xs font-semibold">
                                {t("quantity")}
                              </TableHead>
                              <TableHead className="text-xs font-semibold">
                                {t("actions")}
                              </TableHead>
                            </TableRow>
                          ) : (
                            <>
                              <TableRow className="divide-x divide-gray-200">
                                <TableHead
                                  rowSpan={2}
                                  className="min-w-[180px] text-xs font-semibold"
                                >
                                  {t("product")}
                                </TableHead>
                                <TableHead
                                  rowSpan={2}
                                  className="min-w-[140px] text-xs font-semibold"
                                >
                                  {t("batch")}
                                </TableHead>
                                <TableHead
                                  rowSpan={2}
                                  className="min-w-[130px] text-xs font-semibold"
                                >
                                  {t("expiry")}
                                </TableHead>
                                <TableHead
                                  rowSpan={2}
                                  className="min-w-[140px] text-xs font-semibold text-center"
                                >
                                  {t("category")}
                                </TableHead>
                                <TableHead
                                  rowSpan={2}
                                  className="w-20 text-xs font-semibold"
                                >
                                  {t("pack_size")}
                                </TableHead>
                                <TableHead
                                  rowSpan={2}
                                  className="w-28 text-xs font-semibold"
                                >
                                  {t("pack_qty")}
                                </TableHead>
                                <TableHead
                                  rowSpan={2}
                                  className="w-32 text-xs font-semibold"
                                >
                                  {t("qty")}
                                </TableHead>
                                <TableHead
                                  colSpan={1 + informationalCodes.length}
                                  className="text-xs font-semibold text-center border-b"
                                >
                                  {t("sale")}
                                </TableHead>
                                <TableHead
                                  colSpan={2}
                                  className="text-xs font-semibold text-center border-b"
                                >
                                  {t("purchase")}
                                </TableHead>
                                <TableHead
                                  rowSpan={2}
                                  className="min-w-[120px] text-xs font-semibold"
                                >
                                  {t("tax")}
                                </TableHead>
                                {extensionFields.map((field) => (
                                  <TableHead
                                    rowSpan={2}
                                    key={`${field.extensionName}-${field.name}`}
                                    className="min-w-[100px] text-xs font-semibold"
                                  >
                                    {field.label}
                                    {field.required && (
                                      <span className="text-red-500 ml-0.5">
                                        *
                                      </span>
                                    )}
                                  </TableHead>
                                ))}
                                <TableHead
                                  rowSpan={2}
                                  className="text-xs font-semibold"
                                >
                                  {t("actions")}
                                </TableHead>
                              </TableRow>
                              <TableRow className="divide-x divide-gray-200">
                                <TableHead className="min-w-[100px] text-xs font-semibold">
                                  {t("item_price")}
                                </TableHead>
                                {informationalCodes.map((code) => (
                                  <TableHead
                                    key={code.code}
                                    className="min-w-[100px] text-xs font-semibold"
                                  >
                                    {code.display}
                                  </TableHead>
                                ))}
                                <TableHead className="min-w-[100px] text-xs font-semibold border-r">
                                  {t("pr")}
                                </TableHead>
                                <TableHead className="min-w-[120px] text-xs font-semibold">
                                  {t("tpr")}
                                </TableHead>
                              </TableRow>
                            </>
                          )}
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) =>
                            origin ? (
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
                                            onLotSelectionChange={(lots) =>
                                              field.onChange(
                                                lots[0]?.selectedInventoryId ||
                                                  "",
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
                            ) : (
                              <SmartExternalDeliveryRow
                                key={field.id}
                                form={form}
                                index={index}
                                informationalCodes={informationalCodes}
                                autoOpenProductSelect={
                                  newlyAddedRowIndex === index
                                }
                                onProductSelectOpened={() =>
                                  setNewlyAddedRowIndex(null)
                                }
                                processedExtensions={processedExtensions}
                                locationId={destination}
                                onRemove={() => remove(index)}
                              />
                            ),
                          )}
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
                <h4>{t("add_items_to_delivery")}</h4>
                <p>{t("add_items_to_delivery_description")}</p>
                <div className="flex flex-row gap-2 items-center mt-2">
                  {qParams.supplyOrder
                    ? supplyRequests?.results?.length &&
                      supplyRequests?.results?.length > 0 && (
                        <>
                          <Button
                            type="button"
                            variant="outline_primary"
                            onClick={loadFromSupplyRequests}
                          >
                            {t("load_from_order")} ({supplyRequests?.count}{" "}
                            {t("items")}
                            )
                            <ShortcutBadge actionId="load-from-order" />
                          </Button>
                          <p>- {t("or")} -</p>
                        </>
                      )
                    : requestOrders?.results &&
                      requestOrders.results.length > 0 && (
                        <>
                          {renderRequestOrderSelector()}
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
      </DisablingCover>
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
                      {round(request.quantity)} {request.item.base_unit.display}
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
