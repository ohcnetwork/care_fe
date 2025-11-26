import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Check,
  ChevronDown,
  Component,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import RadioInput from "@/components/ui/RadioInput";
import { TableCell, TableRow } from "@/components/ui/table";

import { cn } from "@/lib/utils";

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
  MonetaryComponent,
  MonetaryComponentRead,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import facilityApi from "@/types/facility/facilityApi";
import { ProductRead } from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import query from "@/Utils/request/query";

interface Props {
  form: UseFormReturn<SupplyDeliveryFormValues>;
  index: number;
  facilityId: string;
  informationalCodes: Code[];
  onRemove: () => void;
  canRemove: boolean;
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

// Helper to compare monetary components
const monetaryComponentIsEqual = <T extends MonetaryComponent>(a: T, b: T) => {
  return (
    a.monetary_component_type === b.monetary_component_type &&
    a.code?.code === b.code?.code &&
    a.code?.system === b.code?.system
  );
};

// Inline Tax/Discount Selector matching the ChargeItemDefinitionForm style
function InlineMonetarySelector({
  type,
  components,
  selectedComponents,
  onSelectionChange,
  disabled,
}: {
  type: MonetaryComponentType;
  components: MonetaryComponentRead[];
  selectedComponents: MonetaryComponent[];
  onSelectionChange: (components: MonetaryComponent[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelected, setTempSelected] = useState<MonetaryComponent[]>([]);

  // Initialize temp selections when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedComponents);
    }
  }, [isOpen, selectedComponents]);

  const getComponentValue = (component: MonetaryComponent) => {
    return component.factor ?? component.amount ?? 0;
  };

  const isSameAmountOrFactor = (
    component: MonetaryComponent,
    otherComponent: MonetaryComponent,
  ) => {
    return (
      (component.factor != null &&
        component.factor === otherComponent.factor) ||
      (component.amount != null && component.amount === otherComponent.amount)
    );
  };

  const isComponentSelected = (
    component: MonetaryComponentRead,
    selected: MonetaryComponent[],
  ) =>
    selected.some(
      (c) =>
        monetaryComponentIsEqual(c, component) &&
        isSameAmountOrFactor(c, component),
    );

  // Group components by code (CGST, SGST, IGST, etc.)
  const groupedComponents = useMemo(() => {
    return components.reduce<Record<string, MonetaryComponentRead[]>>(
      (acc, component) => {
        const key = component.code?.code;
        if (key) {
          (acc[key] ||= []).push(component);
        }
        return acc;
      },
      {},
    );
  }, [components]);

  const { groupComponents, nonGroupComponents } = useMemo(() => {
    const groups: Record<string, MonetaryComponentRead[]> = {};
    const nonGroups: MonetaryComponentRead[] = [];

    Object.entries(groupedComponents).forEach(([key, comps]) => {
      if (comps.length > 1) {
        groups[key] = comps;
      } else {
        nonGroups.push(comps[0]);
      }
    });

    return { groupComponents: groups, nonGroupComponents: nonGroups };
  }, [groupedComponents]);

