import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import {
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_VERIFICATION_STATUS,
  Diagnosis,
} from "@/types/emr/diagnosis/diagnosis";
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";

interface DiagnosisQuestionProps {
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

const DIAGNOSIS_INITIAL_VALUE: Partial<Diagnosis> = {
  code: { code: "", display: "", system: "" },
  clinical_status: "active",
  verification_status: "confirmed",
  onset: { onset_datetime: new Date().toISOString().split("T")[0] },
};

export function DiagnosisQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: DiagnosisQuestionProps) {
  const diagnoses =
    (questionnaireResponse.values?.[0]?.value as Diagnosis[]) || [];

  const handleAddDiagnosis = (code: Code) => {
    const newDiagnoses = [
      ...diagnoses,
      { ...DIAGNOSIS_INITIAL_VALUE, code },
    ] as Diagnosis[];
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "diagnosis", value: newDiagnoses }],
    });
  };

  const handleRemoveDiagnosis = (index: number) => {
    const newDiagnoses = diagnoses.filter((_, i) => i !== index);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "diagnosis", value: newDiagnoses }],
    });
  };

  const handleUpdateDiagnosis = (
    index: number,
    updates: Partial<Diagnosis>,
  ) => {
    const newDiagnoses = diagnoses.map((diagnosis, i) =>
      i === index ? { ...diagnosis, ...updates } : diagnosis,
    );
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "diagnosis", value: newDiagnoses }],
    });
  };

  return (
    <>
      {diagnoses.length > 0 && (
        <div className="rounded-lg border">
          <div className="hidden md:grid md:grid-cols-12 items-center gap-4 p-3 bg-gray-50 text-sm font-medium text-gray-500">
            <div className="col-span-5">Diagnosis</div>
            <div className="col-span-2 text-center">Onset Date</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Verification</div>
            <div className="col-span-1 text-center">Action</div>
          </div>
          <div className="divide-y divide-gray-200">
            {diagnoses.map((diagnosis, index) => (
              <DiagnosisItem
                key={index}
                diagnosis={diagnosis}
                disabled={disabled}
                onUpdate={(updates) => handleUpdateDiagnosis(index, updates)}
                onRemove={() => handleRemoveDiagnosis(index)}
              />
            ))}
          </div>
        </div>
      )}
      <ValueSetSelect
        system="system-condition-code"
        placeholder="Search for diagnoses to add"
        onSelect={handleAddDiagnosis}
        disabled={disabled}
      />
    </>
  );
}

interface DiagnosisItemProps {
  diagnosis: Diagnosis;
  disabled?: boolean;
  onUpdate?: (diagnosis: Partial<Diagnosis>) => void;
  onRemove?: () => void;
}

const DiagnosisItem: React.FC<DiagnosisItemProps> = ({
  diagnosis,
  disabled,
  onUpdate,
  onRemove,
}) => {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="group hover:bg-gray-50">
      <div className="py-1 px-2 space-y-2 md:space-y-0 md:grid md:grid-cols-12 md:items-center md:gap-4">
        <div className="flex items-center justify-between md:col-span-5">
          <div
            className="font-medium text-sm truncate"
            title={diagnosis.code.display}
          >
            {diagnosis.code.display}
          </div>
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  className="h-8 w-8"
                >
                  <DotsVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowNotes(!showNotes)}>
                  <Pencil2Icon className="h-4 w-4 mr-2" />
                  {showNotes ? "Hide Notes" : "Add Notes"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onRemove}
                >
                  <MinusCircledIcon className="h-4 w-4 mr-2" />
                  Remove Diagnosis
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:col-span-6 md:grid-cols-3 md:gap-4">
          <div className="col-span-2 md:col-span-1">
            <Label className="text-xs text-gray-500 md:hidden">Date</Label>
            <Input
              type="date"
              value={diagnosis.onset?.onset_datetime || ""}
              onChange={(e) =>
                onUpdate?.({
                  onset: { onset_datetime: e.target.value },
                })
              }
              disabled={disabled}
              className="h-8 md:h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 md:hidden">Status</Label>
            <Select
              value={diagnosis.clinical_status}
              onValueChange={(value) =>
                onUpdate?.({
                  clinical_status: value as Diagnosis["clinical_status"],
                })
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-8 md:h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {DIAGNOSIS_CLINICAL_STATUS.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {status.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 md:hidden">
              Verification
            </Label>
            <Select
              value={diagnosis.verification_status}
              onValueChange={(value) =>
                onUpdate?.({
                  verification_status:
                    value as Diagnosis["verification_status"],
                })
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-8 md:h-9">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                {DIAGNOSIS_VERIFICATION_STATUS.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {status.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="hidden md:block md:col-span-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="h-9 w-9"
              >
                <DotsVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowNotes(!showNotes)}>
                <Pencil2Icon className="h-4 w-4 mr-2" />
                {showNotes ? "Hide Notes" : "Add Notes"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onRemove}
              >
                <MinusCircledIcon className="h-4 w-4 mr-2" />
                Remove Diagnosis
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showNotes && (
        <div className="px-3 pb-3">
          <Input
            type="text"
            placeholder="Add notes about the diagnosis..."
            value={diagnosis.note || ""}
            onChange={(e) => onUpdate?.({ note: e.target.value })}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};
