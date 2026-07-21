import { RefreshCcwIcon } from "lucide-react";
import { useState } from "react";
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

import { computeMedicationDispenseQuantity } from "@/components/Medicine/utils";

import { InventoryItemsSelector } from "@/pages/Facility/services/inventory/InventoryItemsSelector";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { LotSelection } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";

import { Code } from "@/types/base/code/code";
import {
  buildTimingForTextDosage,
  getTimingBounds,
  MedicationRequestDosageInstruction,
  sumManSlots,
  timingBoundsToRepeat,
} from "@/types/emr/medicationRequest/medicationRequest";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";

import { isLessThanOrEqual, isPositive } from "@/Utils/decimal";
import { useInventoryItemsAutoSelect } from "@/pages/Facility/services/pharmacy/billMedications/utils/useInventoryItemsAutoSelect";

const EMPTY_INSTRUCTION: MedicationRequestDosageInstruction = {
  as_needed_boolean: true,
};

/**
 * The medication details collected by {@link AddMedicationRow}. The caller
 * decides what to do with them (create dispenses, append to a bill form, …).
 */
export interface AddMedicationValue {
  productKnowledge: ProductKnowledgeBase;
  dosageInstructions: MedicationRequestDosageInstruction[];
  note: string;
  lots: LotSelection[];
}

interface Props {
  facilityId: string;
  locationId: string;
  /**
   * Called when the user confirms the medication. Receives the picked
   * product, its dosage instructions, an optional note, and the selected
   * lots. May return a promise; the sheet closes once it resolves. Reject
   * (or throw) to keep the sheet open, e.g. when a save fails.
   */
  onSave: (value: AddMedicationValue) => void | Promise<void>;
  /** Whether an external save operation triggered by `onSave` is in progress. */
  isSaving?: boolean;
  /** Disables the save action, e.g. when a required context is missing. */
  disableSave?: boolean;
}

/**
 * Inline "add row" placeholder that lets the user add a medication with full
 * dosage instructions and lot selection. The medication picker sits directly
 * in the page; picking a medicine opens a sheet to specify full dosage
 * instructions (dose, frequency, duration, PRN reason, route, site, method,
 * additional instructions) and lots. Lots are auto-selected from the computed
 * dispense quantity while remaining fully adjustable. The collected values are
 * handed back to the caller via `onSave`, which owns what happens next.
 */
export function AddMedicationRow({
  facilityId,
  locationId,
  onSave,
  isSaving = false,
  disableSave = false,
}: Props) {
  const { t } = useTranslation();

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
    : null;

  const {
    autoSelectInventoryItems,
    isAutoSelectingInventoryItems,
    canAutoSelectInventoryItems,
  } = useInventoryItemsAutoSelect({
    facilityId,
    locationId,
    productKnowledge: productKnowledge || null,
    dosageInstructions: [instruction],
    autoSelectOnMount: open && !lots.some((lot) => !lot.autoSelected),
    onSelect: (autoSelectedLots) => {
      setLots(autoSelectedLots);
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

  const handleSave = async () => {
    if (!productKnowledge) return;
    if (!isDoseValid || !isFrequencyValid || !areLotsValid) return;

    try {
      await onSave({
        productKnowledge,
        dosageInstructions: [instruction],
        note,
        lots,
      });
      setOpen(false);
    } catch {
      // Errors are surfaced by the caller's save handler; keep the sheet open.
    }
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
              {t("add_medication_description")}
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
                    {canAutoSelectInventoryItems && (
                      <Button
                        variant="ghost"
                        size="xs"
                        type="button"
                        onClick={() => autoSelectInventoryItems()}
                        disabled={isSaving || isAutoSelectingInventoryItems}
                        title={t("auto_select_lots")}
                      >
                        <RefreshCcwIcon
                          className={cn(
                            "size-3.5 text-gray-500",
                            isAutoSelectingInventoryItems && "animate-spin",
                          )}
                        />
                      </Button>
                    )}
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
                          disabled={isSaving || isAutoSelectingInventoryItems}
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
                          disabled={isSaving || isAutoSelectingInventoryItems}
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
                      disabled={isSaving || isAutoSelectingInventoryItems}
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
                isAutoSelectingInventoryItems ||
                disableSave ||
                !productKnowledge ||
                !isDoseValid ||
                !isFrequencyValid ||
                !areLotsValid
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
