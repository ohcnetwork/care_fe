import { ArrowLeft } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import BackButton from "@/components/Common/BackButton";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Page from "@/components/Common/Page";
import { SubstitutionSheet } from "@/components/Medication/SubstitutionSheet";
import { PatientHeader } from "@/components/Patient/PatientHeader";

import NoActiveAccountWarningDialog from "@/pages/Facility/billing/account/components/NoActiveAccountWarningDialog";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { AddMedicationSheet } from "@/pages/Facility/services/pharmacy/components/AddMedicationSheet";
import { DispensedItemsSheet } from "@/pages/Facility/services/pharmacy/components/DispensedItemsSheet";
import { MedicationBillTable } from "@/pages/Facility/services/pharmacy/components/MedicationBillTable";
import { useMedicationBill } from "@/pages/Facility/services/pharmacy/hooks/useMedicationBill";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import {
  computeMedicationDispenseQuantity,
  MedicationRequestDispenseStatus,
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface Props {
  patientId: string;
}

export default function AllMedicationBillForm({ patientId }: Props) {
  useShortcutSubContext("facility:general");
  const { t } = useTranslation();

  // UI state for sheets and dialogs
  const [selectedProduct, setSelectedProduct] = useState<
    ProductKnowledgeBase | undefined
  >();
  const [isAddMedicationSheetOpen, setIsAddMedicationSheetOpen] =
    useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isSubstitutionSheetOpen, setIsSubstitutionSheetOpen] = useState(false);
  const [substitutingItemIndex, setSubstitutingItemIndex] = useState<
    number | null
  >(null);
  const [originalProductForSubstitution, setOriginalProductForSubstitution] =
    useState<ProductKnowledgeBase | undefined>();
  const [preSelectedSubstituteProduct, setPreSelectedSubstituteProduct] =
    useState<ProductKnowledgeBase | undefined>();
  const [originalMedicationName, setOriginalMedicationName] = useState<
    string | undefined
  >();
  const [viewingDispensedMedicationId, setViewingDispensedMedicationId] =
    useState<string | null>(null);
  const [medicationToMarkComplete, setMedicationToMarkComplete] = useState<{
    medication: MedicationRequestRead;
    index: number;
  } | null>(null);
  const [medicationToRemove, setMedicationToRemove] = useState<{
    medication: MedicationRequestRead;
    medicationName: string;
    index: number;
    isAdded: boolean;
  } | null>(null);

  // Use the unified hook (no prescriptionId = all medications)
  const {
    form,
    fields,
    append,
    remove,
    groupedMedications,
    productKnowledgeInventoriesMap,
    setProductKnowledgeInventoriesMap,
    patient,
    grandTotal,
    isLoading,
    isPending,
    isCreatingInvoice,
    prescriptionCompletionMap,
    setPrescriptionCompletionMap,
    handleDispense,
    handleRemoveMedication,
    calculatePrices,
    updateMedicationRequest,
    facilityId,
    locationId,
  } = useMedicationBill({
    patientId,
    // No prescriptionId = fetch all medications
    onDispenseSuccess: (dispenseOrderId) => {
      if (dispenseOrderId) {
        navigate(
          `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}`,
        );
      }
    },
  });

  return (
    <Page title={t("bill_medications")} hideTitleOnPage={true} isInsidePage>
      <NoActiveAccountWarningDialog
        patientId={patientId}
        facilityId={facilityId}
      />
      <div className="md:max-w-[88vw] mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold whitespace-nowrap">
            {t("bill_medications")}
          </h1>
          <div className="flex gap-2 justify-end">
            <BackButton data-shortcut-id="go-back">
              <ArrowLeft />
              {t("go_back")}
            </BackButton>
            <Button
              onClick={handleDispense}
              disabled={
                !form.watch("items").some((q) => q.isSelected) ||
                isPending ||
                isCreatingInvoice
              }
            >
              {isPending || isCreatingInvoice
                ? t("billing")
                : t("bill_selected")}
              <ShortcutBadge actionId="submit-action" />
            </Button>
          </div>
        </div>

        {/* Patient Header */}
        {patient && (
          <div className="mb-4 rounded-none shadow-none bg-gray-100">
            <PatientHeader patient={patient} facilityId={facilityId} />
          </div>
        )}

        {/* Medication Bill Table */}
        <MedicationBillTable
          form={form}
          fields={fields}
          groupedMedications={groupedMedications}
          productKnowledgeInventoriesMap={productKnowledgeInventoriesMap}
          prescriptionCompletionMap={prescriptionCompletionMap}
          setPrescriptionCompletionMap={setPrescriptionCompletionMap}
          grandTotal={grandTotal}
          isLoading={isLoading}
          onEditDosage={(idx, productKnowledge) => {
            setSelectedProduct(productKnowledge);
            setEditingItemIndex(idx);
            setIsAddMedicationSheetOpen(true);
          }}
          onSubstitute={(idx, productKnowledge, preSelectedProduct) => {
            setSubstitutingItemIndex(idx);
            setOriginalProductForSubstitution(productKnowledge);
            setPreSelectedSubstituteProduct(preSelectedProduct);
            // Get medication name for display when no product knowledge
            if (!productKnowledge) {
              const item = form.getValues(`items.${idx}`);
              setOriginalMedicationName(
                item.medication?.medication?.display || undefined,
              );
            } else {
              setOriginalMedicationName(undefined);
            }
            setIsSubstitutionSheetOpen(true);
          }}
          onViewDispensed={(medicationId) => {
            setViewingDispensedMedicationId(medicationId);
          }}
          onMarkComplete={(medication, idx) => {
            setMedicationToMarkComplete({ medication, index: idx });
          }}
          onRemove={(medication, effectiveProductName, idx, isAdded) => {
            setMedicationToRemove({
              medication: medication as MedicationRequestRead,
              medicationName: effectiveProductName,
              index: idx,
              isAdded,
            });
          }}
          calculatePrices={calculatePrices}
        />

        {/* Add Medication Row */}
        {!isLoading && (
          <div className="mt-2 bg-white rounded-lg shadow-sm">
            <ProductKnowledgeSelect
              value={undefined}
              onChange={(product) => {
                if (!product) return;

                const defaultDosageInstructions: MedicationRequestDosageInstruction[] =
                  [
                    {
                      dose_and_rate: product.base_unit
                        ? {
                            type: "ordered",
                            dose_quantity: {
                              value: "1",
                              unit: product.base_unit,
                            },
                          }
                        : undefined,
                      timing: undefined,
                      as_needed_boolean: true,
                      route: undefined,
                      site: undefined,
                      method: undefined,
                      additional_instruction: undefined,
                      as_needed_for: undefined,
                    },
                  ];

                append({
                  reference_id: crypto.randomUUID(),
                  productKnowledge: product,
                  isSelected: true,
                  fully_dispensed: true,
                  dosageInstructions: defaultDosageInstructions,
                  lots: [{ selectedInventoryId: "", quantity: "1" }],
                  prescriptionId: "no-prescription",
                });

                // Trigger inventory fetch for the new product
                setProductKnowledgeInventoriesMap((prev) => ({
                  [product.id]: undefined,
                  ...prev,
                }));
              }}
              placeholder={t("add_medication")}
              className="w-full"
            />
          </div>
        )}

        {/* Add/Edit Medication Sheet */}
        <AddMedicationSheet
          open={isAddMedicationSheetOpen}
          onOpenChange={(isOpen) => {
            setIsAddMedicationSheetOpen(isOpen);
            if (!isOpen) {
              setEditingItemIndex(null);
              setSelectedProduct(undefined);
            }
          }}
          selectedProduct={selectedProduct}
          existingDosageInstructions={
            editingItemIndex !== null
              ? form.watch(`items.${editingItemIndex}.dosageInstructions`)?.[0]
              : undefined
          }
          isEditing={editingItemIndex !== null}
          onChange={
            editingItemIndex !== null
              ? (dosageInstructions) => {
                  form.setValue(
                    `items.${editingItemIndex}.dosageInstructions`,
                    dosageInstructions,
                    { shouldDirty: true, shouldTouch: true },
                  );

                  if (dosageInstructions?.[0]) {
                    const medicationDataForQuantity =
                      form.getValues(`items.${editingItemIndex}.medication`) ||
                      ({
                        dosage_instruction: dosageInstructions,
                      } as MedicationRequestRead);
                    if (
                      form.getValues(`items.${editingItemIndex}.medication`)
                    ) {
                      medicationDataForQuantity.dosage_instruction =
                        dosageInstructions;
                    }

                    const newQuantity = computeMedicationDispenseQuantity(
                      medicationDataForQuantity,
                    );
                    const currentLots = form.getValues(
                      `items.${editingItemIndex}.lots`,
                    );
                    form.setValue(
                      `items.${editingItemIndex}.lots`,
                      currentLots.map((lot) => ({
                        ...lot,
                        quantity: newQuantity,
                      })),
                      { shouldDirty: true, shouldTouch: true },
                    );
                  }
                  setEditingItemIndex(null);
                }
              : undefined
          }
          onAdd={(product, dosageInstructions) => {
            const newQuantity = computeMedicationDispenseQuantity({
              dosage_instruction: dosageInstructions,
            } as MedicationRequestRead);

            append({
              reference_id: crypto.randomUUID(),
              productKnowledge: product,
              isSelected: true,
              fully_dispensed: true,
              dosageInstructions,
              lots: [{ selectedInventoryId: "", quantity: newQuantity }],
              prescriptionId: "no-prescription",
            });

            setProductKnowledgeInventoriesMap((prev) => ({
              [product.id]: undefined,
              ...prev,
            }));
            setSelectedProduct(undefined);
          }}
        />

        {/* Substitution Sheet */}
        <SubstitutionSheet
          open={isSubstitutionSheetOpen}
          onOpenChange={(open) => {
            setIsSubstitutionSheetOpen(open);
            if (!open) {
              setSubstitutingItemIndex(null);
              setOriginalProductForSubstitution(undefined);
              setPreSelectedSubstituteProduct(undefined);
              setOriginalMedicationName(undefined);
            }
          }}
          originalProductKnowledge={originalProductForSubstitution}
          originalMedicationName={originalMedicationName}
          preSelectedProduct={preSelectedSubstituteProduct}
          currentSubstitution={
            substitutingItemIndex !== null
              ? form.watch(`items.${substitutingItemIndex}.substitution`)
              : undefined
          }
          facilityId={facilityId}
          onSave={(substitutionDetails) => {
            if (substitutingItemIndex === null) return;

            if (substitutionDetails) {
              form.setValue(
                `items.${substitutingItemIndex}.substitution`,
                substitutionDetails,
                { shouldDirty: true, shouldTouch: true },
              );
              form.setValue(
                `items.${substitutingItemIndex}.lots`,
                [{ selectedInventoryId: "", quantity: "0" }],
                { shouldDirty: true, shouldTouch: true },
              );
              setProductKnowledgeInventoriesMap((prev) => ({
                ...prev,
                [substitutionDetails.substitutedProductKnowledge.id]:
                  prev[substitutionDetails.substitutedProductKnowledge.id] ||
                  undefined,
              }));
            } else {
              form.setValue(
                `items.${substitutingItemIndex}.substitution`,
                undefined,
                { shouldDirty: true, shouldTouch: true },
              );
              const originalItem = form.getValues(
                `items.${substitutingItemIndex}`,
              );
              const originalMedication = originalItem.medication as
                | MedicationRequestRead
                | undefined;
              const initialQuantity = originalMedication
                ? computeMedicationDispenseQuantity(originalMedication)
                : "0";
              form.setValue(
                `items.${substitutingItemIndex}.lots`,
                [{ selectedInventoryId: "", quantity: initialQuantity }],
                { shouldDirty: true, shouldTouch: true },
              );
            }
            setSubstitutingItemIndex(null);
            setOriginalProductForSubstitution(undefined);
            setPreSelectedSubstituteProduct(undefined);
            setOriginalMedicationName(undefined);
            setIsSubstitutionSheetOpen(false);
          }}
        />

        {/* Dispensed Items Sheet */}
        {viewingDispensedMedicationId && (
          <DispensedItemsSheet
            open={!!viewingDispensedMedicationId}
            onOpenChange={(open) => {
              if (!open) setViewingDispensedMedicationId(null);
            }}
            medicationRequestId={viewingDispensedMedicationId}
          />
        )}

        {/* Mark Complete Dialog */}
        <ConfirmActionDialog
          open={medicationToMarkComplete !== null}
          onOpenChange={(open) => {
            if (!open) setMedicationToMarkComplete(null);
          }}
          title={t("mark_as_already_given")}
          description={
            <>
              <Trans
                i18nKey="confirm_action_description"
                values={{ action: t("mark_as_already_given").toLowerCase() }}
                components={{ 1: <strong className="text-gray-900" /> }}
              />{" "}
              {t("you_cannot_change_once_submitted")}
              <p className="mt-2">
                {t("medication")}:{" "}
                <strong>
                  {
                    medicationToMarkComplete?.medication?.requested_product
                      ?.name
                  }
                </strong>
              </p>
            </>
          }
          onConfirm={() => {
            if (medicationToMarkComplete) {
              updateMedicationRequest(
                {
                  ...medicationToMarkComplete.medication,
                  dispense_status: MedicationRequestDispenseStatus.complete,
                },
                {
                  onSuccess: () => {
                    remove(medicationToMarkComplete.index);
                  },
                },
              );
            }
            setMedicationToMarkComplete(null);
          }}
          confirmText={t("mark_as_already_given")}
        />

        {/* Remove Medication Dialog */}
        <ConfirmActionDialog
          open={medicationToRemove !== null}
          onOpenChange={(open) => {
            if (!open) setMedicationToRemove(null);
          }}
          title={t("remove_medication")}
          description={
            <>
              <Trans
                i18nKey="confirm_action_description"
                values={{ action: t("remove_medication").toLowerCase() }}
                components={{ 1: <strong className="text-gray-900" /> }}
              />{" "}
              {t("you_cannot_change_once_submitted")}
              <p className="mt-2">
                {t("medication")}:{" "}
                <strong>{medicationToRemove?.medicationName}</strong>
              </p>
            </>
          }
          onConfirm={() => {
            if (medicationToRemove) {
              handleRemoveMedication(
                medicationToRemove.medication,
                medicationToRemove.isAdded,
                medicationToRemove.index,
              );
            }
            setMedicationToRemove(null);
          }}
          confirmText={t("remove_medication")}
          variant="destructive"
        />
      </div>
    </Page>
  );
}
