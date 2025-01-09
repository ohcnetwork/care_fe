"use client";

import {
  CheckCircledIcon,
  CircleBackslashIcon,
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import {
  BeakerIcon,
  CookingPotIcon,
  HeartPulseIcon,
  LeafIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

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

import query from "@/Utils/request/query";
import {
  AllergyIntolerance,
  AllergyIntoleranceRequest,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface AllergyQuestionProps {
  patientId: string;
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

const ALLERGY_INITIAL_VALUE: Partial<AllergyIntoleranceRequest> = {
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

function convertToAllergyRequest(
  allergy: AllergyIntolerance,
): AllergyIntoleranceRequest {
  return {
    id: allergy.id,
    code: allergy.code,
    clinical_status: allergy.clinical_status,
    verification_status: allergy.verification_status,
    category: allergy.category,
    criticality: allergy.criticality,
    last_occurrence: allergy.last_occurrence,
    note: allergy.note,
    encounter: allergy.encounter,
  };
}

export function AllergyQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  patientId,
}: AllergyQuestionProps) {
  const allergies =
    (questionnaireResponse.values?.[0]?.value as AllergyIntoleranceRequest[]) ||
    [];

  const { data: patientAllergies } = useQuery({
    queryKey: ["allergies", patientId],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
    }),
  });

  useEffect(() => {
    if (patientAllergies?.results && !allergies.length) {
      updateQuestionnaireResponseCB({
        ...questionnaireResponse,
        values: [
          {
            type: "allergy_intolerance",
            value: patientAllergies.results.map(convertToAllergyRequest),
          },
        ],
      });
      if (patientAllergies.count > patientAllergies.results.length) {
        toast.info(
          `Showing first ${patientAllergies.results.length} of ${patientAllergies.count} allergies`,
        );
      }
    }
  }, [patientAllergies]);

  const handleAddAllergy = (code: Code) => {
    const newAllergies = [
      ...allergies,
      { ...ALLERGY_INITIAL_VALUE, code },
    ] as AllergyIntoleranceRequest[];
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
    updates: Partial<AllergyIntoleranceRequest>,
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
    <>
      {allergies.length > 0 && (
        <div className="rounded-lg border">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[220px]">Substance</TableHead>
                  <TableHead className="w-[65px] text-center px-0.5">
                    Critical
                  </TableHead>
                  <TableHead className="w-[85px] text-center px-0.5">
                    Status
                  </TableHead>
                  <TableHead className="w-[100px] text-center px-0.5 pr-6">
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

          <div className="md:hidden divide-y divide-gray-200">
            {allergies.map((allergy, index) => (
              <div
                key={index}
                className={`p-3 space-y-3 ${
                  allergy.clinical_status === "inactive"
                    ? "opacity-60"
                    : allergy.clinical_status === "resolved"
                      ? "line-through"
                      : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select
                      value={allergy.category}
                      onValueChange={(value) =>
                        handleUpdateAllergy(index, { category: value })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 w-[32px] px-0 [&>svg]:hidden flex items-center justify-center">
                        <SelectValue>
                          {allergy.category &&
                            CATEGORY_ICONS[allergy.category as AllergyCategory]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ALLERGY_CATEGORIES).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                {CATEGORY_ICONS[value as AllergyCategory]}
                                <span>{label}</span>
                              </div>
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <span className="font-medium">{allergy.code.display}</span>
                  </div>
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
                        onClick={() =>
                          handleUpdateAllergy(index, {
                            note: allergy.note !== undefined ? undefined : "",
                          })
                        }
                      >
                        <Pencil2Icon className="h-4 w-4 mr-2" />
                        {allergy.note !== undefined
                          ? "Hide Notes"
                          : "Add Notes"}
                      </DropdownMenuItem>
                      {allergy.clinical_status !== "active" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateAllergy(index, {
                              clinical_status: "active",
                            })
                          }
                        >
                          <CheckCircledIcon className="h-4 w-4 mr-2" />
                          Mark Active
                        </DropdownMenuItem>
                      )}
                      {allergy.clinical_status !== "inactive" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateAllergy(index, {
                              clinical_status: "inactive",
                            })
                          }
                        >
                          <CircleBackslashIcon className="h-4 w-4 mr-2" />
                          Mark Inactive
                        </DropdownMenuItem>
                      )}
                      {allergy.clinical_status !== "resolved" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateAllergy(index, {
                              clinical_status: "resolved",
                            })
                          }
                        >
                          <CheckCircledIcon className="h-4 w-4 mr-2 text-green-600" />
                          Mark Resolved
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleRemoveAllergy(index)}
                      >
                        <MinusCircledIcon className="h-4 w-4 mr-2" />
                        Remove Allergy
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">Criticality</Label>
                    <Select
                      value={allergy.criticality}
                      onValueChange={(value) =>
                        handleUpdateAllergy(index, { criticality: value })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder="Critical" />
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

                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <Select
                      value={allergy.verification_status}
                      onValueChange={(value) =>
                        handleUpdateAllergy(index, {
                          verification_status: value,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder="Verify" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                        <SelectItem value="refuted">Refuted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Occurrence</Label>
                    <Input
                      type="date"
                      value={allergy.last_occurrence || ""}
                      onChange={(e) =>
                        handleUpdateAllergy(index, {
                          last_occurrence: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="h-8 mt-1"
                    />
                  </div>
                </div>

                {allergy.note !== undefined && (
                  <div>
                    <Label className="text-xs text-gray-500">Notes</Label>
                    <Input
                      type="text"
                      placeholder="Add notes about the allergy..."
                      value={allergy.note ?? ""}
                      onChange={(e) =>
                        handleUpdateAllergy(index, { note: e.target.value })
                      }
                      disabled={disabled}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
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
    </>
  );
}
interface AllergyItemProps {
  allergy: AllergyIntoleranceRequest;
  disabled?: boolean;
  onUpdate?: (allergy: Partial<AllergyIntoleranceRequest>) => void;
  onRemove?: () => void;
}
const AllergyTableRow = ({
  allergy,
  disabled,
  onUpdate,
  onRemove,
}: AllergyItemProps) => {
  const [showNotes, setShowNotes] = useState(allergy.note !== undefined);

  const rowClassName = `group ${
    allergy.clinical_status === "inactive"
      ? "opacity-60"
      : allergy.clinical_status === "resolved"
        ? "line-through"
        : ""
  }`;

  const handleNotesToggle = () => {
    if (showNotes) {
      setShowNotes(false);
      onUpdate?.({ note: undefined });
    } else {
      setShowNotes(true);
      onUpdate?.({ note: "" });
    }
  };

  return (
    <>
      <TableRow className={rowClassName}>
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
        <TableCell className="min-w-[100px] py-1 px-1">
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
              <DropdownMenuItem onClick={handleNotesToggle}>
                <Pencil2Icon className="h-4 w-4 mr-2" />
                {showNotes ? "Hide Notes" : "Add Notes"}
              </DropdownMenuItem>
              {allergy.clinical_status !== "active" && (
                <DropdownMenuItem
                  onClick={() => onUpdate?.({ clinical_status: "active" })}
                >
                  <CheckCircledIcon className="h-4 w-4 mr-2" />
                  Mark Active
                </DropdownMenuItem>
              )}
              {allergy.clinical_status !== "inactive" && (
                <DropdownMenuItem
                  onClick={() => onUpdate?.({ clinical_status: "inactive" })}
                >
                  <CircleBackslashIcon className="h-4 w-4 mr-2" />
                  Mark Inactive
                </DropdownMenuItem>
              )}
              {allergy.clinical_status !== "resolved" && (
                <DropdownMenuItem
                  onClick={() => onUpdate?.({ clinical_status: "resolved" })}
                >
                  <CheckCircledIcon className="h-4 w-4 mr-2 text-green-600" />
                  Mark Resolved
                </DropdownMenuItem>
              )}
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
          <TableCell colSpan={6} className="px-4 py-2">
            <Label className="text-xs text-gray-500">Notes</Label>
            <Input
              type="text"
              placeholder="Add notes about the allergy..."
              value={allergy.note ?? ""}
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
