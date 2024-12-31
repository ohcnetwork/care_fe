import { MinusCircledIcon, TextAlignLeftIcon } from "@radix-ui/react-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { displayCode } from "@/Utils/utils";
import {
  ALLERGY_INTOLERANCE_CATEGORY,
  ALLERGY_INTOLERANCE_CLINICAL_STATUS,
  ALLERGY_INTOLERANCE_CRITICALITY,
  ALLERGY_INTOLERANCE_VERIFICATION_STATUS,
  AllergyIntolerance,
  AllergyIntoleranceCategory,
  AllergyIntoleranceClinicalStatus,
  AllergyIntoleranceCriticality,
  AllergyIntoleranceVerificationStatus,
} from "@/types/emr/allergyIntolerance";
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface AllergyQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

const ALLERGY_INITIAL_VALUE: Omit<
  AllergyIntolerance,
  "code" | "created_by" | "encounter"
> = {
  clinical_status: "active",
  verification_status: "confirmed",
  criticality: "low",
  category: "food",
  last_occurrence: new Date().toISOString(),
  note: undefined,
};

export function AllergyQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: AllergyQuestionProps) {
  const { t } = useTranslation();

  const [allergies, setAllergies] = useState<AllergyIntolerance[]>(() => {
    return (
      (questionnaireResponse.values?.[0]?.value as AllergyIntolerance[]) || []
    );
  });

  const handleAddAllergy = (code: Code) => {
    const newAllergies = [
      ...allergies,
      { ...ALLERGY_INITIAL_VALUE, code },
    ] as AllergyIntolerance[];
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

  const handleUpdateAllergy = (
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
      {allergies.length > 0 && (
        <div className="rounded-lg border space-y-4">
          <ul className="space-y-2 divide-y-2 divide-gray-200 divide-dashed">
            {allergies.map((allergy, index) => (
              <li key={index}>
                <AllergyItem
                  allergy={allergy}
                  disabled={disabled}
                  onUpdate={(allergy) => handleUpdateAllergy(index, allergy)}
                  onRemove={() => handleRemoveAllergy(index)}
                  index={index}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      <ValueSetSelect
        system="system-condition-code"
        placeholder={t("search_allergy")}
        onSelect={handleAddAllergy}
        disabled={disabled}
      />
    </div>
  );
}

const AllergyItem: React.FC<{
  allergy: AllergyIntolerance;
  disabled?: boolean;
  onUpdate: (allergy: Partial<AllergyIntolerance>) => void;
  onRemove: () => void;
  index: number;
}> = ({ allergy, disabled, onUpdate, onRemove, index }) => {
  const { t } = useTranslation();

  return (
    <div className="p-3 justify-between group focus-within:ring-2 ring-gray-300 rounded-lg space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-base font-semibold">
          {index + 1}. {displayCode(allergy.code)}
        </h4>
        <div className="flex items-center gap-2">
          <div>
            <Label className="sr-only">{t("clinical_status")}</Label>
            <Select
              value={allergy.clinical_status}
              onValueChange={(value: AllergyIntoleranceClinicalStatus) =>
                onUpdate({ clinical_status: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_status")} />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_INTOLERANCE_CLINICAL_STATUS.map((status) => (
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
          <Button
            variant="secondary"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
          >
            <MinusCircledIcon className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 flex flex-col gap-1">
            <Label>{t("verification_status")}</Label>
            <Select
              value={allergy.verification_status}
              onValueChange={(value: AllergyIntoleranceVerificationStatus) =>
                onUpdate({ verification_status: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_status")} />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_INTOLERANCE_VERIFICATION_STATUS.map((status) => (
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
          <div className="flex-1 flex flex-col gap-1">
            <Label>{t("criticality")}</Label>
            <Select
              value={allergy.criticality}
              onValueChange={(value: AllergyIntoleranceCriticality) =>
                onUpdate({ criticality: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_criticality")} />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_INTOLERANCE_CRITICALITY.map((criticality) => (
                  <SelectItem
                    key={criticality}
                    value={criticality}
                    className="capitalize"
                  >
                    {criticality.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 flex flex-col gap-1">
            <Label>{t("category")}</Label>
            <Select
              value={allergy.category}
              onValueChange={(value: AllergyIntoleranceCategory) =>
                onUpdate({ category: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_category")} />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_INTOLERANCE_CATEGORY.map((category) => (
                  <SelectItem
                    key={category}
                    value={category}
                    className="capitalize"
                  >
                    {category.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <Label>{t("last_occurrence")}</Label>
            <DateTimePicker
              value={
                allergy.last_occurrence
                  ? new Date(allergy.last_occurrence)
                  : undefined
              }
              onChange={(value) =>
                onUpdate({ last_occurrence: value?.toISOString() })
              }
              disabled={disabled}
            />
          </div>
        </div>

        {allergy.note !== undefined && (
          <div>
            <Label className="mb-1 block text-sm font-medium">
              {t("additional_information")}
            </Label>
            <Textarea
              placeholder={t("any_additional_information")}
              value={allergy.note}
              onChange={(e) => onUpdate({ note: e.target.value })}
            />
          </div>
        )}

        <div className="flex gap-3 flex-wrap mt-2 max-w-full">
          {allergy.note === undefined && (
            <Button
              onClick={() =>
                onUpdate({
                  note: "",
                })
              }
              variant="secondary"
              className="flex gap-1.5 items-center justify-start"
            >
              <TextAlignLeftIcon className="size-4" />
              {t("Note")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
