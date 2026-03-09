import { Eye, Info, LoaderCircle, MoreVertical, Shuffle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import StockLotSelector from "@/pages/Facility/services/inventory/StockLotSelector";
import {
  MedicationBillFormItem,
  MedicationBillFormValues,
  MedicationBillLotItem,
} from "@/pages/Facility/services/pharmacy/types";

import {
  formatDosage,
  formatDuration,
  formatFrequency,
  formatTotalUnits,
} from "@/components/Medicine/utils";

import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  getSubstitutionReasonDescription,
  getSubstitutionReasonDisplay,
  getSubstitutionTypeDescription,
  getSubstitutionTypeDisplay,
} from "@/types/emr/medicationDispense/medicationDispense";
import {
  computeMedicationDispenseQuantity,
  MedicationRequestDispenseStatus,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import { InventoryRead } from "@/types/inventory/product/inventory";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { round } from "@/Utils/decimal";

interface MedicationBillRowProps {
  index: number;
  field: MedicationBillFormItem;
  form: UseFormReturn<MedicationBillFormValues>;
  productKnowledgeInventoriesMap: Record<string, InventoryRead[] | undefined>;
  tableCellClass: string;
  onEditDosage: (index: number, productKnowledge: ProductKnowledgeBase) => void;
  onSubstitute: (
    index: number,
    originalProductKnowledge?: ProductKnowledgeBase,
    preSelectedProduct?: ProductKnowledgeBase,
  ) => void;
  onViewDispensed: (medicationId: string) => void;
  onMarkComplete: (medication: MedicationRequestRead, index: number) => void;
  onRemove: (
    medication: MedicationRequestRead | undefined,
    effectiveProductName: string,
    index: number,
    isAdded: boolean,
  ) => void;
  calculatePrices: (inventory: InventoryRead | undefined) => {
    basePrice: string;
  };
}

export function MedicationBillRow({
  index,
  field,
  form,
  productKnowledgeInventoriesMap,
  tableCellClass,
  onEditDosage,
  onSubstitute,
  onViewDispensed,
  onMarkComplete,
  onRemove,
  calculatePrices,
}: MedicationBillRowProps) {
  const { t } = useTranslation();

  const productKnowledge = field.productKnowledge as
    | ProductKnowledgeBase
    | undefined;
  const substitution = form.watch(`items.${index}.substitution`);
  const effectiveProductKnowledge =
    substitution?.substitutedProductKnowledge || productKnowledge;
  const isChecked = form.watch(`items.${index}.isSelected`);
  const hasNoProductKnowledge = !productKnowledge;
  const needsProductSelection =
    hasNoProductKnowledge && !effectiveProductKnowledge;

  // Display product knowledge (if available)
  const displayProductKnowledge = effectiveProductKnowledge;

  return (
    <TableRow className="bg-white hover:bg-gray-50/50 shadow-sm rounded-lg">
      <TableCell className={cn(tableCellClass, "rounded-l-lg")}>
        <FormField
          control={form.control}
          name={`items.${index}.isSelected`}
          render={({ field: formField }) => (
            <FormItem>
              <FormControl>
                <Checkbox
                  checked={formField.value}
                  onCheckedChange={formField.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className={cn(tableCellClass, "max-w-xs")}>
        <div
          className={cn(
            "flex items-center justify-between gap-2",
            !isChecked && "opacity-60 line-through",
          )}
        >
          <div>
            <div className="font-medium text-gray-950 text-base flex items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="whitespace-pre-wrap wrap-break-word">
                    {displayProductKnowledge?.name ||
                      field.medication?.medication?.display ||
                      t("unknown_medication")}
                  </span>
                  {needsProductSelection && (
                    <Badge variant="secondary">{t("no_product_linked")}</Badge>
                  )}
                  {(substitution || hasNoProductKnowledge) && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6 rounded-full hover:bg-blue-100"
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">
                            {t("substitution_details")}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-4 w-auto"
                        align="start"
                        side="bottom"
                      >
                        <div className="space-y-3">
                          <div className="font-semibold text-sm text-gray-950 underline">
                            {t("substitution_details")} :
                          </div>
                          <div className="space-y-3 text-sm max-w-md">
                            {hasNoProductKnowledge && (
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="font-medium text-gray-600">
                                    {t("original_medication")}:
                                  </span>
                                  <div className="text-gray-950 font-medium">
                                    {field.medication?.medication?.display ||
                                      t("unknown")}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 italic">
                                  {t("no_product_knowledge_linked")}
                                </div>
                              </div>
                            )}
                            {substitution && productKnowledge && (
                              <>
                                <div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="font-medium text-gray-600">
                                      {t("original_medication")}:
                                    </span>
                                    <div className="text-gray-950 font-medium">
                                      {productKnowledge.name}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="font-medium text-gray-600">
                                      {t("substituted_with")}:
                                    </span>
                                    <div className="text-gray-950 font-medium">
                                      {
                                        substitution.substitutedProductKnowledge
                                          ?.name
                                      }
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-600">
                                      {t("substitution_type")}:
                                    </span>
                                    <div className="text-gray-950 font-medium">
                                      {getSubstitutionTypeDisplay(
                                        t,
                                        substitution.type,
                                      )}{" "}
                                      ({substitution.type})
                                    </div>
                                  </div>
                                  <div className="text-gray-700 text-xs italic leading-relaxed">
                                    {getSubstitutionTypeDescription(
                                      t,
                                      substitution.type,
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-600">
                                      {t("substitution_reason")}:
                                    </span>
                                    <div className="text-gray-950 font-medium">
                                      {getSubstitutionReasonDisplay(
                                        t,
                                        substitution.reason,
                                      )}{" "}
                                      ({substitution.reason})
                                    </div>
                                  </div>
                                  <div className="text-gray-700 text-xs italic leading-relaxed">
                                    {getSubstitutionReasonDescription(
                                      t,
                                      substitution.reason,
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  {(substitution || hasNoProductKnowledge) && (
                    <Badge variant="orange">{t("substituted")}</Badge>
                  )}
                  {field.medication?.dispense_status ===
                    MedicationRequestDispenseStatus.partial && (
                    <Badge variant="yellow">
                      {t("partially_billed")}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="p-0 h-auto text-yellow-900 underline font-normal rounded-md w-6"
                            type="button"
                            onClick={() => {
                              onViewDispensed(field.medication!.id);
                            }}
                          >
                            <Eye className="size-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("view_dispensed")}</TooltipContent>
                      </Tooltip>
                    </Badge>
                  )}
                </div>
                {(substitution || hasNoProductKnowledge) && (
                  <div className="text-gray-500 font-normal italic line-through text-sm">
                    {hasNoProductKnowledge
                      ? field.medication?.medication?.display
                      : productKnowledge?.name}
                  </div>
                )}
              </div>
            </div>
            {field.medication ? (
              <div>
                <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                  {formatDosage(field.dosageInstructions?.[0])} ×{" "}
                  {formatFrequency(field.dosageInstructions?.[0])} ×{" "}
                  {formatDuration(field.dosageInstructions?.[0]) || "-"} ={" "}
                  <span className="text-gray-700 font-semibold text-sm">
                    {formatTotalUnits(field.dosageInstructions, t("units"))}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="text-sm text-gray-500 cursor-pointer hover:text-gray-900 underline"
                onClick={() => {
                  if (displayProductKnowledge) {
                    onEditDosage(index, displayProductKnowledge);
                  }
                }}
              >
                {(() => {
                  const currentDosageInstructions = form.watch(
                    `items.${index}.dosageInstructions`,
                  )?.[0];

                  if (currentDosageInstructions?.dose_and_rate?.dose_quantity) {
                    return (
                      <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
                        {formatDosage(currentDosageInstructions)} ×{" "}
                        {formatFrequency(currentDosageInstructions)} ×{" "}
                        {formatDuration(currentDosageInstructions) || "-"} ={" "}
                        <span className="text-gray-700 font-semibold text-sm">
                          {formatTotalUnits(
                            [currentDosageInstructions],
                            t("units"),
                          )}
                        </span>
                      </div>
                    );
                  }

                  return t("click_to_add_dosage_instructions");
                })()}
              </div>
            )}
            {field.medication?.note && (
              <span className="mt-4 text-xs text-gray-600 break-words whitespace-pre-wrap">
                {field.medication.note}
              </span>
            )}
          </div>
          {field.medication && (
            <Button
              variant="outline"
              size="sm"
              className="border-gray-400 border text-gray-950 hover:bg-gray-50"
              type="button"
              disabled={!isChecked}
              onClick={() => {
                onSubstitute(index, productKnowledge);
              }}
            >
              <Shuffle className="size-5" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className={tableCellClass}>
        {needsProductSelection ? (
          <div className="text-sm text-gray-500 py-2">
            {t("select_product_first")}
          </div>
        ) : productKnowledgeInventoriesMap[displayProductKnowledge!.id] ===
          undefined ? (
          <div className="flex w-full items-center">
            <LoaderCircle className="animate-spin size-4 mr-2" />
            {t("loading_stock")}
          </div>
        ) : productKnowledgeInventoriesMap[displayProductKnowledge!.id]
            ?.length ? (
          <div className="space-y-2">
            <StockLotSelector
              selectedLots={form.watch(`items.${index}.lots`)}
              onLotSelectionChange={(lots) => {
                const existingLotIds = (
                  form.getValues(
                    `items.${index}.lots`,
                  ) as MedicationBillLotItem[]
                ).map((lot: MedicationBillLotItem) => lot.selectedInventoryId);
                const newLots = lots.map((lot) => {
                  if (!existingLotIds.includes(lot.selectedInventoryId)) {
                    const medication = form.getValues(
                      `items.${index}.medication`,
                    );
                    return {
                      ...lot,
                      quantity: medication
                        ? computeMedicationDispenseQuantity(medication)
                        : lot.quantity,
                    };
                  }
                  return lot;
                });
                form.setValue(`items.${index}.lots`, newLots);
              }}
              availableInventories={
                productKnowledgeInventoriesMap[displayProductKnowledge!.id]
              }
              multiSelect
              showexpiry={true}
              disabled={!isChecked}
              showUnitPrice={false}
            />
          </div>
        ) : (
          <Badge
            variant="destructive"
            className={cn(!isChecked && "opacity-50")}
          >
            {t("no_stock")}
          </Badge>
        )}
      </TableCell>
      <TableCell className={tableCellClass}>
        <div className="space-y-2">
          {(form.watch(`items.${index}.lots`) as MedicationBillLotItem[])
            .filter((lot: MedicationBillLotItem) => lot.selectedInventoryId)
            .map((lot: MedicationBillLotItem) => {
              const actualLotIndex = (
                form.watch(`items.${index}.lots`) as MedicationBillLotItem[]
              ).findIndex(
                (l: MedicationBillLotItem) =>
                  l.selectedInventoryId === lot.selectedInventoryId,
              );

              return (
                <div
                  key={lot.selectedInventoryId}
                  className="flex items-center gap-2"
                >
                  <FormField
                    control={form.control}
                    name={`items.${index}.lots.${actualLotIndex}.quantity`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...formField}
                            className="border-gray-300 border rounded-md w-24"
                            placeholder="0"
                            disabled={!isChecked}
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          {(
            form.watch(`items.${index}.lots`) as MedicationBillLotItem[]
          ).filter((lot: MedicationBillLotItem) => lot.selectedInventoryId)
            .length === 0 && (
            <div className="text-sm text-gray-500 py-2">
              {t("select_lots_first")}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className={tableCellClass}>
        {(form.watch(`items.${index}.lots`) as MedicationBillLotItem[])
          .filter((lot: MedicationBillLotItem) => lot.selectedInventoryId)
          .map((lot: MedicationBillLotItem) => {
            const selectedInventory = displayProductKnowledge
              ? productKnowledgeInventoriesMap[
                  displayProductKnowledge.id
                ]?.find((inv) => inv.id === lot.selectedInventoryId)
              : undefined;
            const prices = calculatePrices(selectedInventory);
            const discountComponents =
              selectedInventory?.product.charge_item_definition?.price_components.filter(
                (c) =>
                  c.monetary_component_type === MonetaryComponentType.discount,
              );
            const hasDiscount =
              discountComponents && discountComponents.length > 0;

            return (
              <div
                key={lot.selectedInventoryId}
                className={cn(
                  "py-1.5 text-gray-950 font-normal text-sm",
                  !isChecked && "opacity-60 text-gray-500",
                )}
              >
                <MonetaryDisplay amount={prices.basePrice} />
                {hasDiscount && (
                  <span className="text-xs text-gray-500 ml-1">
                    (
                    {discountComponents
                      .map((component) =>
                        component.factor ? `-${round(component.factor)}%` : "",
                      )
                      .filter(Boolean)
                      .join(", ")}
                    )
                  </span>
                )}
              </div>
            );
          })}
        {(form.watch(`items.${index}.lots`) as MedicationBillLotItem[]).filter(
          (lot: MedicationBillLotItem) => lot.selectedInventoryId,
        ).length === 0 && <div className="text-sm py-1.5">-</div>}
      </TableCell>
      <TableCell className={tableCellClass}>
        {field.medication ? (
          <FormField
            control={form.control}
            name={`items.${index}.fully_dispensed`}
            render={({ field: formField }) => (
              <FormItem>
                <FormControl>
                  <Switch
                    className="data-[state=checked]:bg-primary-600"
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                    disabled={!isChecked}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className={cn(tableCellClass, "rounded-r-lg")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={!isChecked}>
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {field.medication?.dispense_status !==
            MedicationRequestDispenseStatus.partial ? (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="w-full">
                    <DropdownMenuItem disabled className="w-full">
                      {t("mark_as_already_given")}
                    </DropdownMenuItem>
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  {t("enabled_only_for_partially_dispensed")}
                </PopoverContent>
              </Popover>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  onMarkComplete(field.medication!, index);
                }}
              >
                {t("mark_as_already_given")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() => {
                onRemove(
                  field.medication,
                  displayProductKnowledge?.name ||
                    field.medication?.medication?.display ||
                    t("unknown_medication"),
                  index,
                  !field.medication,
                );
              }}
            >
              {t("remove_medication")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
