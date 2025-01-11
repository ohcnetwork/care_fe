import { MinusCircledIcon } from "@radix-ui/react-icons";
import { t } from "i18next";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { QuantityInput } from "@/components/Common/QuantityInput";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { useIsMobile } from "@/hooks/use-mobile";

import {
  BOUNDS_DURATION_UNITS,
  BoundsDuration,
  DOSAGE_UNITS,
  MEDICATION_REQUEST_INTENT,
  MedicationRequest,
  MedicationRequestDosageInstruction,
  MedicationRequestIntent,
} from "@/types/emr/medicationRequest";
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";

interface MedicationRequestQuestionProps {
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

const MEDICATION_REQUEST_INITIAL_VALUE: MedicationRequest = {
  status: "active",
  intent: "order",
  category: "inpatient",
  priority: "urgent",
  do_not_perform: false,
  medication: undefined,
  authored_on: new Date().toISOString(),
  dosage_instruction: [],
};

export function MedicationRequestQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: MedicationRequestQuestionProps) {
  const medications =
    (questionnaireResponse.values?.[0]?.value as MedicationRequest[]) || [];
  const [expandedMedicationIndex, setExpandedMedicationIndex] = useState<
    number | null
  >(null);
  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(
    null,
  );
  const isMobile = useIsMobile();

  const handleAddMedication = (medication: Code) => {
    const newMedications: MedicationRequest[] = [
      ...medications,
      {
        ...MEDICATION_REQUEST_INITIAL_VALUE,
        medication,
        dosage_instruction: [],
      },
    ];
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "medication_request",
          value: newMedications,
        },
      ],
    });
    setExpandedMedicationIndex(newMedications.length - 1);
  };

  const handleRemoveMedication = (index: number) => {
    setMedicationToDelete(index);
  };

  const confirmRemoveMedication = () => {
    if (medicationToDelete === null) return;

    const newMedications = medications.filter(
      (_, i) => i !== medicationToDelete,
    );
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "medication_request", value: newMedications }],
    });
    setMedicationToDelete(null);
  };

  const handleUpdateMedication = (
    index: number,
    updates: Partial<MedicationRequest>,
  ) => {
    const newMedications = medications.map((medication, i) =>
      i === index ? { ...medication, ...updates } : medication,
    );

    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "medication_request",
          value: newMedications,
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <AlertDialog
        open={medicationToDelete !== null}
        onOpenChange={(open) => !open && setMedicationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("remove_medication")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove_medication_confirmation", {
                medication:
                  medications[medicationToDelete!]?.medication?.display,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMedication}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="md:overflow-x-auto w-auto">
        {medications.length > 0 && (
          <div className="min-w-fit">
            <div
              className={cn("max-w-[2144px] relative lg:border rounded-md", {
                "bg-gray-50/50": isMobile,
              })}
            >
              {/* Header - Only show on desktop */}
              <div className="hidden lg:grid grid-cols-[280px,180px,170px,160px,300px,230px,180px,250px,180px,160px,48px] bg-gray-50 border-b text-sm font-medium text-gray-500">
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("medicine")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("dosage")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("frequency")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("duration")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("instructions")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("additional_instructions")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("route")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("site")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("method")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("intent")}
                </div>
                <div className="font-semibold text-gray-600 p-3 sticky right-0 bg-gray-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12" />
              </div>

              {/* Body */}
              <div className={cn("bg-white", { "bg-transparent": isMobile })}>
                {medications.map((medication, index) => (
                  <React.Fragment key={index}>
                    {isMobile ? (
                      <Collapsible
                        open={expandedMedicationIndex === index}
                        onOpenChange={() => {
                          setExpandedMedicationIndex(
                            expandedMedicationIndex === index ? null : index,
                          );
                        }}
                        className="border-b last:border-b-0"
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2 px-2 py-0.5 rounded-md  shadow-sm text-sm",
                            expandedMedicationIndex === index
                              ? "bg-white"
                              : "bg-gray-100",
                          )}
                        >
                          <CollapsibleTrigger className="flex-1 text-left">
                            <div className="font-medium text-gray-900">
                              {medication.medication?.display}
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-1">
                            {expandedMedicationIndex !== index && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMedicationIndex(index);
                                }}
                                disabled={disabled}
                              >
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 15 15"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                >
                                  <path
                                    d="M12.1464 1.14645C12.3417 0.951184 12.6583 0.951184 12.8535 1.14645L14.8535 3.14645C15.0488 3.34171 15.0488 3.65829 14.8535 3.85355L10.9109 7.79618C10.8349 7.87218 10.7471 7.93543 10.651 7.9835L6.72359 9.94721C6.53109 10.0435 6.29861 10.0057 6.14643 9.85355C5.99425 9.70137 5.95652 9.46889 6.05277 9.27639L8.01648 5.34897C8.06455 5.25283 8.1278 5.16507 8.2038 5.08907L12.1464 1.14645ZM12.5 2.20711L8.91091 5.79618L7.87266 7.87267L8.12731 8.12732L10.2038 7.08907L13.7929 3.5L12.5 2.20711ZM9.99998 2L8.99998 3H4.9C4.47171 3 4.18056 3.00039 3.95552 3.01877C3.73631 3.03668 3.62421 3.06915 3.54601 3.10899C3.35785 3.20487 3.20487 3.35785 3.10899 3.54601C3.06915 3.62421 3.03669 3.73631 3.01878 3.95552C3.00039 4.18056 3 4.47171 3 4.9V11.1C3 11.5283 3.00039 11.8194 3.01878 12.0445C3.03669 12.2637 3.06915 12.3758 3.10899 12.454C3.20487 12.6422 3.35785 12.7951 3.54601 12.891C3.62421 12.9309 3.73631 12.9633 3.95552 12.9812C4.18056 12.9996 4.47171 13 4.9 13H11.1C11.5283 13 11.8194 12.9996 12.0445 12.9812C12.2637 12.9633 12.3758 12.9309 12.454 12.891C12.6422 12.7951 12.7951 12.6422 12.891 12.454C12.9309 12.3758 12.9633 12.2637 12.9812 12.0445C12.9996 11.8194 13 11.5283 13 11.1V7.00002L12 8.00002V11.1V11.1207C12 11.5231 11.9995 11.7666 11.9862 11.9402C11.9735 12.1033 11.9514 12.1558 11.9397 12.1775C11.9092 12.2321 11.8321 12.3092 11.7775 12.3397C11.7557 12.3514 11.7033 12.3735 11.5402 12.3862C11.3666 12.3995 11.1231 12.4 10.7207 12.4H5.27924C4.87691 12.4 4.63338 12.3995 4.45981 12.3862C4.29672 12.3735 4.24424 12.3514 4.22252 12.3397C4.16792 12.3092 4.09077 12.2321 4.06028 12.1775C4.04858 12.1558 4.02644 12.1033 4.01375 11.9402C4.00045 11.7666 4 11.5231 4 11.1207V4.87924C4 4.47691 4.00045 4.23338 4.01375 4.05981C4.02644 3.89672 4.04858 3.84424 4.06028 3.82252C4.09077 3.76792 4.16792 3.69077 4.22252 3.66028C4.24424 3.64858 4.29672 3.62644 4.45981 3.61375C4.63338 3.60045 4.87691 3.6 5.27924 3.6H8.99998L9.99998 2Z"
                                    fill="currentColor"
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-gray-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMedication(index);
                              }}
                              disabled={disabled}
                            >
                              <MinusCircledIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CollapsibleContent>
                          <div className="p-4 space-y-4 bg-white mx-2 mb-1 rounded-md shadow-sm">
                            <MedicationRequestGridRow
                              medication={medication}
                              disabled={disabled}
                              onUpdate={(updates) =>
                                handleUpdateMedication(index, updates)
                              }
                              onRemove={() => handleRemoveMedication(index)}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <MedicationRequestGridRow
                        medication={medication}
                        disabled={disabled}
                        onUpdate={(updates) =>
                          handleUpdateMedication(index, updates)
                        }
                        onRemove={() => handleRemoveMedication(index)}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="max-w-4xl">
        <ValueSetSelect
          system="system-medication"
          placeholder={t("search_medications")}
          onSelect={handleAddMedication}
          disabled={disabled}
          searchPostFix=" clinical drug"
        />
      </div>
    </div>
  );
}

