import { format } from "date-fns";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { add, isPositive, round } from "@/Utils/decimal";
import { MonetaryComponentSelector } from "@/components/Billing/MonetaryComponentSelector";
import { ResourceCategoryPicker } from "@/components/Common/ResourceCategoryPicker";
import { SchemaField } from "@/components/Extensions/SchemaField";
import { CURRENCY_SYMBOL } from "@/components/ui/monetary-display";
import { ProcessedExtension } from "@/hooks/useExtensions";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Code } from "@/types/base/code/code";
import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ProductRead } from "@/types/inventory/product/product";

import { SupplyDeliveryFormValues } from "./AddSupplyDeliveryForm";
import { useDeliveryRowItem } from "./useDeliveryRowItem";

interface Props {
  form: UseFormReturn<SupplyDeliveryFormValues>;
  index: number;
  informationalCodes: Code[];
  autoOpenProductSelect?: boolean;
  onProductSelectOpened?: () => void;
  /** All processed extensions with owner and schema info */
  processedExtensions: ProcessedExtension[];
  /** Location ID for fetching inventory (origin location for internal transfers) */
  locationId?: string;
  onRemove?: () => void;
}

export function SmartExternalDeliveryRow({
  form,
  index,
  informationalCodes,
  autoOpenProductSelect = false,
  onProductSelectOpened,
  processedExtensions,
  locationId,
  onRemove,
}: Props) {
  const { facilityId } = useCurrentFacility();
  const { t } = useTranslation();
  const [batchSelectorOpen, setBatchSelectorOpen] = useState(false);

  // Filter extensions that have fields to render
  const extensionsWithFields = useMemo(
    () =>
      processedExtensions.filter(
        ({ fieldMetadata }) => fieldMetadata.length > 0,
      ),
    [processedExtensions],
  );

  const {
    productKnowledge,
    suppliedItem,
    batchNumber,
    unitPrice,
    purchasePrice,
    totalPurchasePrice,
    packQuantity,
    packSize,
    taxComponents,
    discountComponents,
    informationalComponents,
    chargeItemCategory,
    isTaxInclusive,
    needsCategorySelection,
    isCreatingNew,
    isLoadingProducts,
    products,
    inventoryByProductId,
    availableTaxes,
    availableDiscounts,
    setField,
    resetFields,
    markAsEdited,
    fillFromProduct,
    updateInformationalComponent,
  } = useDeliveryRowItem({ form, index, locationId });

  const handleProductSelect = (product: ProductRead) => {
    fillFromProduct(product);
    setBatchSelectorOpen(false);
  };

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
                    resetFields();
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

      {/* Batch Number */}
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
                  setField("batch_number", e.target.value);
                  markAsEdited();
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
                  (() => {
                    const filteredProducts = products.filter(
                      (p) =>
                        !batchNumber ||
                        p.batch?.lot_number
                          ?.toLowerCase()
                          .includes(batchNumber.toLowerCase()),
                    );
                    const totalNetContent =
                      locationId && filteredProducts.length > 0
                        ? add(
                            ...filteredProducts.map(
                              (p) =>
                                inventoryByProductId.get(p.id)?.net_content ||
                                "0",
                            ),
                          )
                        : null;
                    const unit =
                      productKnowledge?.base_unit?.display || t("units");

                    return (
                      <CommandGroup
                        heading={
                          <span className="flex items-center justify-between w-full">
                            <span>{t("existing_batches")}</span>
                            {totalNetContent !== null && (
                              <Badge
                                variant={
                                  isPositive(totalNetContent)
                                    ? "primary"
                                    : "secondary"
                                }
                                className="text-xs ml-2"
                              >
                                {round(totalNetContent)} {unit}
                              </Badge>
                            )}
                          </span>
                        }
                      >
                        {filteredProducts.map((product) => {
                          const inventory = inventoryByProductId.get(
                            product.id,
                          );
                          const netContent = inventory?.net_content;

                          return (
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
                                    {t("expiry_short")}:{" "}
                                    {getExpirationDisplay(product)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {locationId && netContent !== undefined && (
                                    <Badge
                                      variant={
                                        isPositive(netContent)
                                          ? "primary"
                                          : "destructive"
                                      }
                                      className="text-xs"
                                    >
                                      {round(netContent)} {unit}
                                    </Badge>
                                  )}
                                  {suppliedItem?.id === product.id && (
                                    <CareIcon
                                      icon="l-check"
                                      className="size-4 text-green-600"
                                    />
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    );
                  })()
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

      {/* Category */}
      <TableCell className="align-top p-2 text-center">
        {needsCategorySelection ? (
          <ResourceCategoryPicker
            facilityId={facilityId}
            resourceType={ResourceCategoryResourceType.charge_item_definition}
            value={chargeItemCategory}
            onValueChange={(category) => {
              setField("charge_item_category", category?.slug || "");

              // Auto-apply configured monetary components from category
              if (category?.configured_monetary_components) {
                const taxes = category.configured_monetary_components.filter(
                  (c): c is MonetaryComponent =>
                    c.monetary_component_type === MonetaryComponentType.tax,
                );
                setField("tax_components", taxes);
              } else {
                // Clear components when category is cleared
                setField("tax_components", []);
              }
              markAsEdited();
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

      {/* Pack Size */}
      <TableCell className="align-top p-2">
        <Input
          type="number"
          min={1}
          value={packSize || ""}
          placeholder="0"
          onChange={(e) => {
            const value = parseInt(e.target.value) || undefined;
            setField("supplied_item_pack_size", value);
            markAsEdited();
          }}
          disabled={!productKnowledge}
          className="w-20"
        />
      </TableCell>

      {/* Pack Quantity */}
      <TableCell className="align-top p-2">
        <Input
          type="number"
          min={1}
          value={packQuantity || ""}
          placeholder="0"
          onChange={(e) => {
            const value = parseInt(e.target.value) || undefined;
            setField("supplied_item_pack_quantity", value);
          }}
          disabled={!productKnowledge}
          className="w-[7rem]"
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
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-32"
                  disabled
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Item Price */}
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
              placeholder="0"
              onChange={(e) => {
                setField("unit_price", e.target.value);
                markAsEdited();
              }}
              disabled={!productKnowledge || isTaxInclusive}
              className={cn(
                "w-[90px]",
                isTaxInclusive && "bg-gray-100 text-gray-600",
              )}
            />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={isTaxInclusive || false}
              onCheckedChange={(checked) => {
                setField("is_tax_inclusive", !!checked);
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
                placeholder="0"
                onChange={(e) => {
                  updateInformationalComponent(
                    code,
                    parseFloat(e.target.value) || 0,
                  );
                }}
                disabled={!productKnowledge}
                className="w-[90px]"
              />
            </div>
          </TableCell>
        );
      })}

      {/* Purchase Price (auto-calculated: tpr / pack_quantity) */}
      <TableCell className="align-top p-2">
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-1">{CURRENCY_SYMBOL}</span>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={purchasePrice || ""}
            placeholder="0"
            disabled
            className="w-[90px] bg-gray-100 text-gray-600"
          />
        </div>
      </TableCell>

      {/* Total Purchase Price (user-entered) */}
      <TableCell className="align-top p-2">
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-1">{CURRENCY_SYMBOL}</span>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={totalPurchasePrice || ""}
            placeholder="0"
            onChange={(e) => {
              setField("total_purchase_price", e.target.value || undefined);
              markAsEdited();
            }}
            disabled={!productKnowledge}
            className="w-[100px]"
          />
        </div>
      </TableCell>

      {/* Taxes */}
      <TableCell className="align-top p-2">
        <MonetaryComponentSelector
          type={MonetaryComponentType.tax}
          components={availableTaxes}
          selectedComponents={taxComponents || []}
          onSelectionChange={(components) => {
            setField("tax_components", components);
            markAsEdited();
          }}
          disabled={!productKnowledge}
          displayMode="inline"
        />
        <span className="text-xs text-gray-500">
          <MonetaryComponentSelector
            type={MonetaryComponentType.discount}
            components={availableDiscounts}
            selectedComponents={discountComponents || []}
            onSelectionChange={(components) => {
              setField("discount_components", components);
              markAsEdited();
            }}
            disabled={!productKnowledge}
            displayMode="short"
          />
        </span>
      </TableCell>

      {/* Extension Fields - each field in its own column, name-namespaced */}
      {extensionsWithFields.flatMap(
        ({ config, fieldMetadata, conditionalRules }) =>
          fieldMetadata.map((fieldMeta) => (
            <TableCell
              key={`${config.name}-${fieldMeta.name}`}
              className="align-top"
            >
              <SchemaField
                metadata={{
                  ...fieldMeta,
                  label: "",
                  description: undefined,
                  required: false, // Hide asterisk - shown in table header
                }}
                control={form.control}
                basePath={`items.${index}.extensions.${config.name}`}
                className="min-w-[100px] [&_input]:h-9 gap-0"
                conditionalRules={conditionalRules}
              />
              {fieldMeta.description && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {fieldMeta.description}
                </p>
              )}
            </TableCell>
          )),
      )}

      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t("remove")}
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
