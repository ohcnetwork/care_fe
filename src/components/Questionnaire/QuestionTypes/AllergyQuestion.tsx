"use client";

import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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

import ScribeStructuredInput from "@/Utils/scribe";
import { AllergyIntolerance } from "@/types/emr/allergyIntolerance";
import { QuestionnaireResponse } from "@/types/questionnaire/form";

interface AllergyQuestionProps {
  question: any;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

export function AllergyQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: AllergyQuestionProps) {
  const [allergies, setAllergies] = useState<AllergyIntolerance[]>(() => {
    return (
      (questionnaireResponse.values?.[0]?.value as AllergyIntolerance[]) || []
    );
  });

  const handleAddAllergy = () => {
    const newAllergies = [
      ...allergies,
      { code: { code: "", display: "", system: "" } },
    ];
    setAllergies(newAllergies as AllergyIntolerance[]);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "allergy_intolerance",
          value: newAllergies as AllergyIntolerance[],
        },
      ],
    });
  };

  const handleRemoveAllergy = (index: number) => {
    const newAllergies = allergies.filter((_, i) => i !== index);
    setAllergies(newAllergies);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "allergy_intolerance",
          value: newAllergies,
        },
      ],
    });
  };

  const updateAllergy = (
    index: number,
    updates: Partial<AllergyIntolerance>,
  ) => {
    const newAllergies = allergies.map((allergy, i) =>
      i === index ? { ...allergy, ...updates } : allergy,
    );
    setAllergies(newAllergies);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "allergy_intolerance",
          value: newAllergies,
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {question.text}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <ScribeStructuredInput
        value={allergies}
        onChange={(value) => value && setAllergies(value)}
        name="Allergies"
        prompt={`An array of objects of the following type: {
          code: {
            code: string,
            display: string,
            system: "http://snomed.info/sct"
          },
          clinical_status?: "active" | "inactive" | "resolved",
          category?: "food" | "medication" | "environment" | "biologic",
          criticality?: "low" | "high" | "unable-to-assess",
          verification?: "unconfirmed" | "presumed" | "confirmed" | "refuted" | "entered-in-error"
          last_occurrence?: YYYY-MM-DD string,
          note?: string
        }. Update existing data, delete existing data or append to the existing list as per the will of the user. Current date is ${new Date().toLocaleDateString()}`}
        example={[
          {
            code: {
              code: "842825221000119100",
              display: "Anifrolumab",
              system: "http://snomed.info/sct",
            },
            clinical_status: "inactive",
            category: "environment",
            criticality: "high",
            last_occurrence: "2024-12-11",
            note: "212",
          },
        ]}
        className="rounded-lg border p-4"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Substance</TableHead>
                <TableHead className="w-[150px]">Clinical Status</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
                <TableHead className="w-[150px]">Criticality</TableHead>
                <TableHead className="w-[150px]">Verification</TableHead>
                <TableHead className="w-[150px]">Last Occurrence</TableHead>
                <TableHead className="w-[200px]">Note</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allergies.map((allergy, index) => (
                <TableRow key={index}>
                  <TableCell className="min-w-[200px]">
                    <ValueSetSelect
                      system="system-allergy-code"
                      value={allergy.code}
                      onSelect={(allergy) =>
                        updateAllergy(index, { code: allergy })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={allergy.clinical_status}
                      onValueChange={(value) =>
                        updateAllergy(index, { clinical_status: value })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={allergy.category}
                      onValueChange={(value) =>
                        updateAllergy(index, { category: value })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="environment">Environment</SelectItem>
                        <SelectItem value="biologic">Biologic</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={allergy.criticality}
                      onValueChange={(value) =>
                        updateAllergy(index, { criticality: value })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
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
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={allergy.verification_status}
                      onValueChange={(value) =>
                        updateAllergy(index, {
                          verification_status: value,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                        <SelectItem value="presumed">Presumed</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="refuted">Refuted</SelectItem>
                        <SelectItem value="entered-in-error">
                          Entered in Error
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <input
                      type="date"
                      className="w-full rounded-md border p-2"
                      value={allergy.last_occurrence || ""}
                      onChange={(e) =>
                        updateAllergy(index, {
                          last_occurrence: e.target.value,
                        })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[200px]">
                    <input
                      type="text"
                      className="w-full rounded-md border p-2"
                      placeholder="Note"
                      value={allergy.note || ""}
                      onChange={(e) =>
                        updateAllergy(index, { note: e.target.value })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[50px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveAllergy(index)}
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
          onClick={handleAddAllergy}
          disabled={disabled}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Allergy
        </Button>
      </ScribeStructuredInput>
    </div>
  );
}
