import { MinusCircledIcon } from "@radix-ui/react-icons";
import React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DOSAGE_UNITS } from "@/components/Medicine/models";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import ScribeStructuredInput from "@/Utils/scribe";
import {
  MEDICATION_REQUEST_INTENT,
  MedicationRequest,
  MedicationRequestDosageInstruction,
  MedicationRequestIntent,
} from "@/types/emr/medicationRequest";
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface MedicationRequestQuestionProps {
  question: Question;
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
  question,
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
      <ScribeStructuredInput
        value={medications}
        onChange={(value) => {
          if (value) {
            updateQuestionnaireResponseCB({
              ...questionnaireResponse,
              values: [
                {
                  type: "medication_request",
                  value,
                },
              ],
            });
          }
        }}
        name="Medication Request"
        prompt={`An array of objects of the following type, based on a SNOWMED Medication Product like "Paracetamol containing product": {
          status?: "active" | "on-hold" | "ended" | "stopped" | "completed" | "cancelled" | "entered-in-error" | "draft" | "unknown",
          intent?: "proposal" | "plan" | "order" | "original_order" | "reflex_order" | "filler_order" | "instance_order",
          category?:  "inpatient" | "outpatient" | "community" | "discharge",
          priority?: "stat" | "urgent" | "asap" | "routine"
          do_not_perform?: boolean;
          medication? : CodeType;
          authored_on?: ISO time string,
          dosage_instruction: {
            sequence?: number;
            text?: string;
            additional_instruction?: {
              system: string;
              code: string;
              display?: string;
            }[];
            patient_instruction?: string;
            timing?: {
              repeat?: {
                frequency?: number;
                period: number; // number of units (ex. 12 days would mean 12 with unit "d")
                period_unit: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
              };
            };
            /**
             * True if it is a PRN medication
             */
            as_needed_boolean?: boolean;
            /**
             * If it is a PRN medication (as_needed_boolean is true), the indicator.
             */
            as_needed_for?: CodeType;
            site?: CodeType;
            route?: CodeType;
            method?: CodeType;
            /**
             * One of \`dose_quantity\` or \`dose_range\` must be present.
             * \`type\` is optional and defaults to \`ordered\`.
             *
             * - If \`type\` is \`ordered\`, \`dose_quantity\` must be present.
             * - If \`type\` is \`calculated\`, \`dose_range\` must be present. This is used for titrated medications.
             */
            dose_and_rate?: (
              | {
                  type?: "ordered";
                  dose_quantity?: DosageQuantity;
                  dose_range?: undefined;
                }
              | {
                  type: "calculated";
                  dose_range?: {
                    low: DosageQuantity;
                    high: DosageQuantity;
                  };
                  dose_quantity?: undefined;
                }
            )[];
            max_dose_per_period?: {
              low: DosageQuantity;
              high: DosageQuantity;
            };
          }[];
          note?: string
        }. 
        
        DosageQuantity {
          value?: number;
          unit?: "mg" | "g" | "ml" | "drop(s)" | "ampule(s)" | "tsp" | "mcg" | "unit(s)"
        }

        CodeType {
          code: string,
          display: string,
          system: "http://snomed.info/sct"
        }
        
        Update existing data, delete existing data or append to the existing list as per the will of the user. Current date is ${new Date().toLocaleDateString()}`}
        example={[
          {
            status: "active",
            intent: "original_order",
            category: "inpatient",
            priority: "urgent",
            do_not_perform: false,
            medication: {
              code: "1214771000202109",
              display:
                "Ciprofloxacin and fluocinolone only product in otic dose form",
              system: "http://snomed.info/sct",
            },
            authored_on: "2024-12-29T22:16:45.404Z",
            dosage_instruction: [
              {
                dose_and_rate: [
                  {
                    type: "ordered",
                    dose_quantity: {
                      unit: "g",
                      value: 11,
                    },
                  },
                ],
                route: {
                  code: "58831000052108",
                  display: "Subretinal route",
                  system: "http://snomed.info/sct",
                },
                method: {
                  code: "1231460007",
                  display: "Dialysis system",
                  system: "http://snomed.info/sct",
                },
                site: {
                  code: "16217661000119109",
                  display: "Structure of right deltoid muscle",
                  system: "http://snomed.info/sct",
                },
                as_needed_boolean: true,
                timing: {
                  repeat: {
                    frequency: 1,
                    period: 1,
                    period_unit: "d",
                  },
                },
                additional_instruction: [
                  {
                    code: "421984009",
                    display: "Until finished",
                    system: "http://snomed.info/sct",
                  },
                ],
                as_needed_for: {
                  code: "972604701000119104",
                  display:
                    "Acquired arteriovenous malformation of vascular structure of gastrointestinal tract",
                  system: "http://snomed.info/sct",
                },
              },
            ],
          },
        ]}
        className="rounded-lg border p-4"
      >
        <Label className="text-base font-medium">
          {question.text}
          {question.required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        {medications.length > 0 && (
          <div className="rounded-lg border space-y-4">
            <ul className="space-y-2 divide-y-2 divide-gray-200 divide-dashed">
              {medications.map((medication, index) => (
                <li key={index}>
                  <MedicationRequestItem
                    medication={medication}
                    disabled={disabled}
                    onUpdate={(medication) =>
                      handleUpdateMedication(index, medication)
                    }
                    onRemove={() => handleRemoveMedication(index)}
                    index={index}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
        <ValueSetSelect
          system="system-medication"
          placeholder="Search for medications to add"
          onSelect={handleAddMedication}
          disabled={disabled}
        />
      </ScribeStructuredInput>
    </div>
  );
}
export const MedicationRequestItem: React.FC<{
  medication: MedicationRequest;
  disabled?: boolean;
  onUpdate?: (medication: Partial<MedicationRequest>) => void;
  onRemove?: () => void;
  index?: number;
}> = ({ medication, disabled, onUpdate, onRemove, index = 0 }) => {
  const dosageInstruction = medication.dosage_instruction[0];
  const handleUpdateDosageInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => {
    onUpdate?.({
      dosage_instruction: [{ ...dosageInstruction, ...updates }],
    });
  };
  return (
    <div className="p-3 justify-between group focus-within:ring-2 ring-gray-300 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold">
          {index + 1}. {medication.medication?.display}
        </h4>
        <div className="flex items-center gap-2">
          <div>
            <Label className="sr-only">Intent</Label>
            <Select
              value={medication.intent}
              onValueChange={(value: MedicationRequestIntent) =>
                onUpdate?.({ intent: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder="Select intent" />
              </SelectTrigger>
              <SelectContent>
                {MEDICATION_REQUEST_INTENT.map((intent) => (
                  <SelectItem
                    key={intent}
                    value={intent}
                    className="capitalize"
                  >
                    {intent.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {onRemove && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onRemove}
              disabled={disabled}
            >
              <MinusCircledIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="mb-1 block text-sm font-medium">Dosage</Label>
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
          <div className="flex-[2]">
            <Label className="mb-1 block text-sm font-medium">Route</Label>
            <ValueSetSelect
              system="system-route"
              value={medication.dosage_instruction[0]?.route}
              onSelect={(route) => handleUpdateDosageInstruction({ route })}
              placeholder="Select route"
              disabled={disabled}
            />
          </div>
          <div className="flex-1">
            <Label className="mb-1 block text-sm font-medium pr-4">
              Method
            </Label>
            <ValueSetSelect
              system="system-administration-method"
              value={medication.dosage_instruction[0]?.method}
              onSelect={(method) => handleUpdateDosageInstruction({ method })}
              placeholder="Select method"
              disabled={disabled}
              count={20}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="mb-1 block text-sm font-medium pr-4">Site</Label>
            <ValueSetSelect
              system="system-body-site"
              value={medication.dosage_instruction[0]?.site}
              onSelect={(site) => handleUpdateDosageInstruction({ site })}
              placeholder="Select site"
              disabled={disabled}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id={`prn-checkbox-${medication.medication?.code}`}
            checked={
              medication.dosage_instruction[0]?.as_needed_boolean ?? false
            }
            onCheckedChange={(checked) =>
              handleUpdateDosageInstruction({
                as_needed_boolean: !!checked,
                as_needed_for: checked
                  ? medication.dosage_instruction[0]?.as_needed_for
                  : undefined,
              })
            }
            disabled={disabled}
          />
          <Label htmlFor={`prn-checkbox-${medication.medication?.code}`}>
            As Needed / PRN
          </Label>
        </div>
        {medication.dosage_instruction[0]?.as_needed_boolean ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <ValueSetSelect
                system="system-as-needed-reason"
                value={medication.dosage_instruction[0]?.as_needed_for}
                onSelect={(reason) =>
                  handleUpdateDosageInstruction({ as_needed_for: reason })
                }
                placeholder="Select reason or indicator for PRN"
                disabled={disabled}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="mb-1 block text-sm font-medium">
                Frequency
              </Label>
              <Select
                value={reverseFrequencyOption(dosageInstruction?.timing)}
                onValueChange={(value: keyof typeof FREQUENCY_OPTIONS) =>
                  handleUpdateDosageInstruction({
                    timing: FREQUENCY_OPTIONS[value].timing,
                  })
                }
                disabled={disabled}
              >
                <SelectTrigger className="capitalize">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_OPTIONS).map(([key, option]) => (
                    <SelectItem key={key} value={key}>
                      {option.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1 block text-sm font-medium">Days</Label>
              <Input type="number" disabled={disabled} />
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="mb-1 block text-sm font-medium">
              Additional Instructions
            </Label>
            <ValueSetSelect
              system="system-additional-instruction"
              value={
                medication.dosage_instruction[0]?.additional_instruction?.[0]
              }
              onSelect={(additionalInstruction) =>
                onUpdate?.({
                  dosage_instruction: [
                    {
                      ...medication.dosage_instruction[0],
                      additional_instruction: [additionalInstruction],
                    },
                  ],
                })
              }
              disabled={disabled}
            />
          </div>
        </div>
      </div>
      {/* <div className="font-mono text-xs whitespace-pre-wrap mt-8">
        {JSON.stringify(medication, null, 2)}
      </div> */}
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