const MedicationRequestGridRow: React.FC<{
  medication: MedicationRequest;
  disabled?: boolean;
  onUpdate?: (medication: Partial<MedicationRequest>) => void;
  onRemove?: () => void;
}> = ({ medication, disabled, onUpdate, onRemove }) => {
  const dosageInstruction =
    medication.dosage_instruction.length > 0
      ? medication.dosage_instruction[0]
      : undefined;
  const handleUpdateDosageInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => {
    onUpdate?.({
      dosage_instruction: [{ ...dosageInstruction, ...updates }],
    });
  };

  const [boundsDurationUnit, setBoundsDurationUnit] = useState<string>("d");

  const as_needed_boolean = dosageInstruction?.as_needed_boolean;
  const isFrequencySet = dosageInstruction?.timing?.repeat?.frequency;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px,180px,170px,160px,300px,230px,180px,250px,180px,160px,48px] border-b hover:bg-gray-50/50">
      {/* Medicine Name and Controls */}
      <div className="lg:p-4 lg:px-2 lg:py-1 flex items-center justify-between lg:justify-start lg:col-span-1 lg:border-r font-medium overflow-hidden text-sm">
        <span className="break-words line-clamp-2 hidden lg:block">
          {medication.medication?.display}
        </span>
      </div>

      {/* Main Fields */}
      <div
        className="grid gap-2
       p-0 lg:contents"
      >
        {/* Dosage */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("dosage")}
          </Label>
          <QuantityInput
            units={DOSAGE_UNITS}
            quantity={dosageInstruction?.dose_and_rate?.dose_quantity}
            onChange={(value) =>
              handleUpdateDosageInstruction({
                dose_and_rate: { type: "ordered", dose_quantity: value },
              })
            }
            disabled={disabled}
            autoFocus={true}
          />
        </div>

        {/* Frequency */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("frequency")}
          </Label>
          <Select
            value={
              dosageInstruction?.as_needed_boolean
                ? "PRN"
                : reverseFrequencyOption(dosageInstruction?.timing)
            }
            onValueChange={(value) => {
              if (value === "PRN") {
                handleUpdateDosageInstruction({
                  as_needed_boolean: true,
                  timing: undefined,
                });
              } else {
                handleUpdateDosageInstruction({
                  as_needed_boolean: false,
                  timing: {
                    repeat: {
                      ...dosageInstruction?.timing?.repeat,
                      ...FREQUENCY_OPTIONS[
                        value as keyof typeof FREQUENCY_OPTIONS
                      ].timing.repeat,
                    },
                  },
                });
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder={t("select_frequency")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRN">{t("as_needed_prn")}</SelectItem>
              {Object.entries(FREQUENCY_OPTIONS).map(([key, option]) => (
                <SelectItem key={key} value={key}>
                  {option.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("duration")}
          </Label>
          <QuantityInput
            units={BOUNDS_DURATION_UNITS}
            quantity={{
              value: dosageInstruction?.timing?.repeat?.bounds_duration?.value,
              unit:
                dosageInstruction?.timing?.repeat?.bounds_duration?.unit ??
                boundsDurationUnit,
            }}
            onChange={(value) => {
              if (value?.unit) {
                setBoundsDurationUnit(
                  value?.unit as (typeof BOUNDS_DURATION_UNITS)[number],
                );
              }
              if (dosageInstruction?.timing?.repeat) {
                let updatedBoundsDuration: BoundsDuration | undefined =
                  undefined;
                const updatedValue = value.value;
                if (updatedValue === undefined || updatedValue === 0) {
                  updatedBoundsDuration = undefined;
                } else {
                  updatedBoundsDuration = {
                    value: updatedValue,
                    unit: value?.unit as (typeof BOUNDS_DURATION_UNITS)[number],
                  };
                }
                handleUpdateDosageInstruction({
                  timing: {
                    ...dosageInstruction.timing,
                    repeat: {
                      ...dosageInstruction.timing.repeat,
                      bounds_duration: updatedBoundsDuration,
                    },
                  },
                });
              }
            }}
            disabled={disabled || !isFrequencySet || as_needed_boolean}
          />
        </div>

        {/* Instructions */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("instructions")}
          </Label>
          <ValueSetSelect
            system="system-as-needed-reason"
            value={dosageInstruction?.as_needed_for}
            onSelect={(reason) =>
              handleUpdateDosageInstruction({ as_needed_for: reason })
            }
            placeholder={t("select_prn_reason")}
            disabled={disabled || !dosageInstruction?.as_needed_boolean}
            wrapTextForSmallScreen={true}
          />
        </div>

        {/* Additional Instructions */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("additional_instructions")}
          </Label>
          <ValueSetSelect
            system="system-additional-instruction"
            value={dosageInstruction?.additional_instruction?.[0]}
            onSelect={(instruction) =>
              handleUpdateDosageInstruction({
                additional_instruction: [instruction],
              })
            }
            placeholder={t("select_additional_instructions")}
            disabled={disabled}
          />
        </div>

        {/* Route */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">{t("route")}</Label>
          <ValueSetSelect
            system="system-route"
            value={dosageInstruction?.route}
            onSelect={(route) => handleUpdateDosageInstruction({ route })}
            placeholder={t("select_route")}
            disabled={disabled}
          />
        </div>

        {/* Site */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">{t("site")}</Label>
          <ValueSetSelect
            system="system-body-site"
            value={dosageInstruction?.site}
            onSelect={(site) => handleUpdateDosageInstruction({ site })}
            placeholder={t("select_site")}
            disabled={disabled}
            wrapTextForSmallScreen={true}
          />
        </div>

        {/* Method */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("method")}
          </Label>
          <ValueSetSelect
            system="system-administration-method"
            value={dosageInstruction?.method}
            onSelect={(method) => handleUpdateDosageInstruction({ method })}
            placeholder={t("select_method")}
            disabled={disabled}
            count={20}
          />
        </div>

        {/* Intent */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("intent")}
          </Label>
          <Select
            value={medication.intent}
            onValueChange={(value: MedicationRequestIntent) =>
              onUpdate?.({ intent: value })
            }
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-sm capitalize">
              <SelectValue
                className="capitalize"
                placeholder={t("select_intent")}
              />
            </SelectTrigger>
            <SelectContent>
              {MEDICATION_REQUEST_INTENT.map((intent) => (
                <SelectItem key={intent} value={intent} className="capitalize">
                  {intent.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Remove Button - Desktop */}
        <div className="hidden lg:flex lg:px-2 lg:py-1 items-center justify-center sticky right-0 bg-white shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
            className="h-8 w-8"
          >
            <MinusCircledIcon className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const reverseFrequencyOption = (
  option: MedicationRequest["dosage_instruction"][0]["timing"],
) => {
  return Object.entries(FREQUENCY_OPTIONS).find(
    ([, value]) =>
      value.timing.repeat.frequency === option?.repeat?.frequency &&
      value.timing.repeat.period_unit === option?.repeat?.period_unit &&
      value.timing.repeat.period === option?.repeat?.period,
  )?.[0] as keyof typeof FREQUENCY_OPTIONS;
};

// TODO: verify period_unit is correct
const FREQUENCY_OPTIONS = {
  BID: {
    display: "Two times a day",
    timing: { repeat: { frequency: 2, period: 1, period_unit: "d" } },
  },
  TID: {
    display: "Three times a day",
    timing: { repeat: { frequency: 3, period: 1, period_unit: "d" } },
  },
  QID: {
    display: "Four times a day",
    timing: { repeat: { frequency: 4, period: 1, period_unit: "d" } },
  },
  AM: {
    display: "Every morning",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "d" } },
  },
  PM: {
    display: "Every afternoon",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "d" } },
  },
  QD: {
    display: "Every day",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "d" } },
  },
  QOD: {
    display: "Every other day",
    timing: { repeat: { frequency: 1, period: 2, period_unit: "d" } },
  },
  Q1H: {
    display: "Every hour",
    timing: { repeat: { frequency: 24, period: 1, period_unit: "d" } },
  },
  Q2H: {
    display: "Every 2 hours",
    timing: { repeat: { frequency: 12, period: 1, period_unit: "d" } },
  },
  Q3H: {
    display: "Every 3 hours",
    timing: { repeat: { frequency: 8, period: 1, period_unit: "d" } },
  },
  Q4H: {
    display: "Every 4 hours",
    timing: { repeat: { frequency: 6, period: 1, period_unit: "d" } },
  },
  Q6H: {
    display: "Every 6 hours",
    timing: { repeat: { frequency: 4, period: 1, period_unit: "d" } },
  },
  Q8H: {
    display: "Every 8 hours",
    timing: { repeat: { frequency: 3, period: 1, period_unit: "d" } },
  },
  BED: {
    display: "At bedtime",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "d" } },
  },
  WK: {
    display: "Weekly",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "wk" } },
  },
  MO: {
    display: "Monthly",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "mo" } },
  },
  STAT: {
    display: "Immediately",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "s" } }, // One-time
  },
} as const satisfies Record<
  string,
  {
    display: string;
    timing: MedicationRequest["dosage_instruction"][0]["timing"];
  }
>;
