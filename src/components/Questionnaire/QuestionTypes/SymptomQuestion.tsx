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
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import {
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
  SYMPTOM_VERIFICATION_STATUS,
  Symptom,
  SymptomClinicalStatus,
  SymptomSeverity,
  SymptomVerificationStatus,
} from "@/types/questionnaire/symptom";

interface SymptomQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

const SYMPTOM_INITIAL_VALUE: Omit<
  Symptom,
  "code" | "created_by" | "updated_by"
> = {
  clinical_status: "active",
  verification_status: "confirmed",
  severity: "mild",
  onset: {
    onset_datetime: new Date().toISOString(),
  },
  note: undefined,
};

export function SymptomQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: SymptomQuestionProps) {
  const { t } = useTranslation();

  const [symptoms, setSymptoms] = useState<Symptom[]>(() => {
    return (questionnaireResponse.values?.[0]?.value as Symptom[]) || [];
  });

  const handleAddSymptom = (code: Code) => {
    const newSymptoms = [
      ...symptoms,
      { ...SYMPTOM_INITIAL_VALUE, code },
    ] as Symptom[];
    setSymptoms(newSymptoms);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "symptom",
          value: newSymptoms,
        },
      ],
    });
  };

  const handleRemoveSymptom = (index: number) => {
    const newSymptoms = symptoms.filter((_, i) => i !== index);
    setSymptoms(newSymptoms);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "symptom",
          value: newSymptoms,
        },
      ],
    });
  };

  const handleUpdateSymptom = (index: number, updates: Partial<Symptom>) => {
    const newSymptoms = symptoms.map((symptom, i) =>
      i === index ? { ...symptom, ...updates } : symptom,
    );
    setSymptoms(newSymptoms);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "symptom",
          value: newSymptoms,
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
      {symptoms.length > 0 && (
        <div className="rounded-lg border space-y-4">
          <ul className="space-y-2 divide-y-2 divide-gray-200 divide-dashed">
            {symptoms.map((symptom, index) => (
              <li key={index}>
                <SymptomItem
                  symptom={symptom}
                  disabled={disabled}
                  onUpdate={(symptom) => handleUpdateSymptom(index, symptom)}
                  onRemove={() => handleRemoveSymptom(index)}
                  index={index}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      <ValueSetSelect
        system="system-condition-code"
        placeholder={t("search_symptom")}
        onSelect={handleAddSymptom}
        disabled={disabled}
      />
    </div>
  );
}

const SymptomItem: React.FC<{
  symptom: Symptom;
  disabled?: boolean;
  onUpdate: (symptom: Partial<Symptom>) => void;
  onRemove: () => void;
  index: number;
}> = ({ symptom, disabled, onUpdate, onRemove, index }) => {
  const { t } = useTranslation();

  return (
    <div className="p-3 justify-between group focus-within:ring-2 ring-gray-300 rounded-lg space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-base font-semibold">
          {index + 1}. {displayCode(symptom.code)}
        </h4>
        <div className="flex items-center gap-2">
          <div>
            <Label className="sr-only">{t("clinical_status")}</Label>
            <Select
              value={symptom.clinical_status}
              onValueChange={(value: SymptomClinicalStatus) =>
                onUpdate({ clinical_status: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_status")} />
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
              value={symptom.verification_status}
              onValueChange={(value: SymptomVerificationStatus) =>
                onUpdate({ verification_status: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_status")} />
              </SelectTrigger>
              <SelectContent>
                {SYMPTOM_VERIFICATION_STATUS.map((status) => (
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
            <Label>{t("severity")}</Label>
            <Select
              value={symptom.severity}
              onValueChange={(value: SymptomSeverity) =>
                onUpdate({ severity: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_severity")} />
              </SelectTrigger>
              <SelectContent>
                {SYMPTOM_SEVERITY.map((severity) => (
                  <SelectItem
                    key={severity}
                    value={severity}
                    className="capitalize"
                  >
                    {severity.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <Label>{t("onset_datetime")}</Label>
          <DateTimePicker
            value={
              symptom.onset?.onset_datetime
                ? new Date(symptom.onset.onset_datetime)
                : undefined
            }
            onChange={(value) =>
              onUpdate({ onset: { onset_datetime: value?.toISOString() } })
            }
            disabled={disabled}
          />
        </div>

        {symptom.note !== undefined && (
          <div>
            <Label className="mb-1 block text-sm font-medium">
              {t("additional_information")}
            </Label>
            <Textarea
              placeholder={t("any_additional_information")}
              value={symptom.note}
              onChange={(e) => onUpdate({ note: e.target.value })}
            />
          </div>
        )}

        <div className="flex gap-3 flex-wrap mt-2 max-w-full">
          {symptom.note === undefined && (
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
