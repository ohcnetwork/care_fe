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

import { AllergyIntolerance } from "@/types/emr/allergyIntolerance";
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface AllergyQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

const ALLERGY_INITIAL_VALUE: Partial<AllergyIntolerance> = {
  code: { code: "", display: "", system: "" },
  clinical_status: "active",
  verification_status: "confirmed",
  category: "medication",
  criticality: "low",
};

type AllergyCategory = "food" | "medication" | "environment" | "biologic";

const ALLERGY_CATEGORIES: Record<AllergyCategory, string> = {
  food: "Food",
  medication: "Medication",
  environment: "Environment",
  biologic: "Biologic",
};

export function AllergyQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: AllergyQuestionProps) {
  const allergies =
    (questionnaireResponse.values?.[0]?.value as AllergyIntolerance[]) || [];

  const handleAddAllergy = (code: Code) => {
    const newAllergies = [
      ...allergies,
      { ...ALLERGY_INITIAL_VALUE, code },
    ] as AllergyIntolerance[];
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "allergy_intolerance", value: newAllergies }],
    });
  };

  const handleRemoveAllergy = (index: number) => {
    const newAllergies = allergies.filter((_, i) => i !== index);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "allergy_intolerance", value: newAllergies }],
    });
  };

  const handleUpdateAllergy = (
    index: number,
    updates: Partial<AllergyIntolerance>,
  ) => {
    const newAllergies = allergies.map((allergy, i) =>
      i === index ? { ...allergy, ...updates } : allergy,
    );
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "allergy_intolerance", value: newAllergies }],
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {question.text}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {allergies.length > 0 && (
        <div className="rounded-lg border">
          <div className="hidden md:grid md:grid-cols-12 items-center gap-4 p-3 bg-gray-50 text-sm font-medium text-gray-500">
            <div className="col-span-4">Substance</div>
            <div className="col-span-2 text-center">Category</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Criticality</div>
            <div className="col-span-2 text-center">Action</div>
          </div>
          <div className="divide-y divide-gray-200">
            {allergies.map((allergy, index) => (
              <AllergyItem
                key={index}
                allergy={allergy}
                disabled={disabled}
                onUpdate={(updates) => handleUpdateAllergy(index, updates)}
                onRemove={() => handleRemoveAllergy(index)}
              />
            ))}
          </div>
        </div>
      )}
      <ValueSetSelect
        system="system-allergy-code"
        placeholder="Search for allergies to add"
        onSelect={handleAddAllergy}
        disabled={disabled}
      />
    </div>
  );
}

interface AllergyItemProps {
  allergy: AllergyIntolerance;
  disabled?: boolean;
  onUpdate?: (allergy: Partial<AllergyIntolerance>) => void;
  onRemove?: () => void;
}

const AllergyItem: React.FC<AllergyItemProps> = ({
  allergy,
  disabled,
  onUpdate,
  onRemove,
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showLastOccurrence, setShowLastOccurrence] = useState(false);

  return (
    <div className="group hover:bg-gray-50">
      <div className="py-1 px-2 space-y-2 md:space-y-0 md:grid md:grid-cols-12 md:items-center md:gap-4">
        <div className="flex items-center justify-between md:col-span-4">
          <div
            className="font-medium text-sm truncate"
            title={allergy.code.display}
          >
            {allergy.code.display}
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
                <DropdownMenuItem
                  onClick={() => setShowLastOccurrence(!showLastOccurrence)}
                >
                  <Pencil2Icon className="h-4 w-4 mr-2" />
                  {showLastOccurrence
                    ? "Hide Last Occurrence"
                    : "Add Last Occurrence"}
                </DropdownMenuItem>
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
                  Remove Allergy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:col-span-6 md:grid-cols-3 md:gap-4">
          <div>
            <Label className="text-xs text-gray-500 md:hidden">Category</Label>
            <Select
              value={allergy.category}
              onValueChange={(value) => onUpdate?.({ category: value })}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 md:h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(ALLERGY_CATEGORIES) as [
                    AllergyCategory,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 md:hidden">Status</Label>
            <Select
              value={allergy.clinical_status}
              onValueChange={(value) => onUpdate?.({ clinical_status: value })}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 md:h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 md:hidden">
              Criticality
            </Label>
            <Select
              value={allergy.criticality}
              onValueChange={(value) => onUpdate?.({ criticality: value })}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 md:h-9">
                <SelectValue placeholder="Criticality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="unable-to-assess">
                  Unable to Assess
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="hidden md:block md:col-span-2">
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
              <DropdownMenuItem
                onClick={() => setShowLastOccurrence(!showLastOccurrence)}
              >
                <Pencil2Icon className="h-4 w-4 mr-2" />
                {showLastOccurrence
                  ? "Hide Last Occurrence"
                  : "Add Last Occurrence"}
              </DropdownMenuItem>
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
                Remove Allergy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showLastOccurrence && (
        <div className="px-3 pb-3">
          <Label className="text-xs text-gray-500">Last Occurrence</Label>
          <Input
            type="date"
            value={allergy.last_occurrence || ""}
            onChange={(e) => onUpdate?.({ last_occurrence: e.target.value })}
            disabled={disabled}
            className="mt-1"
          />
        </div>
      )}
      {showNotes && (
        <div className="px-3 pb-3">
          <Label className="text-xs text-gray-500">Notes</Label>
          <Input
            type="text"
            placeholder="Add notes about the allergy..."
            value={allergy.note || ""}
            onChange={(e) => onUpdate?.({ note: e.target.value })}
            disabled={disabled}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
};
