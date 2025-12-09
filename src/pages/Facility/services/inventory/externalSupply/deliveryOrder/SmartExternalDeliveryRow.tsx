import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronDown, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableCell, TableRow } from "@/components/ui/table";

import { cn } from "@/lib/utils";

import { MonetaryComponentSelector } from "@/components/Billing/MonetaryComponentSelector";
import { ResourceCategoryPicker } from "@/components/Common/ResourceCategoryPicker";
import {
  CURRENCY_SYMBOL,
  MonetaryDisplay,
} from "@/components/ui/monetary-display";
import {
  SupplyDeliveryFormValues,
  SupplyDeliveryItemValues,
} from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { Code } from "@/types/base/code/code";
import {
  calculateItemTotal,
  MonetaryComponent,
  MonetaryComponentRead,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import {
  getComponentsFromChargeItem,
  MRP_CODE,
} from "@/types/billing/chargeItem/chargeItem";
import facilityApi from "@/types/facility/facilityApi";
import { ProductRead } from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import query from "@/Utils/request/query";

interface Props {
  form: UseFormReturn<SupplyDeliveryFormValues>;
  index: number;
  facilityId: string;
  informationalCodes: Code[];
  autoOpenProductSelect?: boolean;
  onProductSelectOpened?: () => void;
}

// Type-safe field path helper for items array
type ItemFieldPath<K extends keyof SupplyDeliveryItemValues> =
  `items.${number}.${K}`;

function getItemFieldPath<K extends keyof SupplyDeliveryItemValues>(
  index: number,
  field: K,
): ItemFieldPath<K> {
  return `items.${index}.${field}` as ItemFieldPath<K>;
}

/**
 * Reset all item-specific form fields when product knowledge changes
 */
function resetItemFormFields(
  form: UseFormReturn<SupplyDeliveryFormValues>,
  index: number,
) {
  form.setValue(getItemFieldPath(index, "supplied_item"), undefined);
  form.setValue(getItemFieldPath(index, "batch_number"), "");
  form.setValue(getItemFieldPath(index, "expiry_date"), "");
  form.setValue(getItemFieldPath(index, "charge_item_definition"), undefined);
  form.setValue(getItemFieldPath(index, "unit_price"), 0);
  form.setValue(getItemFieldPath(index, "informational_components"), []);
  form.setValue(getItemFieldPath(index, "tax_components"), []);
  form.setValue(getItemFieldPath(index, "discount_components"), []);
  form.setValue(getItemFieldPath(index, "charge_item_category"), undefined);
  form.setValue(getItemFieldPath(index, "is_manually_edited"), false);
}

export function SmartExternalDeliveryRow({
  form,
  index,
  facilityId,
  informationalCodes,
  autoOpenProductSelect = false,
  onProductSelectOpened,
}: Props) {
  const { t } = useTranslation();
  const [batchSelectorOpen, setBatchSelectorOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const productKnowledge = useWatch({
    control: form.control,
    name: `items.${index}.product_knowledge`,
  });

  const suppliedItem = useWatch({
    control: form.control,
    name: getItemFieldPath(index, "supplied_item"),
  });

  const batchNumber = useWatch({
    control: form.control,
    name: getItemFieldPath(index, "batch_number"),
  });

  const unitPrice = useWatch({
    control: form.control,
    name: getItemFieldPath(index, "unit_price"),
  });

  const quantity = useWatch({
    control: form.control,
    name: getItemFieldPath(index, "supplied_item_quantity"),
  });

  const taxComponents = useWatch({
    control: form.control,
    name: getItemFieldPath(index, "tax_components"),
  });

  const discountComponents = useWatch({
    control: form.control,
    name: getItemFieldPath(index, "discount_components"),
  });

  const informationalComponents = useWatch({
    control: form.control,
    name: getItemFieldPath(index, "informational_components"),
  });

  const chargeItemCategory = useWatch({
    control: form.control,
    name: getItemFieldPath(index, "charge_item_category"),
  });

  const isTaxInclusive = useWatch({
    control: form.control,
    name: getItemFieldPath(index, "is_tax_inclusive"),
  });

  // Fetch facility data for tax/discount/informational components
  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  // Fetch products for the selected product knowledge
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", facilityId, productKnowledge?.slug],
    queryFn: query(productApi.listProduct, {
      pathParams: { facilityId },
      queryParams: {
        product_knowledge: productKnowledge?.slug,
        ordering: "-created_date",
        limit: 50,
        status: "active",
      },
    }),
    enabled: !!productKnowledge?.slug,
  });

  const products = useMemo(
    () => productsResponse?.results || [],
    [productsResponse?.results],
  );

  const fillFormFromProduct = useCallback(
    (product: ProductRead) => {
      form.setValue(`items.${index}.supplied_item`, product);

      if (product.batch?.lot_number) {
        form.setValue(`items.${index}.batch_number`, product.batch.lot_number);
      }
      if (product.expiration_date) {
        form.setValue(
          `items.${index}.expiry_date`,
          format(new Date(product.expiration_date), "yyyy-MM-dd"),
        );
      }

      const chargeItemDef = product.charge_item_definition;
      if (chargeItemDef) {
        form.setValue(`items.${index}.charge_item_definition`, chargeItemDef);

        // Set the charge item category so it persists when editing
        if (chargeItemDef.category?.slug) {
          form.setValue(
            getItemFieldPath(index, "charge_item_category"),
            chargeItemDef.category.slug,
          );
        }

        // Extract pricing components using shared utility
        const baseComponents = getComponentsFromChargeItem(
          chargeItemDef,
          MonetaryComponentType.base,
        );
        if (baseComponents[0]?.amount) {
          form.setValue(
            `items.${index}.unit_price`,
            parseFloat(baseComponents[0].amount),
          );
        }

        const informational = getComponentsFromChargeItem(
          chargeItemDef,
          MonetaryComponentType.informational,
        );
        if (informational.length) {
          form.setValue(
            getItemFieldPath(index, "informational_components"),
            informational,
          );
        }

        const taxes = getComponentsFromChargeItem(
          chargeItemDef,
          MonetaryComponentType.tax,
        );
        if (taxes.length) {
          form.setValue(getItemFieldPath(index, "tax_components"), taxes);
        }

        const discounts = getComponentsFromChargeItem(
          chargeItemDef,
          MonetaryComponentType.discount,
        );
        if (discounts.length) {
          form.setValue(
            getItemFieldPath(index, "discount_components"),
            discounts,
          );
        }
      } else {
        form.setValue(`items.${index}.unit_price`, 0);
      }

      form.setValue(`items.${index}.is_manually_edited`, false);
      setIsCreatingNew(false);
    },
    [form, index],
  );

  // Determine if category selection is needed for charge item definition
  // Show picker when: product knowledge selected AND (creating new item OR no existing products)
  // Note: Charge item category is separate from product knowledge category
  const needsCategorySelection = useMemo(() => {
    if (!productKnowledge) return false;
    // If we have an existing product selected with a charge item, don't show picker
    if (suppliedItem?.charge_item_definition?.category) return false;
    // If creating new item OR no products exist, need to select charge item category
    if (isCreatingNew || products.length === 0) return true;
    return false;
  }, [productKnowledge, suppliedItem, products.length, isCreatingNew]);

  // Auto-fill from last product when product knowledge is selected
  useEffect(() => {
    if (
      products.length > 0 &&
      !suppliedItem &&
      !form.getValues(`items.${index}.is_manually_edited`)
    ) {
      const lastProduct = products[0];
      fillFormFromProduct(lastProduct);
    }
  }, [products, suppliedItem, index, form, fillFormFromProduct]);

  const handleProductSelect = (product: ProductRead) => {
    fillFormFromProduct(product);
    setBatchSelectorOpen(false);
  };

  const markAsEdited = () => {
    form.setValue(`items.${index}.is_manually_edited`, true);
    form.setValue(`items.${index}.supplied_item`, undefined);
    setIsCreatingNew(true);
  };

  // Calculate computed total using shared utility
  const computedTotal = useMemo(() => {
    return calculateItemTotal(
      unitPrice || 0,
      quantity || 1,
      taxComponents,
      discountComponents,
    );
  }, [unitPrice, quantity, taxComponents, discountComponents]);

  // Available components from facility
  const availableTaxes = useMemo(
    () =>
      (facilityData?.instance_tax_monetary_components ||
        []) as MonetaryComponentRead[],
    [facilityData],
  );

  const availableDiscounts = useMemo(
    () =>
      [
        ...(facilityData?.discount_monetary_components || []),
        ...(facilityData?.instance_discount_monetary_components || []),
      ].map((component) => ({
        ...component,
        amount:
          component?.amount != null
            ? String(component.amount)
            : component.amount,
      })) as MonetaryComponentRead[],
    [facilityData],
  );

  // Get MRP value from informational components
  const mrpValue = useMemo(() => {
    const mrpComponent = informationalComponents?.find(
      (c) => c.code?.code === MRP_CODE,
    );
    return mrpComponent?.amount ? parseFloat(mrpComponent.amount) : 0;
  }, [informationalComponents]);

  // Calculate total tax factor (sum of all tax percentages)
  const totalTaxFactor = useMemo(() => {
    if (!taxComponents?.length) return 0;
    return taxComponents.reduce((sum, tax) => sum + (tax.factor || 0), 0);
  }, [taxComponents]);

  // Calculate base price from MRP when tax inclusive is enabled
  // Formula: base_price = mrp / (1 + totalTaxRate/100)
  useEffect(() => {
    if (isTaxInclusive && mrpValue > 0) {
      const calculatedBasePrice = mrpValue / (1 + totalTaxFactor / 100);
      const roundedBasePrice = Math.round(calculatedBasePrice * 100) / 100;
      form.setValue(getItemFieldPath(index, "unit_price"), roundedBasePrice);
    }
  }, [isTaxInclusive, mrpValue, totalTaxFactor, form, index]);

  const getExpirationDisplay = (product: ProductRead) => {
    return product.expiration_date
      ? format(new Date(product.expiration_date), "MMM yyyy")
      : "N/A";
  };

  return (
    <TableRow className="divide-x divide-gray-200 hover:bg-gray-50/50">
      {/* Product Knowledge */}
      <TableCell className="align-top p-2">
        <FormField
          control={form.control}
          name={`items.${index}.product_knowledge`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ProductKnowledgeSelect
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    onProductSelectOpened?.();
                    resetItemFormFields(form, index);
                    setIsCreatingNew(false);
                  }}
                  placeholder={t("select_product")}
                  className="w-full min-w-[180px]"
                  disableFavorites
                  hideClearButton
                  defaultOpen={autoOpenProductSelect}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Batch Number - Combined Selector + Input */}
      <TableCell className="align-top p-2 pb-4!">
        <Popover open={batchSelectorOpen} onOpenChange={setBatchSelectorOpen}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "flex items-center border rounded-md h-9 p-1! cursor-pointer hover:border-gray-400 transition-colors",
                !productKnowledge && "opacity-50 pointer-events-none",
                isCreatingNew && "border-green-500 bg-green-50",
              )}
            >
              <Input
                value={batchNumber || ""}
                onChange={(e) => {
                  form.setValue(`items.${index}.batch_number`, e.target.value);
                  markAsEdited();
                  // Keep popover open while typing for suggestions
                  if (!batchSelectorOpen && e.target.value) {
                    setBatchSelectorOpen(true);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setBatchSelectorOpen(true);
                }}
                placeholder={t("batch_no")}
                disabled={!productKnowledge}
                className={cn(
                  "border-0 h-7 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[100px] border-none! shadow-none!",
                  isCreatingNew && "bg-green-50",
                )}
              />
              <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandList className="max-h-[250px]">
                {/* Create new option - always show if there's input */}
                {batchNumber && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        markAsEdited();
                        setBatchSelectorOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-green-700">
                        <Plus className="h-4 w-4" />
                        <span>
                          {t("create_batch")}: <strong>{batchNumber}</strong>
                        </span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                {isLoadingProducts ? (
                  <div className="py-6 text-center text-sm">
                    <CareIcon
                      icon="l-spinner"
                      className="size-4 animate-spin mx-auto mb-2"
                    />
                    {t("loading")}...
                  </div>
                ) : products.length === 0 ? (
                  !batchNumber && (
                    <CommandEmpty>{t("type_batch_number")}</CommandEmpty>
                  )
                ) : (
                  <CommandGroup heading={t("existing_batches")}>
                    {products
                      .filter(
                        (p) =>
                          !batchNumber ||
                          p.batch?.lot_number
                            ?.toLowerCase()
                            .includes(batchNumber.toLowerCase()),
                      )
                      .map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.id}
                          onSelect={() => handleProductSelect(product)}
                          className="cursor-pointer"
                        >
                          <div className="flex w-full items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                #{product.batch?.lot_number || "N/A"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Exp: {getExpirationDisplay(product)}
                              </span>
                            </div>
                            {suppliedItem?.id === product.id && (
                              <CareIcon
                                icon="l-check"
                                className="size-4 text-green-600"
                              />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {isCreatingNew && (
          <Badge
            variant="outline"
            className="text-[10px] mt-1 text-green-600 border-green-300"
          >
            {t("new")}
          </Badge>
        )}
      </TableCell>

      {/* Expiry Date */}
      <TableCell className="align-top p-2">
        <FormField
          control={form.control}
          name={`items.${index}.expiry_date`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  onChange={(e) => {
                    field.onChange(e);
                    markAsEdited();
                  }}
                  disabled={!productKnowledge}
                  className="w-full min-w-[10rem]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Quantity */}
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
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className="w-full min-w-[70px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Category - Charge Item Definition Category */}
      <TableCell className="align-top p-2 text-center">
        {needsCategorySelection ? (
          <ResourceCategoryPicker
            facilityId={facilityId}
            resourceType={ResourceCategoryResourceType.charge_item_definition}
            value={chargeItemCategory}
            onValueChange={(category) => {
              form.setValue(
                getItemFieldPath(index, "charge_item_category"),
                category?.slug || "",
              );
            }}
            placeholder={t("select_category")}
            className="w-full min-w-[140px]"
          />
        ) : (
          <span className="text-sm text-gray-500">
            {suppliedItem?.charge_item_definition?.category?.title || "-"}
          </span>
        )}
      </TableCell>

      {/* Base Price */}
      <TableCell className="align-top p-2!">
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-1">
              {CURRENCY_SYMBOL}
            </span>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={unitPrice || ""}
              placeholder="0.00"
              onChange={(e) => {
                form.setValue(
                  `items.${index}.unit_price`,
                  parseFloat(e.target.value) || 0,
                );
                markAsEdited();
              }}
              disabled={!productKnowledge || isTaxInclusive}
              className={cn(
                "w-[90px] text-right",
                isTaxInclusive && "bg-gray-100 text-gray-600",
              )}
            />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={isTaxInclusive || false}
              onCheckedChange={(checked) => {
                form.setValue(
                  getItemFieldPath(index, "is_tax_inclusive"),
                  !!checked,
                );
                markAsEdited();
              }}
              disabled={!productKnowledge}
              className="h-3.5 w-3.5"
            />
            <span className="text-[10px] text-gray-500 whitespace-nowrap">
              {t("tax_inclusive")}
            </span>
          </label>
        </div>
      </TableCell>

      {/* Dynamic Informational Components (MRP, Purchase Price, etc.) */}
      {informationalCodes.map((code) => {
        const currentValue = informationalComponents?.find(
          (c) => c.code?.code === code.code,
        );
        return (
          <TableCell key={code.code} className="align-top p-2">
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-1">
                {CURRENCY_SYMBOL}
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={currentValue?.amount || ""}
                placeholder="0.00"
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value) || 0;
                  const newComponent: MonetaryComponent = {
                    monetary_component_type:
                      MonetaryComponentType.informational,
                    amount: newValue.toString(),
                    code: code,
                  };
                  const updated: MonetaryComponent[] = [
                    ...(informationalComponents || []).filter(
                      (c) => c.code?.code !== code.code,
                    ),
                    ...(newValue > 0 ? [newComponent] : []),
                  ];
                  form.setValue(
                    getItemFieldPath(index, "informational_components"),
                    updated,
                  );
                  markAsEdited();
                }}
                disabled={!productKnowledge}
                className="w-[90px] text-right"
              />
            </div>
          </TableCell>
        );
      })}

      {/* Taxes */}
      <TableCell className="align-top p-2">
        <MonetaryComponentSelector
          type={MonetaryComponentType.tax}
          components={availableTaxes}
          selectedComponents={taxComponents || []}
          onSelectionChange={(components) => {
            form.setValue(
              getItemFieldPath(index, "tax_components"),
              components,
            );
            markAsEdited();
          }}
          disabled={!productKnowledge}
          displayMode="inline"
        />
      </TableCell>

      {/* Discounts */}
      <TableCell className="align-top p-2">
        <MonetaryComponentSelector
          type={MonetaryComponentType.discount}
          components={availableDiscounts}
          selectedComponents={discountComponents || []}
          onSelectionChange={(components) => {
            form.setValue(
              getItemFieldPath(index, "discount_components"),
              components,
            );
            markAsEdited();
          }}
          disabled={!productKnowledge}
          displayMode="inline"
        />
      </TableCell>

      {/* Total */}
      <TableCell className="align-top p-2">
        <div className="flex flex-col items-end min-w-[80px]">
          <MonetaryDisplay
            amount={computedTotal.toFixed(2)}
            className="font-semibold text-gray-900"
          />
          {isCreatingNew && (
            <Badge
              variant="outline"
              className="text-[10px] mt-1 text-green-600 border-green-300"
            >
              {t("new")}
            </Badge>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
