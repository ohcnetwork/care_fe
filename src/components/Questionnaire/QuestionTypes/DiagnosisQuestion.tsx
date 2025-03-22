import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

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

import query from "@/Utils/request/query";
import {
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_VERIFICATION_STATUS,
  Diagnosis,
  DiagnosisRequest,
} from "@/types/emr/diagnosis/diagnosis";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";
import { Code } from "@/types/questionnaire/code";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface DiagnosisQuestionProps {
  patientId: string;
  encounterId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
}

const DIAGNOSIS_INITIAL_VALUE: Omit<DiagnosisRequest, "encounter"> = {
  code: { code: "", display: "", system: "" },
  clinical_status: "active",
  verification_status: "confirmed",
  onset: { onset_datetime: new Date().toISOString().split("T")[0] },
};

function convertToDiagnosisRequest(diagnosis: Diagnosis): DiagnosisRequest {
  return {
    id: diagnosis.id,
    code: diagnosis.code,
    clinical_status: diagnosis.clinical_status,
    verification_status: diagnosis.verification_status,
    onset: diagnosis.onset
      ? {
          ...diagnosis.onset,
          onset_datetime: diagnosis.onset.onset_datetime
            ? format(new Date(diagnosis.onset.onset_datetime), "yyyy-MM-dd")
            : "",
        }
      : undefined,
    recorded_date: diagnosis.recorded_date,
    note: diagnosis.note,
    encounter: "", // This will be set when submitting the form
  };
}

export function DiagnosisQuestion({
  patientId,
  encounterId,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: DiagnosisQuestionProps) {
  const isPreview = patientId === "preview";
  const diagnoses =
    (questionnaireResponse.values?.[0]?.value as DiagnosisRequest[]) || [];

  const { data: patientDiagnoses } = useQuery({
    queryKey: ["diagnoses", patientId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
      },
    }),
    enabled: !isPreview,
  });

  useEffect(() => {
    if (patientDiagnoses?.results) {
      updateQuestionnaireResponseCB(
        [
          {
            type: "diagnosis",
            value: patientDiagnoses.results.map(convertToDiagnosisRequest),
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  }, [patientDiagnoses]);

  const handleAddDiagnosis = (code: Code) => {
    const isDuplicate = diagnoses.some(
      (diagnosis) =>
        diagnosis.code.code === code.code &&
        diagnosis.verification_status !== "entered_in_error",
    );

    if (isDuplicate) {
      toast.warning(t("diagnosis_already_exist_warning"));
      return;
    }
    const newDiagnoses = [
      ...diagnoses,
      { ...DIAGNOSIS_INITIAL_VALUE, code },
    ] as DiagnosisRequest[];
    updateQuestionnaireResponseCB(
      [
        {
          type: "diagnosis",
          value: newDiagnoses,
        },
      ],
      questionnaireResponse.question_id,
    );
  };

  const handleRemoveDiagnosis = (index: number) => {
    const diagnosis = diagnoses[index];
    if (diagnosis.id) {
      // For existing records, update verification status to entered_in_error
      const newDiagnoses = diagnoses.map((d, i) =>
        i === index
          ? { ...d, verification_status: "entered_in_error" as const }
          : d,
      ) as DiagnosisRequest[];
      updateQuestionnaireResponseCB(
        [
          {
            type: "diagnosis",
            value: newDiagnoses,
          },
        ],
        questionnaireResponse.question_id,
      );
    } else {
      // For new records, remove them completely
      const newDiagnoses = diagnoses.filter((_, i) => i !== index);
      updateQuestionnaireResponseCB(
        [
          {
            type: "diagnosis",
            value: newDiagnoses,
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  };

  const handleUpdateDiagnosis = (
    index: number,
    updates: Partial<DiagnosisRequest>,
  ) => {
    const newDiagnoses = diagnoses.map((diagnosis, i) =>
      i === index ? { ...diagnosis, ...updates } : diagnosis,
    );
    updateQuestionnaireResponseCB(
      [
        {
          type: "diagnosis",
          value: newDiagnoses,
        },
      ],
      questionnaireResponse.question_id,
    );
  };

  return (
    <div className="space-y-2">
      {diagnoses.length > 0 && (
        <div className="rounded-lg border">
          <div className="hidden md:grid md:grid-cols-12 items-center gap-4 p-3 bg-gray-50 text-sm font-medium text-gray-500">
            <div className="col-span-5">{t("diagnosis")}</div>
            <div className="col-span-2 text-center">{t("date")}</div>
            <div className="col-span-2 text-center">{t("status")}</div>
            <div className="col-span-2 text-center">{t("verification")}</div>
            <div className="col-span-1 text-center">{t("action")}</div>
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
        placeholder={t("search_for_diagnoses_to_add")}
        onSelect={handleAddDiagnosis}
        disabled={disabled}
      />
    </div>
  );
}

interface DiagnosisItemProps {
  diagnosis: DiagnosisRequest;
  disabled?: boolean;
  onUpdate?: (diagnosis: Partial<DiagnosisRequest>) => void;
  onRemove?: () => void;
}

const DiagnosisItem: React.FC<DiagnosisItemProps> = ({
  diagnosis,
  disabled,
  onUpdate,
  onRemove,
}) => {
  const [showNotes, setShowNotes] = useState(Boolean(diagnosis.note));

  return (
    <div
      className={cn("group hover:bg-gray-50", {
        "opacity-40 pointer-events-none":
          diagnosis.verification_status === "entered_in_error",
      })}
    >
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
                  {showNotes ? t("hide_notes") : t("add_notes")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onRemove}
                >
                  <MinusCircledIcon className="h-4 w-4 mr-2" />
                  {t("remove_diagnosis")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:col-span-6 md:grid-cols-3 md:gap-4">
          <div className="col-span-2 md:col-span-1">
            <Label className="text-xs text-gray-500 md:hidden">
              {t("date")}
            </Label>
            <Input
              type="date"
              value={diagnosis.onset?.onset_datetime || ""}
              onChange={(e) =>
                onUpdate?.({
                  onset: { onset_datetime: e.target.value },
                })
              }
              disabled={disabled || !!diagnosis.id}
              className="h-8 md:h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 md:hidden">
              {t("status")}
            </Label>
            <Select
              value={diagnosis.clinical_status}
              onValueChange={(value) =>
                onUpdate?.({
                  clinical_status: value as DiagnosisRequest["clinical_status"],
                })
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-8 md:h-9">
                <SelectValue
                  placeholder={
                    <span className="text-gray-500">
                      {t("diagnosis_status_placeholder")}
                    </span>
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {DIAGNOSIS_CLINICAL_STATUS.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {t(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 md:hidden">
              {t("verification")}
            </Label>
            <Select
              value={diagnosis.verification_status}
              onValueChange={(value) =>
                onUpdate?.({
                  verification_status:
                    value as DiagnosisRequest["verification_status"],
                })
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-8 md:h-9">
                <SelectValue
                  placeholder={
                    <span className="text-gray-500">
                      {t("diagnosis_verification_placeholder")}
                    </span>
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {DIAGNOSIS_VERIFICATION_STATUS.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {t(status)}
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
                {showNotes ? t("hide_notes") : t("add_notes")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onRemove}
              >
                <MinusCircledIcon className="h-4 w-4 mr-2" />
                {t("remove_diagnosis")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showNotes && (
        <div className="px-3 pb-3">
          <Input
            type="text"
            placeholder={t("add_notes_about_diagnosis")}
            value={diagnosis.note || ""}
            onChange={(e) => onUpdate?.({ note: e.target.value })}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};
