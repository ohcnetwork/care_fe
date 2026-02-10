import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import ComboboxQuantityInput from "@/components/Common/ComboboxQuantityInput";
import InstructionsPopover from "@/components/Medicine/InstructionsPopover";
import { MedicationTimingSelect } from "@/components/Medicine/MedicationTimingSelect";
import { formatDoseRange } from "@/components/Medicine/utils";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { Code } from "@/types/base/code/code";
import {
  DoseRange,
  MedicationRequestDosageInstruction,
  UCUM_TIME_UNITS,
} from "@/types/emr/medicationRequest/medicationRequest";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { isZero } from "@/Utils/decimal";

interface DosageDialogProps {
  dosageRange: DoseRange;
  onChange?: (
    value?: MedicationRequestDosageInstruction["dose_and_rate"],
  ) => void;
}

const DosageDialog: React.FC<DosageDialogProps> = ({
  dosageRange,
  onChange,
}) => {
  const { t } = useTranslation();

  const [localDoseRange, setLocalDoseRange] = useState<DoseRange>(dosageRange);

  return (
    <div className="flex flex-col gap-3">
      <div className="font-medium text-base">{t("taper_titrate_dosage")}</div>
      <div>
        <Label className="mb-1.5">{t("start_dose")}</Label>
        <ComboboxQuantityInput
          quantity={localDoseRange.low}
          onChange={(value) => {
            if (value) {
              setLocalDoseRange((prev) => ({
                ...prev,
                low: value,
                high: {
                  ...prev.high,
                  unit: value.unit,
                },
              }));
            }
          }}
        />
      </div>
      <div>
        <Label className="mb-1.5">{t("end_dose")}</Label>
        <ComboboxQuantityInput
          quantity={localDoseRange.high}
          onChange={(value) => {
            if (value) {
              setLocalDoseRange((prev) => ({
                ...prev,
                high: value,
                low: {
                  ...prev.low,
                  unit: value.unit,
                },
              }));
            }
          }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            onChange?.(undefined);
          }}
        >
          {t("clear")}
        </Button>
        <Button
          onClick={() => {
            onChange?.({
              type: "ordered",
              dose_range: localDoseRange,
            });
          }}
        >
          {t("save")}
        </Button>
      </div>
    </div>
  );
};

export interface AddMedicationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProduct?: ProductKnowledgeBase;
  onAdd: (
    product: ProductKnowledgeBase,
    dosageInstructions: MedicationRequestDosageInstruction[],
  ) => void;
  existingDosageInstructions?: MedicationRequestDosageInstruction;
  isEditing: boolean;
  onChange?: (dosageInstructions: MedicationRequestDosageInstruction[]) => void;
}

