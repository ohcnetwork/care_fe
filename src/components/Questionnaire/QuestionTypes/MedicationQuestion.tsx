import { Cross2Icon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import {
  MEDICATION_REQUEST_CATEGORY,
  MEDICATION_REQUEST_INTENT,
  MEDICATION_REQUEST_PRIORITY,
  MEDICATION_REQUEST_STATUS,
  MedicationRequest,
  MedicationRequestCategory,
  MedicationRequestIntent,
  MedicationRequestPriority,
  MedicationRequestStatus,
} from "@/types/emr/medicationRequest";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface MedicationQuestionProps {
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
  dosage_instruction: [
    {
      dose_and_rate: [
        {
          dose_range: {
            low: {
              value: 1,
              unit: "mg",
            },
            high: {
              value: 2,
              unit: "mg",
            },
          },
        },
      ],
    },
  ],
};

export function MedicationQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: MedicationQuestionProps) {
  const medications =
    (questionnaireResponse.values?.[0]?.value as MedicationRequest[]) || [];

  const [medication, setMedication] = useState(
    MEDICATION_REQUEST_INITIAL_VALUE,
  );

  const handleAddMedication = () => {
    const newMedications: MedicationRequest[] = [...medications, medication];
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "medication_request",
          value: newMedications,
        },
      ],
    });
    setMedication(MEDICATION_REQUEST_INITIAL_VALUE);
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
    // setMedications(newMedications);
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

  // TODO: figure out how to edit an already added medication

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {question.text}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <div className="rounded-lg border p-4">
        <div>
          <ul className="space-y-2">
            {medications.map((medication, index) => (
              <li key={index}>
                <MedicationRequestItem
                  medication={medication}
                  disabled={disabled}
                  onRemove={() => handleRemoveMedication(index)}
                />
              </li>
            ))}
          </ul>
          {medications.length === 0 && (
            <div className="flex flex-col gap-2 border-2 border-gray-200 rounded-lg py-6 border-dashed text-center">
              <p className="text-sm text-gray-500">No medications added yet</p>
            </div>
          )}
        </div>

        <div className="mt-4 border border-gray-200 rounded-lg p-4 flex flex-col gap-4 shadow">
          <div className="flex gap-2">
            <div className="flex-[2]">
              <Label className="mb-1 block text-sm font-medium">
                Medication
              </Label>
              <ValueSetSelect
                system="system-medication"
                placeholder="Search for medications"
                value={medication.medication}
                onSelect={(value) =>
                  setMedication({ ...medication, medication: value })
                }
                disabled={disabled}
              />
            </div>

            <div className="flex-1">
              <Label className="mb-1 block text-sm font-medium">Intent</Label>
              <Select
                value={medication.intent}
                onValueChange={(value) =>
                  setMedication({
                    ...medication,
                    intent: value as MedicationRequestIntent,
                  })
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
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
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="mb-1 block text-sm font-medium">Route</Label>
                <ValueSetSelect
                  system="system-additional-instruction"
                  value={medication.dosage_instruction[0]?.route}
                  onSelect={(route) =>
                    setMedication({
                      ...medication,
                      dosage_instruction: [
                        { ...medication.dosage_instruction[0], route },
                      ],
                    })
                  }
                  placeholder="Select route"
                  disabled={disabled}
                />
              </div>
              <div className="flex-1">
                <Label className="mb-1 block text-sm font-medium">Method</Label>
                <ValueSetSelect
                  system="system-administration-method"
                  value={medication.dosage_instruction[0]?.method}
                  onSelect={(method) =>
                    setMedication({
                      ...medication,
                      dosage_instruction: [
                        { ...medication.dosage_instruction[0], method },
                      ],
                    })
                  }
                  placeholder="Select method"
                  disabled={disabled}
                />
              </div>
              <div className="flex-1">
                <Label className="mb-1 block text-sm font-medium">Site</Label>
                <ValueSetSelect
                  system="system-body-site"
                  value={medication.dosage_instruction[0]?.site}
                  onSelect={(site) =>
                    setMedication({
                      ...medication,
                      dosage_instruction: [
                        { ...medication.dosage_instruction[0], site },
                      ],
                    })
                  }
                  placeholder="Select site"
                  disabled={disabled}
                />
              </div>
            </div>

            <div>
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  Additional Instructions
                </Label>
                <ValueSetSelect
                  system="system-additional-instruction"
                  value={
                    medication.dosage_instruction[0]
                      ?.additional_instruction?.[0]
                  }
                  onSelect={(additionalInstruction) =>
                    setMedication({
                      ...medication,
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

          <Button
            variant="outline_primary"
            size="sm"
            className="mt-2"
            onClick={handleAddMedication}
            disabled={disabled}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {question.text}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <div className="rounded-lg border p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Medication</TableHead>
                <TableHead className="w-[150px]">Route</TableHead>
                <TableHead className="w-[150px]">Site</TableHead>
                <TableHead className="w-[150px]">Method</TableHead>
                <TableHead className="w-[150px]">Dosage</TableHead>
                <TableHead className="w-[150px]">Intent</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
                <TableHead className="w-[150px]">Priority</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[150px]">
                  Additional Instructions
                </TableHead>
                <TableHead className="w-[200px]">Note</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((medication, index) => (
                <TableRow key={index}>
                  <TableCell className="min-w-[200px]">
                    <ValueSetSelect
                      system="system-medication"
                      value={medication.medication}
                      onSelect={(medication) =>
                        handleUpdateMedication(index, { medication })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <ValueSetSelect
                      system="system-route"
                      value={medication.dosage_instruction[0]?.route}
                      onSelect={(route) =>
                        handleUpdateMedication(index, {
                          dosage_instruction: [
                            { ...medication.dosage_instruction[0], route },
                          ],
                        })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <ValueSetSelect
                      system="system-body-site"
                      value={medication.dosage_instruction[0]?.site}
                      onSelect={(site) =>
                        handleUpdateMedication(index, {
                          dosage_instruction: [
                            { ...medication.dosage_instruction[0], site },
                          ],
                        })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <ValueSetSelect
                      system="system-administration-method"
                      value={medication.dosage_instruction[0]?.method}
                      onSelect={(method) =>
                        handleUpdateMedication(index, {
                          dosage_instruction: [
                            {
                              ...medication.dosage_instruction[0],
                              method,
                            },
                          ],
                        })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Input
                      type="number"
                      placeholder="Dosage"
                      value={
                        medication.dosage_instruction[0]?.dose_and_rate?.[0]
                          ?.dose_quantity?.value || ""
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={medication.intent}
                      onValueChange={(value) =>
                        handleUpdateMedication(index, {
                          intent: value as MedicationRequestIntent,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Intent" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_REQUEST_INTENT.map((intent) => (
                          <SelectItem
                            key={intent}
                            value={intent}
                            className="capitalize"
                          >
                            {intent.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={medication.category}
                      onValueChange={(value) =>
                        handleUpdateMedication(index, {
                          category: value as MedicationRequestCategory,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_REQUEST_CATEGORY.map((category) => (
                          <SelectItem
                            key={category}
                            value={category}
                            className="capitalize"
                          >
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={medication.priority}
                      onValueChange={(value) =>
                        handleUpdateMedication(index, {
                          priority: value as MedicationRequestPriority,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_REQUEST_PRIORITY.map((priority) => (
                          <SelectItem
                            key={priority}
                            value={priority}
                            className="capitalize"
                          >
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={medication.status}
                      onValueChange={(value) =>
                        handleUpdateMedication(index, {
                          status: value as MedicationRequestStatus,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_REQUEST_STATUS.map((status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            className="capitalize"
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[300px]">
                    <ValueSetSelect
                      system="system-additional-instruction"
                      value={
                        medication.dosage_instruction[0]
                          ?.additional_instruction?.[0]
                      }
                      onSelect={(additionalInstruction) =>
                        handleUpdateMedication(index, {
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
                  </TableCell>
                  <TableCell className="min-w-[200px]">
                    <Input
                      type="text"
                      placeholder="Note"
                      value={medication.note || ""}
                      onChange={(e) =>
                        handleUpdateMedication(index, { note: e.target.value })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[50px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveMedication(index)}
                      disabled={disabled}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={handleAddMedication}
          disabled={disabled}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Medication
        </Button>
      </div>
    </div>
  );
}

const MedicationRequestItem: React.FC<{
  medication: MedicationRequest;
  disabled?: boolean;
  onRemove: () => void;
}> = ({ medication, disabled, onRemove }) => {
  return (
    <div className="border border-gray-200 bg-gray-50 rounded-lg p-2 flex justify-between">
      <code className="text-xs whitespace-pre-wrap">
        {JSON.stringify(medication, null, 2)}
      </code>
      <Button
        variant="outline"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
      >
        <Cross2Icon className="h-4 w-4" />
      </Button>
    </div>
  );
};
