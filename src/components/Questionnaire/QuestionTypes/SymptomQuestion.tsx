"use client";

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
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
  Symptom,
  SymptomRequest,
} from "@/types/emr/symptom/symptom";
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";

interface SymptomQuestionProps {
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

const SYMPTOM_INITIAL_VALUE: Omit<SymptomRequest, "encounter"> = {
  code: { code: "", display: "", system: "" },
  clinical_status: "active",
  verification_status: "confirmed",
  severity: "moderate",
  onset: { onset_datetime: new Date().toISOString().split("T")[0] },
};

export function SymptomQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: SymptomQuestionProps) {
  const symptoms =
    (questionnaireResponse.values?.[0]?.value as Symptom[]) || [];

  const handleAddSymptom = (code: Code) => {
    const newSymptoms = [
      ...symptoms,
      { ...SYMPTOM_INITIAL_VALUE, code },
    ] as Symptom[];
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "symptom", value: newSymptoms }],
    });
  };

  const handleRemoveSymptom = (index: number) => {
    const newSymptoms = symptoms.filter((_, i) => i !== index);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "symptom", value: newSymptoms }],
    });
  };

  const handleUpdateSymptom = (index: number, updates: Partial<Symptom>) => {
    const newSymptoms = symptoms.map((symptom, i) =>
      i === index ? { ...symptom, ...updates } : symptom,
    );
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "symptom", value: newSymptoms }],
    });
  };

  return (
    <>
      {symptoms.length > 0 && (
        <div className="rounded-lg border">
          <div className="hidden md:grid md:grid-cols-12 items-center gap-4 p-3 bg-gray-50 text-sm font-medium text-gray-500">
            <div className="col-span-5">Symptom</div>
            <div className="col-span-2 text-center">Date</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Severity</div>
            <div className="col-span-1 text-center">Action</div>
          </div>
          <div className="divide-y divide-gray-200">
            {symptoms.map((symptom, index) => (
              <SymptomItem
                key={index}
                symptom={symptom}
                disabled={disabled}
                onUpdate={(updates) => handleUpdateSymptom(index, updates)}
                onRemove={() => handleRemoveSymptom(index)}
              />
            ))}
          </div>
        </div>
      )}
      <ValueSetSelect
        system="system-condition-code"
        placeholder="Search for symptoms to add"
        onSelect={handleAddSymptom}
        disabled={disabled}
      />
    </>
  );
}

interface SymptomItemProps {
  symptom: Symptom;
  disabled?: boolean;
  onUpdate?: (symptom: Partial<Symptom>) => void;
  onRemove?: () => void;
}

const SymptomItem: React.FC<SymptomItemProps> = ({
  symptom,
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
            title={symptom.code.display}
          >
            {symptom.code.display}
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
                  Remove Symptom
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
              value={symptom.onset?.onset_datetime || ""}
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
              value={symptom.clinical_status}
              onValueChange={(value) =>
                onUpdate?.({
                  clinical_status: value as Symptom["clinical_status"],
                })
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-8 md:h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {SYMPTOM_CLINICAL_STATUS.map((status) => (
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
            <Label className="text-xs text-gray-500 md:hidden">Severity</Label>
            <Select
              value={symptom.severity}
              onValueChange={(value) =>
                onUpdate?.({ severity: value as Symptom["severity"] })
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-8 md:h-9">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SYMPTOM_SEVERITY.map((severity) => (
                  <SelectItem
                    key={severity}
                    value={severity}
                    className="capitalize"
                  >
                    {severity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="hidden md:block md:col-span-1/2">
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
                Remove Symptom
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showNotes && (
        <div className="px-3 pb-3">
          <Input
            type="text"
            placeholder="Add notes about the symptom..."
            value={symptom.note || ""}
            onChange={(e) => onUpdate?.({ note: e.target.value })}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};
