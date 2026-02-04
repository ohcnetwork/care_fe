import { formatDate } from "date-fns";
import { Pill } from "lucide-react";
import React, { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { MedicationBillRow } from "@/pages/Facility/services/pharmacy/components/MedicationBillRow";
import { GroupedPrescription } from "@/pages/Facility/services/pharmacy/hooks/useMedicationBill";
import {
  MedicationBillField,
  MedicationBillFormItem,
  MedicationBillFormValues,
} from "@/pages/Facility/services/pharmacy/types";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import { InventoryRead } from "@/types/inventory/product/inventory";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";

const TABLE_HEADER_CLASS =
  "px-4 py-3 border-r font-medium border-y-1 border-r-0 border-gray-200 rounded-b-none border-b-0";
const TABLE_CELL_CLASS = "px-2 py-2 border-r";

export interface MedicationBillTableProps {
  form: UseFormReturn<MedicationBillFormValues>;
  fields: MedicationBillField[];
  groupedMedications: GroupedPrescription;
  productKnowledgeInventoriesMap: Record<string, InventoryRead[] | undefined>;
  prescriptionCompletionMap: Record<string, boolean>;
  setPrescriptionCompletionMap: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  grandTotal: string;
  isLoading: boolean;

  // Single prescription mode (optional)
  prescription?: PrescriptionRead;

  // Callbacks
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

export function MedicationBillTable({
  form,
  fields,
  groupedMedications,
  productKnowledgeInventoriesMap,
  prescriptionCompletionMap,
  setPrescriptionCompletionMap,
  grandTotal,
  isLoading,
  prescription,
  onEditDosage,
  onSubstitute,
  onViewDispensed,
  onMarkComplete,
  onRemove,
  calculatePrices,
}: MedicationBillTableProps) {
  const { t } = useTranslation();

  const prescriptionGroups = useMemo(() => {
    const groupedFields: Record<
      string,
      { field: MedicationBillField; index: number }[]
    > = {};

    fields.forEach((field, index) => {
      const group = field.prescriptionId || "no-prescription";
      if (!groupedFields[group]) groupedFields[group] = [];
      groupedFields[group].push({ field, index });
    });

    return Object.entries(groupedFields)
      .map(([prescriptionId, groupFields]) => {
        const groupData = groupedMedications[prescriptionId];
        const prescriptionData = groupData?.prescription || prescription;

        let label: string;
        let date: Date | null = null;
        if (prescriptionId === "no-prescription") {
          label = t("no_prescription");
        } else if (prescriptionData?.created_date) {
          date = new Date(prescriptionData.created_date);
          label = `${t("prescription")} - ${formatDate(date, "dd/MM/yyyy")}`;
        } else {
          label = `${t("prescription")} - ${prescriptionId}`;
        }

        return {
          key: prescriptionId,
          label,
          fields: groupFields,
          date,
          prescription: prescriptionData,
        };
      })
      .sort((a, b) => {
        if (a.key === "no-prescription") return 1;
        if (b.key === "no-prescription") return -1;
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.getTime() - a.date.getTime();
      });
  }, [fields, groupedMedications, prescription, t]);

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Table className="w-full border-separate border-spacing-y-2 px-1">
          <TableHeader>
            <TableRow className="bg-white rounded-lg shadow-sm rounded-b-none">
              <TableHead
                className={cn(
                  "w-12",
                  TABLE_HEADER_CLASS,
                  "rounded-l-lg border-y border-l border-gray-200 rounded-b-none border-b-0",
                )}
              >
                <FormField
                  control={form.control}
                  name="items"
                  render={() => (
                    <FormItem className="mr-1.5">
                      <FormControl>
                        <Checkbox
                          checked={
                            form.watch("items").length > 0 &&
                            form.watch("items").every((q) => q.isSelected)
                          }
                          onCheckedChange={(checked) => {
                            const items = form.getValues("items");
                            items.forEach((_, index) => {
                              form.setValue(
                                `items.${index}.isSelected`,
                                !!checked,
                              );
                            });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TableHead>
              <TableHead
                className={cn(
                  TABLE_HEADER_CLASS,
                  "border-y border-r-0 border-gray-200 rounded-b-none border-b-0",
                )}
              >
                {t("medicine")}
              </TableHead>
              <TableHead className={TABLE_HEADER_CLASS}>
                {t("select_lot")}
              </TableHead>
              <TableHead className={TABLE_HEADER_CLASS}>
                {t("quantity")}
              </TableHead>
              <TableHead className={TABLE_HEADER_CLASS}>{t("price")}</TableHead>
              <TableHead className={TABLE_HEADER_CLASS}>
                {t("all_given")}?
              </TableHead>
              <TableHead className={cn(TABLE_HEADER_CLASS, "rounded-r-lg")}>
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptionGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={<Pill className="text-primary size-6" />}
                    title={t("no_medications")}
                    description={t("add_medications_to_bill_description")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              prescriptionGroups.map(
                ({ key, label, fields: medicationFields }) => {
                  if (!medicationFields || medicationFields.length === 0)
                    return null;

                  return (
                    <React.Fragment key={key}>
                      {/* Group Header Row */}
                      <TableRow className="bg-gray-50">
                        <TableCell
                          colSpan={7}
                          className="py-2 px-4 font-semibold text-gray-800 border-b"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span>
                                {label} ({medicationFields.length}{" "}
                                {t("medications")})
                              </span>
                            </div>
                            {key !== "no-prescription" && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    prescriptionCompletionMap[key] ?? true
                                  }
                                  onCheckedChange={(checked) => {
                                    setPrescriptionCompletionMap((prev) => ({
                                      ...prev,
                                      [key]: !!checked,
                                    }));
                                  }}
                                />
                                <span className="text-sm text-gray-600">
                                  {t("mark_complete")}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Group Items */}
                      {medicationFields.map(({ field, index }) => (
                        <MedicationBillRow
                          key={field.reference_id}
                          index={index}
                          field={field as MedicationBillFormItem}
                          form={form}
                          productKnowledgeInventoriesMap={
                            productKnowledgeInventoriesMap
                          }
                          tableCellClass={TABLE_CELL_CLASS}
                          onEditDosage={onEditDosage}
                          onSubstitute={onSubstitute}
                          onViewDispensed={onViewDispensed}
                          onMarkComplete={onMarkComplete}
                          onRemove={onRemove}
                          calculatePrices={calculatePrices}
                        />
                      ))}
                    </React.Fragment>
                  );
                },
              )
            )}
            {/* Grand Total Row */}
            {prescriptionGroups.length > 0 && (
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold">
                <TableCell
                  colSpan={4}
                  className="text-right text-base py-4 pr-4"
                >
                  {t("total")}:
                </TableCell>
                <TableCell colSpan={3} className="text-left text-lg py-4">
                  <MonetaryDisplay amount={grandTotal} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </form>
    </Form>
  );
}