  const filteredGroupComponents = useMemo(() => {
    return Object.entries(groupComponents).reduce<
      Record<string, MonetaryComponentRead[]>
    >((acc, [key, comps]) => {
      const filtered = comps.filter(
        (c) =>
          c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code?.code?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (filtered.length > 0) {
        acc[key] = filtered;
      }
      return acc;
    }, {});
  }, [groupComponents, searchQuery]);

  const filteredNonGroupComponents = useMemo(() => {
    return nonGroupComponents.filter(
      (c) =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code?.code?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [nonGroupComponents, searchQuery]);

  const handleRadioChange = (groupKey: string, selected: string) => {
    if (!selected) {
      setTempSelected((prev) => prev.filter((c) => c.code?.code !== groupKey));
      return;
    }

    const group = groupComponents[groupKey];
    if (!group) return;

    const selectedComponent = group.find(
      (c) => getComponentValue(c).toString() === selected,
    );

    if (!selectedComponent) return;

    setTempSelected((prev) => {
      const filtered = prev.filter((c) => c.code?.code !== groupKey);
      return [
        ...filtered,
        {
          ...selectedComponent,
          monetary_component_type: type,
          factor:
            selectedComponent.factor != null
              ? selectedComponent.factor
              : undefined,
          amount:
            selectedComponent.factor != null
              ? undefined
              : String(selectedComponent.amount || 0),
          conditions: [],
        },
      ];
    });
  };

  const handleCheckboxToggle = (
    component: MonetaryComponentRead,
    checked: boolean,
  ) => {
    if (checked) {
      setTempSelected((prev) => [
        ...prev,
        {
          ...component,
          monetary_component_type: type,
          factor: component.factor != null ? component.factor : undefined,
          amount:
            component.factor != null
              ? undefined
              : String(component.amount || 0),
          conditions: [],
        },
      ]);
    } else {
      setTempSelected((prev) =>
        prev.filter((c) => !monetaryComponentIsEqual(c, component)),
      );
    }
  };

  const handleDone = () => {
    onSelectionChange(tempSelected);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSearchQuery("");
    setTempSelected([]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-full min-w-[100px] justify-between text-xs h-9"
        >
          {selectedComponents.length === 0 ? (
            <span className="text-muted-foreground">
              {type === MonetaryComponentType.tax
                ? t("add_tax")
                : t("add_discount")}
            </span>
          ) : (
            <div className="flex items-center gap-1 overflow-hidden">
              {selectedComponents.slice(0, 2).map((c, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-[10px] px-1 rounded-sm"
                >
                  {c.code?.display} @ {getComponentValue(c)}
                  {c.factor != null ? "%" : "₹"}
                </Badge>
              ))}
              {selectedComponents.length > 2 && (
                <Badge variant="secondary" className="text-[10px] px-1">
                  +{selectedComponents.length - 2}
                </Badge>
              )}
            </div>
          )}
          <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                type === MonetaryComponentType.tax
                  ? "search_for_tax_code"
                  : "search_for_discount_code",
              )}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[30vh] overflow-y-auto p-2">
          {/* Grouped Components with Radio Buttons */}
          {Object.entries(filteredGroupComponents).map(([key, comps]) => {
            const selectedInGroup = comps.find((c) =>
              isComponentSelected(c, tempSelected),
            );
            const selectedValue = selectedInGroup
              ? `${getComponentValue(selectedInGroup)}`
              : "";

            const radioOptions = comps.map((c) => ({
              label: `${getComponentValue(c)} ${c.factor != null ? "%" : "₹"}`,
              value: `${getComponentValue(c)}`,
            }));

            return (
              <div key={key} className="flex flex-col gap-2 mb-3">
                <div className="flex items-center gap-2 p-2">
                  <Component
                    className="size-4 text-black/80"
                    strokeWidth={1.25}
                  />
                  <div className="text-sm font-semibold text-gray-900 uppercase">
                    {key}
                  </div>
                </div>
                <RadioInput
                  value={selectedValue}
                  onValueChange={(value: string) =>
                    handleRadioChange(key, value)
                  }
                  options={radioOptions}
                  className="flex flex-row gap-1 justify-end mr-2"
                />
              </div>
            );
          })}

          {/* Non-grouped Components with Checkboxes */}
          {filteredNonGroupComponents.map((component, idx) => {
            const isSelected = isComponentSelected(component, tempSelected);
            return (
              <div
                key={`${component.title}-${component.code?.code || idx}`}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) =>
                    handleCheckboxToggle(component, e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="flex flex-row justify-between items-center flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {component.code?.display}
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    {getComponentValue(component)}
                    <span className="text-gray-500">
                      {component.factor != null ? "%" : "₹"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {Object.keys(filteredGroupComponents).length === 0 &&
            filteredNonGroupComponents.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">
                {t(
                  type === MonetaryComponentType.tax
                    ? "no_taxes_configured"
                    : "no_discounts_configured",
                )}
              </p>
            )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex gap-2">
          <Button
            type="button"
            onClick={handleCancel}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleDone}
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="size-4 mr-1" />
            {t("done")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SmartExternalDeliveryRow({
  form,
  index,
  facilityId,
  informationalCodes,
  onRemove,
  canRemove,
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

  const products = productsResponse?.results || [];

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
  }, [products, suppliedItem, index]);

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
      if (product.charge_item_definition) {
        form.setValue(
          `items.${index}.charge_item_definition`,
          product.charge_item_definition,
        );

        // Set the charge item category so it persists when editing
        if (product.charge_item_definition.category?.slug) {
          form.setValue(
            getItemFieldPath(index, "charge_item_category"),
            product.charge_item_definition.category.slug,
          );
        }

        // Extract pricing components
        const basePrice = product.charge_item_definition.price_components?.find(
          (c) => c.monetary_component_type === MonetaryComponentType.base,
        );
        if (basePrice?.amount) {
          form.setValue(
            `items.${index}.unit_price`,
            parseFloat(basePrice.amount),
          );
        }

        // Extract informational components (MRP, Purchase Price, etc.)
        const informational =
          product.charge_item_definition.price_components?.filter(
            (c) =>
              c.monetary_component_type === MonetaryComponentType.informational,
          );
        if (informational?.length) {
          form.setValue(
            getItemFieldPath(index, "informational_components"),
            informational,
          );
        }

        // Extract taxes
        const taxes = product.charge_item_definition.price_components?.filter(
          (c) => c.monetary_component_type === MonetaryComponentType.tax,
        );
        if (taxes?.length) {
          form.setValue(getItemFieldPath(index, "tax_components"), taxes);
        }

        // Extract discounts
        const discounts =
          product.charge_item_definition.price_components?.filter(
            (c) => c.monetary_component_type === MonetaryComponentType.discount,
          );
        if (discounts?.length) {
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

  const handleProductSelect = (product: ProductRead) => {
    fillFormFromProduct(product);
    setBatchSelectorOpen(false);
  };

  const markAsEdited = () => {
    form.setValue(`items.${index}.is_manually_edited`, true);
    form.setValue(`items.${index}.supplied_item`, undefined);
    setIsCreatingNew(true);
  };

  // Calculate computed total
  const computedTotal = useMemo(() => {
    const basePrice = unitPrice || 0;
    let total = basePrice * (quantity || 1);

    // Apply taxes
    if (taxComponents?.length) {
      taxComponents.forEach((tax) => {
        if (tax.factor) {
          total += basePrice * (quantity || 1) * (tax.factor / 100);
        } else if (tax.amount) {
          total += parseFloat(tax.amount);
        }
      });
    }

    // Apply discounts
    if (discountComponents?.length) {
      discountComponents.forEach((discount) => {
        if (discount.factor) {
          total -= basePrice * (quantity || 1) * (discount.factor / 100);
        } else if (discount.amount) {
          total -= parseFloat(discount.amount);
        }
      });
    }

    return total;
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
                    // Clear everything when PK changes
                    form.setValue(
                      getItemFieldPath(index, "supplied_item"),
                      undefined,
                    );
                    form.setValue(getItemFieldPath(index, "batch_number"), "");
                    form.setValue(getItemFieldPath(index, "expiry_date"), "");
                    form.setValue(
                      getItemFieldPath(index, "charge_item_definition"),
                      undefined,
                    );
                    form.setValue(getItemFieldPath(index, "unit_price"), 0);
                    form.setValue(
                      getItemFieldPath(index, "informational_components"),
                      [],
                    );
                    form.setValue(
                      getItemFieldPath(index, "tax_components"),
                      [],
                    );
                    form.setValue(
                      getItemFieldPath(index, "discount_components"),
                      [],
                    );
                    form.setValue(
                      getItemFieldPath(index, "charge_item_category"),
                      undefined,
                    );
                    form.setValue(
                      getItemFieldPath(index, "is_manually_edited"),
                      false,
                    );
                    setIsCreatingNew(false);
                  }}
                  placeholder={t("select_product")}
                  className="w-full min-w-[180px]"
                  disableFavorites
                  hideClearButton
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Batch Number - Combined Selector + Input */}
      <TableCell className="align-top p-2">
        <Popover open={batchSelectorOpen} onOpenChange={setBatchSelectorOpen}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "flex items-center border rounded-md h-9 px-3 cursor-pointer hover:border-gray-400 transition-colors",
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
                className="border-0 h-7 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[100px]"
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
                          value={product.batch?.lot_number || product.id}
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
                  className="w-full min-w-[130px]"
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
      <TableCell className="align-top p-2">
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-1">{CURRENCY_SYMBOL}</span>
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
            disabled={!productKnowledge}
            className="w-[90px] text-right"
          />
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
        <InlineMonetarySelector
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
        />
      </TableCell>

      {/* Discounts */}
      <TableCell className="align-top p-2">
        <InlineMonetarySelector
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

      {/* Remove */}
      <TableCell className="align-top p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9"
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
