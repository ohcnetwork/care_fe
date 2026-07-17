import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ComboboxQuantityInput } from "@/components/Common/ComboboxQuantityInput";
import { DosageFrequencyInput } from "@/components/Medicine/DosageFrequencyInput";
import { DurationInput } from "@/components/Medicine/DurationInput";
import InstructionsPopover from "@/components/Medicine/InstructionsPopover";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { cn } from "@/lib/utils";

import { InventoryItemsSelector } from "@/pages/Facility/services/inventory/InventoryItemsSelector";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { LotSelection } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { selectEligibleInventoryItems } from "@/pages/Facility/services/pharmacy/billMedications/utils/itemsAutoSelect";

import { Code } from "@/types/base/code/code";
import {
  ChargeItemBatchResponse,
  extractChargeItemsFromBatchResponse,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  MedicationDispenseCreate,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import {
  buildTimingForTextDosage,
  computeMedicationDispenseQuantity,
  getTimingBounds,
  MedicationCategory,
  MedicationRequestDosageInstruction,
  sumManSlots,
  timingBoundsToRepeat,
} from "@/types/emr/medicationRequest/medicationRequest";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";

import { decimal, isLessThanOrEqual, isPositive } from "@/Utils/decimal";
import { isLotAllowedForDispensing } from "@/Utils/inventory";
import { useBatchRequest } from "@/Utils/request/batch";
import mutate from "@/Utils/request/mutate";
import { PaginatedResponse } from "@/Utils/request/types";

const EMPTY_INSTRUCTION: MedicationRequestDosageInstruction = {
  as_needed_boolean: false,
};

interface Props {
  facilityId: string;
  locationId: string;
  dispenseOrderId: string;
  /**
   * Encounter to attach the created dispenses to. Added medications have no
   * authorizing request, so the encounter must be supplied by the caller
   * (derived from the order's existing dispenses).
   */
  encounterId?: string;
  /**
   * When set, charge items of the created dispenses are appended to this
   * draft invoice. When unset, the charge items stay unbilled and the user
   * can create an invoice manually.
   */
  draftInvoiceId?: string;
}

/**
 * Inline "add row" placeholder for an open dispense order. The medication
 * picker sits directly in the page; picking a medicine opens a sheet to
 * specify full dosage instructions (dose, frequency, duration, PRN reason,
 * route, site, method, additional instructions) and lots. Lots are
 * auto-selected from the computed dispense quantity while remaining fully
 * adjustable. Each selected lot creates one dispense attached to the same
 * dispense order, and the resulting charge items are appended to the given
 * draft invoice, if any.
 */
export function AddDispenseMedicationRow({
  facilityId,
  locationId,
  dispenseOrderId,
  encounterId,
  draftInvoiceId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [productKnowledge, setProductKnowledge] = useState<
    ProductKnowledgeBase | undefined
  >(undefined);
  const [instruction, setInstruction] =
    useState<MedicationRequestDosageInstruction>(EMPTY_INSTRUCTION);
  const [note, setNote] = useState("");
  const [lots, setLots] = useState<LotSelection[]>([]);

  const updateInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => setInstruction((prev) => ({ ...prev, ...updates }));

  const requiredQuantity = productKnowledge
    ? computeMedicationDispenseQuantity([instruction])
    : "1";

  const { mutate: autoSelectLots, isPending: isAutoSelecting } = useMutation({
    mutationFn: mutate(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        product_knowledge: productKnowledge?.id || "",
        status: "active",
        limit: 100,
        net_content_gt: 0,
      },
    }),
    onSuccess: (data: PaginatedResponse<InventoryRead>) => {
      setLots(
        selectEligibleInventoryItems(data.results, {
          quantity: decimal(requiredQuantity),
          canSelect: isLotAllowedForDispensing,
        }),
      );
    },
  });

  // Auto-select lots whenever enough information is present (product picked)
  // and the required quantity changes — unless the user has adjusted lots
  // manually, in which case their selection is left untouched.
  useEffect(() => {
    if (!open || !productKnowledge) return;
    if (lots.some((lot) => !lot.autoSelected)) return;
    autoSelectLots(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productKnowledge?.id, requiredQuantity]);

  const { mutateAsync: attachItemsToInvoice } = useMutation({
    mutationFn: mutate(chargeItemApi.addChargeItemsToInvoice, {
      pathParams: { facilityId, invoiceId: draftInvoiceId ?? "" },
    }),
  });

  /**
   * Attaches the newly created charge items to the draft invoice. The
   * existing charge items and invoice metadata are preserved server-side.
   */
  const addChargeItemsToDraftInvoice = async (chargeItemIds: string[]) => {
    if (!draftInvoiceId || chargeItemIds.length === 0) return;

    await attachItemsToInvoice({ charge_items: chargeItemIds });
  };

  const { mutate: saveMedication, isPending: isSaving } = useBatchRequest({
    onSuccess: async (response) => {
      const chargeItems = extractChargeItemsFromBatchResponse(
        response as ChargeItemBatchResponse,
      );
      await addChargeItemsToDraftInvoice(chargeItems.map((item) => item.id));

      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
      queryClient.invalidateQueries({ queryKey: ["dispenseOrder"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      toast.success(t("medication_added_successfully"));
      setOpen(false);
    },
  });

  const handleSelectMedication = (pk: ProductKnowledgeBase | undefined) => {
    if (!pk) return;
    setProductKnowledge(pk);
    setInstruction({
      ...EMPTY_INSTRUCTION,
      dose_and_rate: pk.base_unit
        ? {
            type: "ordered",
            dose_quantity: { value: "1", unit: pk.base_unit },
          }
        : undefined,
    });
    setNote("");
    setLots([]);
    setOpen(true);
  };

  const isDoseValid = (() => {
    const doseQuantity = instruction.dose_and_rate?.dose_quantity;
    const doseRange = instruction.dose_and_rate?.dose_range;
    if (doseQuantity?.value != null) return isPositive(doseQuantity.value);
    if (doseRange) {
      return (
        isPositive(doseRange.low?.value ?? "0") &&
        isPositive(doseRange.high?.value ?? "0")
      );
    }
    return false;
  })();

  const isFrequencyValid = !!(
    instruction.as_needed_boolean ||
    instruction.text ||
    instruction.timing?.code
  );

  const isLotValid = (lot: LotSelection) =>
    isPositive(lot.quantity || "0") &&
    isLessThanOrEqual(lot.quantity, lot.item.net_content);

  const areLotsValid = lots.length > 0 && lots.every(isLotValid);

  const handleSave = () => {
    if (!productKnowledge || !encounterId) return;
    if (!isDoseValid || !isFrequencyValid || !areLotsValid) return;

    const whenPrepared = new Date();

    saveMedication(
      lots.map((lot) => ({
        api: medicationDispenseApi.create,
        referenceId: `add_medication_lot_${lot.item.id}`,
        body: {
          status: MedicationDispenseStatus.preparation,
          category: MedicationCategory.outpatient,
          when_prepared: whenPrepared,
          note: note || undefined,
          dosage_instruction: [instruction],
          encounter: encounterId,
          location: locationId,
          authorizing_request: null,
          item: lot.item.id,
          quantity: lot.quantity,
          fully_dispensed: true,
          order: dispenseOrderId,
        } satisfies MedicationDispenseCreate,
      })),
    );
  };

  const additionalInstructions: Code[] =
    instruction.additional_instruction ?? [];

  const addAdditionalInstruction = (code: Code) => {
    if (additionalInstructions.some((item) => item.code === code.code)) {
      toast.warning(`${code.display} ${t("is_already_selected")}`);
      return;
    }
    updateInstruction({
      additional_instruction: [...additionalInstructions, code],
    });
  };

  const removeAdditionalInstruction = (code: string) => {
    updateInstruction({
      additional_instruction: additionalInstructions.filter(
        (item) => item.code !== code,
      ),
    });
  };

  const baseUnitLabel = productKnowledge?.base_unit?.display || t("units");

  return (
    <>
      {/* Inline "add row" placeholder */}
      <div className="rounded-md border-t border-dashed border-gray-300 -mx-2 pt-4 px-2 transition-colors">
        <ProductKnowledgeSelect
          value={undefined}
          onChange={handleSelectMedication}
          placeholder={t("add_medication")}
          className="w-full"
          hideClearButton
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("add_medication")}</SheetTitle>
            <SheetDescription>
              {t("add_medication_to_dispense_order_description")}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 py-4">
            {/* Medicine */}
            <div className="flex flex-col gap-2">
              <Label>{t("medicine")}</Label>
              <ProductKnowledgeSelect
                value={productKnowledge}
                onChange={(pk) => {
                  if (!pk) return;
                  handleSelectMedication(pk);
                }}
                className="w-full"
                disabled={isSaving}
                hideClearButton
              />
            </div>

            {productKnowledge && (
              <>
                {/* Dosage instruction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>
                      {t("dosage")}
                      <span className="text-red-500">*</span>
                    </Label>
                    <ComboboxQuantityInput
                      quantity={instruction.dose_and_rate?.dose_quantity}
                      onChange={(value) => {
                        updateInstruction({
                          dose_and_rate: value
                            ? {
                                type: "ordered",
                                dose_quantity: value,
                                dose_range: undefined,
                              }
                            : undefined,
                        });
                      }}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>
                      {t("frequency")}
                      <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <DosageFrequencyInput
                      dosageInstruction={instruction}
                      onDosageInstructionChange={updateInstruction}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("duration")}</Label>
                    <DurationInput
                      value={getTimingBounds(instruction.timing?.repeat)}
                      onChange={(bounds) => {
                        if (instruction.timing) {
                          updateInstruction({
                            timing: {
                              ...instruction.timing,
                              repeat: {
                                ...instruction.timing.repeat,
                                ...timingBoundsToRepeat(bounds),
                              },
                            },
                          });
                        } else if (
                          instruction.text &&
                          sumManSlots(instruction.text) !== null
                        ) {
                          // Text M-A-N dosage: keep the frequency derived
                          // from the pattern (e.g. 1-0-1), then apply the
                          // chosen duration / range / period.
                          const base = buildTimingForTextDosage(
                            instruction.text,
                            { value: "0", unit: "d" },
                          );
                          updateInstruction({
                            timing: {
                              ...base,
                              repeat: {
                                ...base.repeat,
                                ...timingBoundsToRepeat(bounds),
                              },
                            },
                          });
                        } else {
                          updateInstruction({
                            timing: {
                              repeat: {
                                frequency: 1,
                                period: "1",
                                period_unit: "d",
                                ...timingBoundsToRepeat(bounds),
                              },
                            },
                          });
                        }
                      }}
                      disabled={isSaving || instruction.as_needed_boolean}
                    />
                  </div>
                  {instruction.as_needed_boolean && (
                    <div className="flex flex-col gap-2">
                      <Label>{t("select_prn_reason")}</Label>
                      <ValueSetSelect
                        system="system-as-needed-reason"
                        value={instruction.as_needed_for || null}
                        placeholder={t("select_prn_reason")}
                        onSelect={(value) =>
                          updateInstruction({
                            as_needed_for: value || undefined,
                          })
                        }
                        disabled={isSaving}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label>{t("route")}</Label>
                    <ValueSetSelect
                      system="system-route"
                      value={instruction.route}
                      onSelect={(route) => updateInstruction({ route })}
                      placeholder={t("select_route")}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("site")}</Label>
                    <ValueSetSelect
                      system="system-body-site"
                      value={instruction.site}
                      onSelect={(site) => updateInstruction({ site })}
                      placeholder={t("select_site")}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("method")}</Label>
                    <ValueSetSelect
                      system="system-administration-method"
                      value={instruction.method}
                      onSelect={(method) => updateInstruction({ method })}
                      placeholder={t("select_method")}
                      disabled={isSaving}
                      count={20}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("instructions")}</Label>
                    <InstructionsPopover
                      currentInstructions={additionalInstructions}
                      addInstruction={addAdditionalInstruction}
                      removeInstruction={removeAdditionalInstruction}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-medication-note">{t("note")}</Label>
                  <Input
                    id="add-medication-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("additional_notes")}
                    disabled={isSaving}
                  />
                </div>

                <span className="text-xs text-gray-600">
                  {t("required_quantity")}:{" "}
                  <span className="font-medium text-gray-900">
                    {requiredQuantity} {baseUnitLabel}
                  </span>
                </span>

                {/* Lots */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("select_lot")}</Label>
                    <Button
                      variant="ghost"
                      size="xs"
                      type="button"
                      onClick={() => autoSelectLots(undefined)}
                      disabled={isSaving || isAutoSelecting}
                      title={t("auto_select_lots")}
                    >
                      <RefreshCcwIcon
                        className={cn(
                          "size-3.5 text-gray-500",
                          isAutoSelecting && "animate-spin",
                        )}
                      />
                    </Button>
                  </div>

                  {lots.map((lot, index) => (
                    <div key={lot.item.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <InventoryItemsSelector
                          facilityId={facilityId}
                          locationId={locationId}
                          productKnowledgeId={productKnowledge.id}
                          showOnlyAvailable
                          value={lot}
                          selected={lots}
                          onChange={setLots}
                          disabled={isSaving || isAutoSelecting}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={lot.item.net_content}
                          value={lot.quantity}
                          onChange={(e) =>
                            setLots(
                              lots.map((l, i) =>
                                i === index
                                  ? {
                                      ...l,
                                      quantity: e.target.value,
                                      autoSelected: false,
                                    }
                                  : l,
                              ),
                            )
                          }
                          className="w-24"
                          placeholder="0"
                          disabled={isSaving || isAutoSelecting}
                        />
                      </div>
                      {!isLotValid(lot) && (
                        <span className="text-sm text-red-600">
                          {isPositive(lot.quantity || "0")
                            ? t("insufficient_stock")
                            : t("quantity_must_be_greater_than_zero")}
                        </span>
                      )}
                    </div>
                  ))}

                  {lots.length === 0 && (
                    <InventoryItemsSelector
                      facilityId={facilityId}
                      locationId={locationId}
                      productKnowledgeId={productKnowledge.id}
                      showOnlyAvailable
                      selected={lots}
                      onChange={setLots}
                      disabled={isSaving || isAutoSelecting}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isSaving ||
                isAutoSelecting ||
                !productKnowledge ||
                !isDoseValid ||
                !isFrequencyValid ||
                !areLotsValid ||
                !encounterId
              }
            >
              {t("add_medication")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
