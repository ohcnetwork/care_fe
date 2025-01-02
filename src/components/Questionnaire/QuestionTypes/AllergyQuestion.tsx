"use client";

import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import {
  BeakerIcon,
  CookingPotIcon,
  HeartPulseIcon,
  LeafIcon,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const CATEGORY_ICONS: Record<AllergyCategory, React.ReactNode> = {
  food: <CookingPotIcon className="h-4 w-4" />,
  medication: <BeakerIcon className="h-4 w-4" />,
  environment: <LeafIcon className="h-4 w-4" />,
  biologic: <HeartPulseIcon className="h-4 w-4" />,
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[220px]">Substance</TableHead>
                  <TableHead className="w-[85px] text-center whitespace-normal px-0.5">
                    Clinical
                    <br />
                    Status
                  </TableHead>
                  <TableHead className="w-[65px] text-center px-0.5">
                    Critical
                  </TableHead>
                  <TableHead className="w-[85px] text-center px-0.5">
                    Status
                  </TableHead>
                  <TableHead className="w-[125px] text-center px-0.5">
                    Occurrence
                  </TableHead>
                  <TableHead className="w-[35px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allergies.map((allergy, index) => (
                  <AllergyTableRow
                    key={index}
                    allergy={allergy}
                    disabled={disabled}
                    onUpdate={(updates) => handleUpdateAllergy(index, updates)}
                    onRemove={() => handleRemoveAllergy(index)}
                  />
                ))}
              </TableBody>
            </Table>
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
const AllergyTableRow = ({
  allergy,
  disabled,
  onUpdate,
  onRemove,
}: AllergyItemProps) => {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <>
      <TableRow className="group">
        <TableCell className="min-w-[40px] py-1 pr-0">
          <Select
            value={allergy.category}
            onValueChange={(value) => onUpdate?.({ category: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-[32px] px-0 [&>svg]:hidden flex items-center justify-center">
              <SelectValue
                placeholder="Cat"
                className="text-center h-full flex items-center justify-center m-0 p-0"
              >
                {allergy.category &&
                  CATEGORY_ICONS[allergy.category as AllergyCategory]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(ALLERGY_CATEGORIES) as [
                  AllergyCategory,
                  string,
                ][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    {CATEGORY_ICONS[value]}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="min-w-[220px] font-medium py-1 pl-1">
          {allergy.code.display}
        </TableCell>
        <TableCell className="min-w-[85px] py-1 px-0.5">
          <Select
            value={allergy.clinical_status}
            onValueChange={(value) => onUpdate?.({ clinical_status: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-[85px] px-1">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="min-w-[65px] py-1 px-0.5">
          <Select
            value={allergy.criticality}
            onValueChange={(value) => onUpdate?.({ criticality: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-[65px] px-1">
              <SelectValue placeholder="Critical" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="unable-to-assess">Unable to Assess</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="min-w-[85px] py-1 px-0.5">
          <Select
            value={allergy.verification_status}
            onValueChange={(value) =>
              onUpdate?.({ verification_status: value })
            }
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-[85px] px-1">
              <SelectValue placeholder="Verify" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
              <SelectItem value="refuted">Refuted</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="min-w-[125px] py-1 px-1">
          <Input
            type="date"
            value={allergy.last_occurrence || ""}
            onChange={(e) => onUpdate?.({ last_occurrence: e.target.value })}
            disabled={disabled}
            className="h-7 text-sm w-[100px] px-1"
          />
        </TableCell>
        <TableCell className="min-w-[35px] py-1 px-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="h-7 w-6 px-0"
              >
                <DotsVerticalIcon className="h-3.5 w-3.5" />
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
                Remove Allergy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {showNotes && (
        <TableRow>
          <TableCell colSpan={7} className="px-4 py-2">
            <Label className="text-xs text-gray-500">Notes</Label>
            <Input
              type="text"
              placeholder="Add notes about the allergy..."
              value={allergy.note || ""}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              disabled={disabled}
              className="mt-0.5"
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
