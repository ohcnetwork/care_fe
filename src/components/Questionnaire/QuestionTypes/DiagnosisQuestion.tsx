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
import {
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_VERIFICATION_STATUS,
  Diagnosis,
  DiagnosisClinicalStatus,
  DiagnosisVerificationStatus,
} from "@/types/questionnaire/diagnosis";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface DiagnosisQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

const DIAGNOSIS_INITIAL_VALUE: Omit<
  Diagnosis,
  "code" | "created_by" | "updated_by"
> = {
  clinical_status: "active",
  verification_status: "confirmed",
  onset: {
    onset_datetime: new Date().toISOString(),
  },
  note: undefined,
};

export function DiagnosisQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: DiagnosisQuestionProps) {
  const { t } = useTranslation();

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(() => {
    return (questionnaireResponse.values?.[0]?.value as Diagnosis[]) || [];
  });

  const handleAddDiagnosis = (code: Code) => {
    const newDiagnoses = [
      ...diagnoses,
      { ...DIAGNOSIS_INITIAL_VALUE, code },
    ] as Diagnosis[];
    setDiagnoses(newDiagnoses);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "diagnosis",
          value: newDiagnoses,
        },
      ],
    });
  };

  const handleRemoveDiagnosis = (index: number) => {
    const newDiagnoses = diagnoses.filter((_, i) => i !== index);
    setDiagnoses(newDiagnoses);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "diagnosis",
          value: newDiagnoses,
        },
      ],
    });
  };

  const handleUpdateDiagnosis = (
    index: number,
    updates: Partial<Diagnosis>,
  ) => {
    const newDiagnoses = diagnoses.map((diagnosis, i) =>
      i === index ? { ...diagnosis, ...updates } : diagnosis,
    );
    setDiagnoses(newDiagnoses);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "diagnosis",
          value: newDiagnoses,
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
      {diagnoses.length > 0 && (
        <div className="rounded-lg border space-y-4">
          <ul className="space-y-2 divide-y-2 divide-gray-200 divide-dashed">
            {diagnoses.map((diagnosis, index) => (
              <li key={index}>
                <DiagnosisItem
                  diagnosis={diagnosis}
                  disabled={disabled}
                  onUpdate={(diagnosis) =>
                    handleUpdateDiagnosis(index, diagnosis)
                  }
                  onRemove={() => handleRemoveDiagnosis(index)}
                  index={index}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      <ValueSetSelect
        system="system-condition-code"
        placeholder={t("search_diagnosis")}
        onSelect={handleAddDiagnosis}
        disabled={disabled}
      />
    </div>
  );
}

const DiagnosisItem: React.FC<{
  diagnosis: Diagnosis;
  disabled?: boolean;
  onUpdate: (diagnosis: Partial<Diagnosis>) => void;
  onRemove: () => void;
  index: number;
}> = ({ diagnosis, disabled, onUpdate, onRemove, index }) => {
  const { t } = useTranslation();

  return (
    <div className="p-3 justify-between group focus-within:ring-2 ring-gray-300 rounded-lg space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-base font-semibold">
          {index + 1}. {displayCode(diagnosis.code)}
        </h4>
        <div className="flex items-center gap-2">
          <div>
            <Label className="sr-only">{t("clinical_status")}</Label>
            <Select
              value={diagnosis.clinical_status}
              onValueChange={(value: DiagnosisClinicalStatus) =>
                onUpdate({ clinical_status: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_status")} />
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
        <div className="flex-1 flex flex-col gap-1">
          <Label>{t("verification_status")}</Label>
          <Select
            value={diagnosis.verification_status}
            onValueChange={(value: DiagnosisVerificationStatus) =>
              onUpdate({ verification_status: value })
            }
            disabled={disabled}
          >
            <SelectTrigger className="capitalize">
              <SelectValue placeholder={t("select_status")} />
            </SelectTrigger>
            <SelectContent>
              {DIAGNOSIS_VERIFICATION_STATUS.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <Label>{t("onset_datetime")}</Label>
          <DateTimePicker
            value={
              diagnosis.onset?.onset_datetime
                ? new Date(diagnosis.onset.onset_datetime)
                : undefined
            }
            onChange={(value) =>
              onUpdate({ onset: { onset_datetime: value?.toISOString() } })
            }
            disabled={disabled}
          />
        </div>

        {diagnosis.note !== undefined && (
          <div>
            <Label className="mb-1 block text-sm font-medium">
              {t("additional_information")}
            </Label>
            <Textarea
              placeholder={t("any_additional_information")}
              value={diagnosis.note}
              onChange={(e) => onUpdate({ note: e.target.value })}
            />
          </div>
        )}

        <div className="flex gap-3 flex-wrap mt-2 max-w-full">
          {diagnosis.note === undefined && (
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
