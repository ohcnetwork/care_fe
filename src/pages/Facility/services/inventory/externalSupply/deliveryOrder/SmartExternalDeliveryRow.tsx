import { format, parseISO } from "date-fns";
import { ChevronDown, Plus, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
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
import { dateQueryString } from "@/Utils/utils";
import { MonetaryComponentSelector } from "@/components/Billing/MonetaryComponentSelector";
import { ResourceCategoryPicker } from "@/components/Common/ResourceCategoryPicker";
import { SchemaField } from "@/components/Extensions/SchemaField";
import { CURRENCY_SYMBOL } from "@/components/ui/monetary-display";
import {
  AnchoredExtensionFields,
  ExtensionFormField,
} from "@/hooks/useExtensions";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Code } from "@/types/base/code/code";
import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ProductRead } from "@/types/inventory/product/product";

import {
  SupplyDeliveryFormAnchor,
  SupplyDeliveryFormValues,
} from "./AddSupplyDeliveryForm";
import { DeliveryMonetaryInput } from "./DeliveryMonetaryInput";
import { useDeliveryRowItem } from "./useDeliveryRowItem";

interface Props {
  form: UseFormReturn<SupplyDeliveryFormValues>;
  index: number;
  replacesDeliveryId?: string;
  informationalCodes: Code[];
  autoOpenProductSelect?: boolean;
  onProductSelectOpened?: () => void;
  /** Extension fields grouped by the column they follow (same grouping as the header) */
  extensionColumns: AnchoredExtensionFields<
    ExtensionFormField,
    SupplyDeliveryFormAnchor
  >;
  /** Location ID for fetching inventory (origin location for internal transfers) */
  locationId?: string;
  onRemove?: () => void;
}

