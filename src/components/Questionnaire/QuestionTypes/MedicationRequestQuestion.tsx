import { MinusCircledIcon } from "@radix-ui/react-icons";
import { t } from "i18next";
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import {
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
  };

  const handleRemoveMedication = (index: number) => {
    const newMedications = medications.filter((_, i) => i !== index);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "medication_request", value: newMedications }],
    });
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
      {medications.length > 0 && (
        <div className="w-full border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-fit w-full">
              {/* Header */}
              <div className="hidden lg:grid grid-cols-[280px,180px,170px,100px,300px,220px,180px,250px,180px,160px,48px] bg-gray-50 border-b text-sm font-medium text-gray-500">
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
                  {t("days")}
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
                <div className="font-semibold text-gray-600 p-3"></div>
              </div>

              {/* Body */}
              <div className="bg-white">
                {medications.map((medication, index) => (
                  <MedicationRequestGridRow
                    key={index}
                    medication={medication}
                    disabled={disabled}
                    onUpdate={(updates) =>
                      handleUpdateMedication(index, updates)
                    }
                    onRemove={() => handleRemoveMedication(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="relative">
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
  const dosageInstruction = medication.dosage_instruction[0];
  const handleUpdateDosageInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => {
    onUpdate?.({
      dosage_instruction: [{ ...dosageInstruction, ...updates }],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px,180px,170px,100px,300px,220px,180px,250px,180px,160px,48px] border-b hover:bg-gray-50/50">
      {/* Medicine Name and Controls */}
      <div className="p-4 lg:px-2 lg:py-1 flex items-center justify-between lg:justify-start lg:col-span-1 lg:border-r font-medium overflow-hidden text-sm">
        <span className="break-words line-clamp-2">
          {medication.medication?.display}
        </span>
        <div className="flex items-center gap-2 lg:hidden">
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

      {/* Main Fields */}
      <div className="grid gap-4 p-4 lg:p-0 lg:contents">
        {/* Dosage */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("dosage")}
          </Label>
          <QuantityInput
            units={DOSAGE_UNITS}
            quantity={
              medication.dosage_instruction[0]?.dose_and_rate?.dose_quantity
            }
            onChange={(value) =>
              handleUpdateDosageInstruction({
                dose_and_rate: { type: "ordered", dose_quantity: value },
              })
            }
            disabled={disabled}
          />
        </div>

        {/* Frequency */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("frequency")}
          </Label>
          <Select
            value={
              medication.dosage_instruction[0]?.as_needed_boolean
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
                  timing:
                    FREQUENCY_OPTIONS[value as keyof typeof FREQUENCY_OPTIONS]
                      .timing,
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

        {/* Days */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">{t("days")}</Label>
          <Input
            type="number"
            disabled={
              disabled || medication.dosage_instruction[0]?.as_needed_boolean
            }
            value={
              medication.dosage_instruction[0]?.timing?.repeat?.bounds_duration
                ?.value ?? ""
            }
            onChange={(e) =>
              handleUpdateDosageInstruction({
                timing: {
                  ...dosageInstruction?.timing,
                  repeat: {
                    frequency:
                      dosageInstruction?.timing?.repeat?.frequency ?? 1,
                    period: dosageInstruction?.timing?.repeat?.period ?? 1,
                    period_unit:
                      dosageInstruction?.timing?.repeat?.period_unit ?? "d",
                    bounds_duration: {
                      value: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                      unit: "d",
                    },
                  },
                },
              })
            }
          />
        </div>

        {/* Instructions */}
        <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
          <Label className="mb-1.5 block text-sm lg:hidden">
            {t("instructions")}
          </Label>
          <ValueSetSelect
            system="system-as-needed-reason"
            value={medication.dosage_instruction[0]?.as_needed_for}
            onSelect={(reason) =>
              handleUpdateDosageInstruction({ as_needed_for: reason })
            }
            placeholder={t("select_prn_reason")}
            disabled={
              disabled || !medication.dosage_instruction[0]?.as_needed_boolean
            }
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
            value={
              medication.dosage_instruction[0]?.additional_instruction?.[0]
            }
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
            value={medication.dosage_instruction[0]?.route}
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
            value={medication.dosage_instruction[0]?.site}
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
            value={medication.dosage_instruction[0]?.method}
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
        <div className="hidden lg:flex lg:px-2 lg:py-1 items-center justify-center">
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
  BD: {
    display: "Twice daily",
    timing: { repeat: { frequency: 2, period: 1, period_unit: "d" } },
  },
  HS: {
    display: "Night only",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "d" } },
  },
  OD: {
    display: "Once daily",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "d" } },
  },
  Q4H: {
    display: "4th hourly",
    timing: { repeat: { frequency: 4, period: 1, period_unit: "h" } },
  },
  QID: {
    display: "6th hourly",
    timing: { repeat: { frequency: 6, period: 1, period_unit: "h" } },
  },
  QOD: {
    display: "Alternate day",
    timing: { repeat: { frequency: 2, period: 1, period_unit: "d" } },
  },
  QWK: {
    display: "Once a week",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "wk" } },
  },
  STAT: {
    display: "Imediately",
    timing: { repeat: { frequency: 1, period: 1, period_unit: "s" } },
  },
  TID: {
    display: "8th hourly",
    timing: { repeat: { frequency: 8, period: 1, period_unit: "h" } },
  },
} as const satisfies Record<
  string,
  {
    display: string;
    timing: MedicationRequest["dosage_instruction"][0]["timing"];
  }
>;