export const AddMedicationSheet = ({
  open,
  onOpenChange,
  selectedProduct,
  onAdd,
  existingDosageInstructions,
  isEditing,
  onChange,
}: AddMedicationSheetProps) => {
  const { t } = useTranslation();
  const [localDosageInstruction, setLocalDosageInstruction] =
    useState<MedicationRequestDosageInstruction>({
      dose_and_rate: undefined,
      timing: undefined,
      as_needed_boolean: false,
      route: undefined,
      site: undefined,
      method: undefined,
      additional_instruction: undefined,
      as_needed_for: undefined,
    });
  const [showDosageDialog, setShowDosageDialog] = useState(false);

  const isConsumable = selectedProduct?.product_type === "consumable";

  // Update local state when the sheet opens or when editing a different item
  useEffect(() => {
    if (open && existingDosageInstructions) {
      setLocalDosageInstruction(existingDosageInstructions);
    } else if (open) {
      resetForm();

      const updates: Partial<MedicationRequestDosageInstruction> = {};

      if (selectedProduct?.base_unit) {
        updates.dose_and_rate = {
          type: "ordered",
          dose_quantity: {
            value: "1",
            unit: selectedProduct.base_unit,
          },
        };
      }

      if (isConsumable) {
        updates.as_needed_boolean = true;
      }

      if (Object.keys(updates).length > 0) {
        handleUpdateDosageInstruction(updates);
      }
    } else {
      resetForm();
    }
  }, [open, existingDosageInstructions, selectedProduct]);

  const handleUpdateDosageInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => {
    setLocalDosageInstruction((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const resetForm = () => {
    setLocalDosageInstruction({
      dose_and_rate: undefined,
      timing: undefined,
      as_needed_boolean: false,
      route: undefined,
      site: undefined,
      method: undefined,
      additional_instruction: undefined,
      as_needed_for: undefined,
    });
    setShowDosageDialog(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSave = () => {
    if (isEditing) {
      onChange?.([localDosageInstruction]);
    } else {
      if (selectedProduct) {
        onAdd(selectedProduct, [localDosageInstruction]);
      }
    }
    onOpenChange(false);
    resetForm();
  };

  // Helper functions for additional instructions
  const currentInstructions =
    localDosageInstruction?.additional_instruction || [];

  const addInstruction = (instruction: Code) => {
    const currentInstructions =
      localDosageInstruction?.additional_instruction || [];
    if (!currentInstructions.some((inst) => inst.code === instruction.code)) {
      handleUpdateDosageInstruction({
        additional_instruction: [...currentInstructions, instruction],
      });
    }
  };

  const removeInstruction = (code: string) => {
    const currentInstructions =
      localDosageInstruction?.additional_instruction || [];
    handleUpdateDosageInstruction({
      additional_instruction: currentInstructions.filter(
        (inst) => inst.code !== code,
      ),
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] min-h-[50vh] px-4 pt-2 pb-0 rounded-t-lg pb-safe"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto bg-gray-300 mt-2" />
        <div className="mt-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 px-20">
            <SheetHeader>
              <SheetTitle>
                {isEditing
                  ? t("edit_dosage_instructions")
                  : t("add_medication")}
              </SheetTitle>
            </SheetHeader>
          </div>
          <div className="flex-1 px-0 md:px-20">
            <div className="space-y-6">
              {selectedProduct && (
                <>
                  <div>
                    <Label className="text-sm text-gray-500 mb-1.5 block">
                      {t("selected")} {t("product")}
                    </Label>
                    <div className="font-medium text-lg">
                      {selectedProduct.name}
                    </div>
                  </div>
                  <div className="space-y-4 pb-4">
                    {/* Dosage and Frequency Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Dosage */}
                      <div>
                        <Label className="mb-1.5 block text-sm">
                          {t("dosage")}
                          <span className="text-red-500 ml-0.5">*</span>
                        </Label>
                        <div>
                          {localDosageInstruction?.dose_and_rate?.dose_range ? (
                            <Input
                              readOnly
                              value={formatDoseRange(
                                localDosageInstruction.dose_and_rate.dose_range,
                              )}
                              onClick={() => setShowDosageDialog(true)}
                              className={cn("h-9 text-sm cursor-pointer mb-3")}
                            />
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <ComboboxQuantityInput
                                    quantity={
                                      localDosageInstruction?.dose_and_rate
                                        ?.dose_quantity
                                    }
                                    onChange={(value) => {
                                      if (value) {
                                        handleUpdateDosageInstruction({
                                          dose_and_rate: {
                                            type: "ordered",
                                            dose_quantity: value,
                                            dose_range: undefined,
                                          },
                                        });
                                      } else {
                                        handleUpdateDosageInstruction({
                                          dose_and_rate: undefined,
                                        });
                                      }
                                    }}
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-9 rounded-full hover:bg-transparent"
                                  onClick={() => setShowDosageDialog(true)}
                                >
                                  +
                                </Button>
                              </div>
                            </>
                          )}
                        </div>

                        {localDosageInstruction?.dose_and_rate?.dose_range && (
                          <Popover
                            open={showDosageDialog}
                            onOpenChange={setShowDosageDialog}
                          >
                            <PopoverTrigger asChild>
                              <div className="w-full" />
                            </PopoverTrigger>
                            <PopoverContent className="w-55 p-4" align="start">
                              <DosageDialog
                                dosageRange={
                                  localDosageInstruction.dose_and_rate
                                    .dose_range
                                }
                                onChange={(value) => {
                                  handleUpdateDosageInstruction({
                                    dose_and_rate: value,
                                  });
                                  setShowDosageDialog(false);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>

                      {/* Frequency */}
                      <div>
                        <Label className="mb-1.5 block text-sm">
                          {t("frequency")}
                          <span className="text-red-500 ml-0.5">*</span>
                        </Label>
                        <MedicationTimingSelect
                          timing={localDosageInstruction?.timing}
                          asNeeded={
                            isConsumable ||
                            localDosageInstruction?.as_needed_boolean
                          }
                          onTimingChange={(timing, asNeeded) => {
                            handleUpdateDosageInstruction({
                              as_needed_boolean: asNeeded,
                              timing,
                            });
                          }}
                          disabled={isConsumable}
                        />
                      </div>
                    </div>

                    {/* Duration and Method Row */}
                    <div
                      className={cn(
                        "grid gap-4",
                        isConsumable
                          ? "grid-cols-1"
                          : "grid-cols-1 md:grid-cols-2",
                      )}
                    >
                      {/* Duration - hidden for consumables */}
                      {!isConsumable && (
                        <div>
                          <Label className="mb-1.5 block text-sm">
                            {t("duration")}
                          </Label>
                          <div
                            className={cn(
                              "flex gap-2",
                              localDosageInstruction?.as_needed_boolean &&
                                "opacity-50 bg-gray-100 rounded-md",
                            )}
                          >
                            {localDosageInstruction?.timing && (
                              <Input
                                type="number"
                                min={0}
                                value={
                                  isZero(
                                    localDosageInstruction.timing.repeat
                                      .bounds_duration.value,
                                  )
                                    ? ""
                                    : localDosageInstruction.timing.repeat
                                        .bounds_duration?.value
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (!localDosageInstruction.timing) return;
                                  handleUpdateDosageInstruction({
                                    timing: {
                                      ...localDosageInstruction.timing,
                                      repeat: {
                                        ...localDosageInstruction.timing.repeat,
                                        bounds_duration: {
                                          value,
                                          unit: localDosageInstruction.timing
                                            .repeat.bounds_duration.unit,
                                        },
                                      },
                                    },
                                  });
                                }}
                                className="h-9 text-sm"
                              />
                            )}
                            <Select
                              value={
                                localDosageInstruction?.timing?.repeat
                                  ?.bounds_duration?.unit ?? UCUM_TIME_UNITS[0]
                              }
                              onValueChange={(
                                unit: (typeof UCUM_TIME_UNITS)[number],
                              ) => {
                                if (localDosageInstruction?.timing?.repeat) {
                                  const value =
                                    localDosageInstruction?.timing?.repeat
                                      ?.bounds_duration?.value ?? 0;
                                  handleUpdateDosageInstruction({
                                    timing: {
                                      ...localDosageInstruction.timing,
                                      repeat: {
                                        ...localDosageInstruction.timing.repeat,
                                        bounds_duration: { value, unit },
                                      },
                                    },
                                  });
                                }
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-9 text-sm w-full",
                                  localDosageInstruction?.as_needed_boolean &&
                                    "cursor-not-allowed bg-gray-50",
                                )}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {UCUM_TIME_UNITS.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* Method */}
                      <div>
                        <Label className="mb-1.5 block text-sm">
                          {t("method")}
                        </Label>
                        <ValueSetSelect
                          system="system-administration-method"
                          value={localDosageInstruction?.method}
                          onSelect={(method) => {
                            handleUpdateDosageInstruction({ method });
                          }}
                          placeholder={t("select_method")}
                          count={20}
                        />
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <Label className="mb-1.5 block text-sm">
                        {t("instructions")}
                      </Label>
                      {localDosageInstruction?.as_needed_boolean ? (
                        <div className="space-y-2">
                          <ValueSetSelect
                            system="system-as-needed-reason"
                            value={
                              localDosageInstruction?.as_needed_for || null
                            }
                            placeholder={t("select_prn_reason")}
                            onSelect={(value) => {
                              handleUpdateDosageInstruction({
                                as_needed_for: value || undefined,
                              });
                            }}
                          />

                          <InstructionsPopover
                            currentInstructions={currentInstructions}
                            removeInstruction={removeInstruction}
                            addInstruction={addInstruction}
                            isReadOnly={false}
                            disabled={false}
                          />
                        </div>
                      ) : (
                        <InstructionsPopover
                          currentInstructions={currentInstructions}
                          removeInstruction={removeInstruction}
                          addInstruction={addInstruction}
                          isReadOnly={false}
                          disabled={false}
                        />
                      )}
                    </div>

                    {/* Route and Site Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Route */}
                      <div>
                        <Label className="mb-1.5 block text-sm">
                          {t("route")}
                        </Label>
                        <ValueSetSelect
                          system="system-route"
                          value={localDosageInstruction?.route}
                          onSelect={(route) => {
                            handleUpdateDosageInstruction({ route });
                          }}
                          placeholder={t("select_route")}
                        />
                      </div>

                      {/* Site */}
                      <div>
                        <Label className="mb-1.5 block text-sm">
                          {t("site")}
                        </Label>
                        <ValueSetSelect
                          system="system-body-site"
                          value={localDosageInstruction?.site}
                          onSelect={(site) => {
                            handleUpdateDosageInstruction({ site });
                          }}
                          placeholder={t("select_site")}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="sticky bottom-0 py-4 bg-white border-t flex justify-end px-20">
            <Button
              className="mr-1"
              disabled={
                !selectedProduct ||
                !localDosageInstruction?.dose_and_rate ||
                (!localDosageInstruction.as_needed_boolean &&
                  !localDosageInstruction.timing)
              }
              onClick={handleSave}
            >
              {isEditing ? t("save") : t("add_medication")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