export function SmartExternalDeliveryRow({
  form,
  index,
  replacesDeliveryId,
  informationalCodes,
  autoOpenProductSelect = false,
  onProductSelectOpened,
  extensionColumns,
  locationId,
  onRemove,
}: Props) {
  const { facilityId } = useCurrentFacility();
  const { t } = useTranslation();
  const [batchSelectorOpen, setBatchSelectorOpen] = useState(false);

  // Extension fields - each field in its own column, name-namespaced
  const renderExtensionCells = (fields: ExtensionFormField[]) =>
    fields.map((field) => (
      <TableCell
        key={`${field.extensionName}-${field.name}`}
        className="align-top"
      >
        <SchemaField
          metadata={{
            ...field,
            label: "",
            description: undefined,
            required: false, // Hide asterisk - shown in table header
          }}
          control={form.control}
          basePath={`items.${index}.extensions.${field.extensionName}`}
          className="min-w-[100px] [&_input]:h-9 gap-0"
          conditionalRules={field.conditionalRules}
        />
        {field.description && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {field.description}
          </p>
        )}
      </TableCell>
    ));
  const extensionCellsAfter = (anchor: SupplyDeliveryFormAnchor) =>
    renderExtensionCells(extensionColumns.at(anchor));

  const {
    productKnowledge,
    suppliedItem,
    batchNumber,
    unitPrice,
    purchasePrice,
    totalPurchasePrice,
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
    const expiry = dateQueryString(product.expiration_date);
    return expiry ? format(parseISO(expiry), "MMM yyyy") : "N/A";
  };

  return (
    <TableRow
      className="divide-x divide-gray-200 hover:bg-gray-50/50"
      data-pending-delivery-id={replacesDeliveryId}
    >
      {/* Product Knowledge */}
      <TableCell
        className={cn(
          "sticky left-0 z-10 border-r border-gray-200 bg-white align-top p-2 shadow-[1px_0_0_0_var(--color-gray-300)]",
          replacesDeliveryId && "bg-primary-50",
        )}
      >
        <div className="w-24 sm:w-56">
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
                    className="w-full"
                    disabled={Boolean(replacesDeliveryId)}
                    disableFavorites
                    hideClearButton
                    defaultOpen={autoOpenProductSelect && !replacesDeliveryId}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </TableCell>

      {extensionCellsAfter("product")}

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

      {extensionCellsAfter("batch")}

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
                  className="w-full min-w-[8rem] scroll-ml-28 scroll-mr-2 sm:min-w-[10rem] sm:scroll-ml-60 sm:scroll-mr-16"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {extensionCellsAfter("expiry")}

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
              markAsEdited(true);
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

      {extensionCellsAfter("category")}

      {/* Pack Size */}
      <TableCell className="align-top p-2">
        <Input
          type="number"
          min={1}
          value={packSize || ""}
          aria-label={t("pack_size")}
          placeholder="0"
          onChange={(e) => {
            const value = parseInt(e.target.value) || undefined;
            setField("supplied_item_pack_size", value);
            markAsEdited(Boolean(isTaxInclusive));
          }}
          disabled={!productKnowledge}
          className="w-20"
        />
      </TableCell>

      {extensionCellsAfter("pack_size")}

      {/* Pack Quantity */}
      <TableCell className="align-top p-2">
        <FormField
          control={form.control}
          name={`items.${index}.supplied_item_pack_quantity`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={field.value ?? ""}
                  aria-label={t("pack_qty")}
                  data-pending-item-quantity
                  placeholder={t("pack_qty")}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                    )
                  }
                  disabled={!productKnowledge?.slug}
                  className="w-[7rem] scroll-ml-28 scroll-mr-2 sm:scroll-ml-60 sm:scroll-mr-16"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {extensionCellsAfter("pack_quantity")}

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
                  aria-label={t("qty")}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-32"
                  disabled
                />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>

      {extensionCellsAfter("quantity")}

      {/* Item Price */}
      <TableCell className="align-top p-2!">
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-1">
              {CURRENCY_SYMBOL}
            </span>
            <DeliveryMonetaryInput
              value={unitPrice}
              aria-label={t("item_price")}
              placeholder="0"
              onValueChange={(value) => {
                setField("unit_price", value);
                markAsEdited(true);
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
                markAsEdited(true);
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
              <DeliveryMonetaryInput
                value={currentValue?.amount}
                placeholder="0"
                onValueChange={(value) => {
                  updateInformationalComponent(code, parseFloat(value) || 0);
                }}
                disabled={!productKnowledge}
                className="w-[90px]"
              />
            </div>
          </TableCell>
        );
      })}

      {extensionCellsAfter("sale")}

      {/* Purchase Price (auto-calculated: tpr / pack_size) */}
      <TableCell className="align-top p-2">
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-1">{CURRENCY_SYMBOL}</span>
          <DeliveryMonetaryInput
            value={purchasePrice}
            placeholder="0"
            disabled
            className="w-[90px] bg-gray-100 text-gray-600"
          />
        </div>
      </TableCell>

      {/* Total Purchase Price per pack (user-entered) */}
      <TableCell className="align-top p-2">
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-1">{CURRENCY_SYMBOL}</span>
          <DeliveryMonetaryInput
            value={totalPurchasePrice}
            aria-label={t("tpr")}
            placeholder="0"
            onValueChange={(value) => {
              setField("total_purchase_price", value || undefined);
              setField("is_total_purchase_price_edited", true);
              markAsEdited();
            }}
            disabled={!productKnowledge}
            className="w-[100px]"
          />
        </div>
      </TableCell>

      {extensionCellsAfter("purchase")}

      {/* Taxes */}
      <TableCell className="align-top p-2">
        <MonetaryComponentSelector
          type={MonetaryComponentType.tax}
          components={availableTaxes}
          selectedComponents={taxComponents || []}
          onSelectionChange={(components) => {
            setField("tax_components", components);
            markAsEdited(true);
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
              markAsEdited(true);
            }}
            disabled={!productKnowledge}
            displayMode="short"
          />
        </span>
      </TableCell>

      {extensionCellsAfter("tax")}

      {/* Extension fields without a placement */}
      {renderExtensionCells(extensionColumns.trailing)}

      <TableCell
        className={cn(
          "sm:sticky sm:right-0 z-10 border-l bg-white align-top p-2",
          replacesDeliveryId && "bg-primary-50",
        )}
      >
        {/* Hidden/const extension fields get no column */}
        {extensionColumns.hidden.map((field) => (
          <SchemaField
            key={`${field.extensionName}-${field.name}`}
            metadata={field}
            control={form.control}
            basePath={`items.${index}.extensions.${field.extensionName}`}
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={replacesDeliveryId ? t("discard_edit") : t("remove")}
          title={replacesDeliveryId ? t("discard_edit") : t("remove")}
        >
          {replacesDeliveryId ? (
            <Undo2 className="size-4" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}
