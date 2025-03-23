import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  ACTIVE_DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_CATEGORY,
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
  category: "encounter_diagnosis",
  onset: { onset_datetime: new Date().toISOString().split("T")[0] },
  dirty: true,
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
    category: diagnosis.category,
    note: diagnosis.note,
    encounter: diagnosis.encounter,
    dirty: false,
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
  const [selectedCategory, setSelectedCategory] = useState<
    DiagnosisRequest["category"]
  >("encounter_diagnosis");
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState<Partial<DiagnosisRequest>>({
    ...DIAGNOSIS_INITIAL_VALUE,
    onset: { onset_datetime: new Date().toISOString().split("T")[0] },
  });

  // Sort diagnoses: chronic conditions first, then by date
  const sortedDiagnoses = useMemo(() => {
    const diagnoses =
      (questionnaireResponse.values?.[0]?.value as DiagnosisRequest[]) || [];
    return [...diagnoses].sort((a, b) => {
      // First sort by category (chronic conditions first)
      if (
        a.category === "chronic_condition" &&
        b.category !== "chronic_condition"
      )
        return -1;
      if (
        a.category !== "chronic_condition" &&
        b.category === "chronic_condition"
      )
        return 1;

      // Then sort by date within each category
      const dateA = a.onset?.onset_datetime
        ? new Date(a.onset.onset_datetime)
        : new Date();
      const dateB = b.onset?.onset_datetime
        ? new Date(b.onset.onset_datetime)
        : new Date();
      return dateA.getTime() - dateB.getTime();
    });
  }, [questionnaireResponse.values]);

  const { data: patientDiagnoses } = useQuery({
    queryKey: ["diagnoses", patientId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
        category: "encounter_diagnosis",
        exclude_verification_status: "entered_in_error",
      },
    }),
    enabled: !isPreview,
  });

  const { data: patientChronicConditions } = useQuery({
    queryKey: ["chronic_condition", patientId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        category: "chronic_condition",
        limit: 100,
        clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
        exclude_verification_status: "entered_in_error",
      },
    }),
    enabled: !isPreview,
  });

  useEffect(() => {
    if (patientDiagnoses?.results && patientChronicConditions?.results) {
      updateQuestionnaireResponseCB(
        [
          {
            type: "diagnosis",
            value: [
              ...patientChronicConditions.results,
              ...patientDiagnoses.results,
            ].map(convertToDiagnosisRequest),
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  }, [patientDiagnoses, patientChronicConditions]);

  const handleCodeSelect = (code: Code) => {
    setSelectedCode(code);
    setNewDiagnosis((prev) => ({ ...prev, code }));
    setShowCategorySelection(true);
  };

  const handleCategoryConfirm = () => {
    if (!selectedCode) return;

    const isDuplicate = sortedDiagnoses.some(
      (diagnosis) =>
        diagnosis.code.code === selectedCode.code &&
        diagnosis.verification_status !== "entered_in_error",
    );

    if (isDuplicate) {
      toast.warning(t("diagnosis_already_exist_warning"));
      return;
    }

    const newDiagnoses = [
      ...sortedDiagnoses,
      {
        ...newDiagnosis,
        code: selectedCode,
        category: selectedCategory,
      } as DiagnosisRequest,
    ];
    updateQuestionnaireResponseCB(
      [
        {
          type: "diagnosis",
          value: newDiagnoses,
        },
      ],
      questionnaireResponse.question_id,
    );

    // Reset the selection state
    setSelectedCode(null);
    setShowCategorySelection(false);
    setSelectedCategory("encounter_diagnosis");
    setNewDiagnosis({
      ...DIAGNOSIS_INITIAL_VALUE,
      onset: { onset_datetime: new Date().toISOString().split("T")[0] },
    });
  };

  const handleRemoveDiagnosis = (index: number) => {
    const diagnosis = sortedDiagnoses[index];
    if (diagnosis.id) {
      // For existing records, update verification status to entered_in_error
      const newDiagnoses = sortedDiagnoses.map((d, i) =>
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
      const newDiagnoses = sortedDiagnoses.filter((_, i) => i !== index);
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
    const newDiagnoses = sortedDiagnoses.map((diagnosis, i) =>
      i === index ? { ...diagnosis, ...updates, dirty: true } : diagnosis,
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
    <div className="space-y-4">
      {sortedDiagnoses.length > 0 && (
        <div className="rounded-lg border">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-55">{t("diagnosis")}</TableHead>
                  <TableHead className="w-20 text-center px-0.5">
                    {t("date")}
                  </TableHead>
                  <TableHead className="w-21 text-center px-0.5">
                    {t("status")}
                  </TableHead>
                  <TableHead className="w-21 text-center px-0.5">
                    {t("verification")}
                  </TableHead>
                  <TableHead className="w-9">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDiagnoses.map((diagnosis, index) => (
                  <DiagnosisTableRow
                    key={index}
                    diagnosis={diagnosis}
                    disabled={disabled}
                    onUpdate={(updates) =>
                      handleUpdateDiagnosis(index, updates)
                    }
                    onRemove={() => handleRemoveDiagnosis(index)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden divide-y divide-gray-200">
            {sortedDiagnoses.map((diagnosis, index) => (
              <div
                key={index}
                className={`p-3 space-y-3 ${
                  diagnosis.verification_status === "entered_in_error"
                    ? "opacity-40 pointer-events-none"
                    : diagnosis.clinical_status === "inactive"
                      ? "opacity-60"
                      : diagnosis.clinical_status === "resolved"
                        ? "line-through"
                        : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{diagnosis.code.display}</div>
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
                          handleUpdateDiagnosis(index, {
                            note: diagnosis.note !== undefined ? undefined : "",
                          })
                        }
                      >
                        <Pencil2Icon className="h-4 w-4 mr-2" />
                        {diagnosis.note !== undefined
                          ? t("hide_notes")
                          : t("add_notes")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleRemoveDiagnosis(index)}
                      >
                        <MinusCircledIcon className="h-4 w-4 mr-2" />
                        {t("remove_diagnosis")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">{t("date")}</Label>
                    <Input
                      type="date"
                      value={diagnosis.onset?.onset_datetime || ""}
                      onChange={(e) =>
                        handleUpdateDiagnosis(index, {
                          onset: { onset_datetime: e.target.value },
                        })
                      }
                      disabled={disabled || !!diagnosis.id}
                      className="h-8 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("status")}
                    </Label>
                    <Select
                      value={diagnosis.clinical_status}
                      onValueChange={(value) =>
                        handleUpdateDiagnosis(index, {
                          clinical_status:
                            value as DiagnosisRequest["clinical_status"],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder={t("status")} />
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
                    <Label className="text-xs text-gray-500">
                      {t("verification")}
                    </Label>
                    <Select
                      value={diagnosis.verification_status}
                      onValueChange={(value) =>
                        handleUpdateDiagnosis(index, {
                          verification_status:
                            value as DiagnosisRequest["verification_status"],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder={t("verify")} />
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

                {diagnosis.note !== undefined && (
                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("notes")}
                    </Label>
                    <Input
                      type="text"
                      placeholder={t("add_notes_about_diagnosis")}
                      value={diagnosis.note ?? ""}
                      onChange={(e) =>
                        handleUpdateDiagnosis(index, { note: e.target.value })
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

      {showCategorySelection ? (
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedCode && (
                <Label className="text-sm font-medium">
                  {selectedCode.display}
                </Label>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCategorySelection(false);
                setSelectedCode(null);
                setSelectedCategory("encounter_diagnosis");
                setNewDiagnosis({
                  ...DIAGNOSIS_INITIAL_VALUE,
                  onset: {
                    onset_datetime: new Date().toISOString().split("T")[0],
                  },
                });
              }}
            >
              {t("cancel")}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DIAGNOSIS_CATEGORY.map((category) => (
              <div
                key={category}
                className={cn(
                  "relative flex flex-col p-4 rounded-lg border cursor-pointer transition-colors",
                  selectedCategory === category
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                )}
                onClick={() => setSelectedCategory(category)}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="font-medium">
                      {t(`Diagnosis_${category}__title`)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t(`Diagnosis_${category}__description`)}
                    </div>
                  </div>
                  {selectedCategory === category && (
                    <div className="h-4 w-4 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{t("date")}</Label>
              <Input
                type="date"
                value={newDiagnosis.onset?.onset_datetime || ""}
                onChange={(e) =>
                  setNewDiagnosis((prev) => ({
                    ...prev,
                    onset: { onset_datetime: e.target.value },
                  }))
                }
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t("status")}</Label>
              <Select
                value={newDiagnosis.clinical_status}
                onValueChange={(value) =>
                  setNewDiagnosis((prev) => ({
                    ...prev,
                    clinical_status:
                      value as DiagnosisRequest["clinical_status"],
                  }))
                }
              >
                <SelectTrigger className="h-9">
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
            <div className="space-y-2">
              <Label className="text-sm">{t("verification")}</Label>
              <Select
                value={newDiagnosis.verification_status}
                onValueChange={(value) =>
                  setNewDiagnosis((prev) => ({
                    ...prev,
                    verification_status:
                      value as DiagnosisRequest["verification_status"],
                  }))
                }
              >
                <SelectTrigger className="h-9">
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

          <div className="flex justify-end space-x-2">
            <Button onClick={handleCategoryConfirm}>
              {t("add_diagnosis")}
            </Button>
          </div>
        </div>
      ) : (
        <ValueSetSelect
          system="system-condition-code"
          placeholder={t("search_for_diagnoses_to_add")}
          onSelect={handleCodeSelect}
          disabled={disabled}
        />
      )}
    </div>
  );
}

interface DiagnosisItemProps {
  diagnosis: DiagnosisRequest;
  disabled?: boolean;
  onUpdate?: (diagnosis: Partial<DiagnosisRequest>) => void;
  onRemove?: () => void;
}

const DiagnosisTableRow = ({
  diagnosis,
  disabled,
  onUpdate,
  onRemove,
}: DiagnosisItemProps) => {
  const [showNotes, setShowNotes] = useState(Boolean(diagnosis.note));

  const rowClassName = `group ${
    diagnosis.verification_status === "entered_in_error"
      ? "opacity-40 pointer-events-none"
      : ""
  }`;

  return (
    <>
      <TableRow className={rowClassName}>
        <TableCell className="font-medium py-1 pl-1">
          {diagnosis.code.display}
        </TableCell>
        <TableCell className="py-1 px-1">
          <Input
            type="date"
            value={diagnosis.onset?.onset_datetime || ""}
            onChange={(e) =>
              onUpdate?.({
                onset: { onset_datetime: e.target.value },
              })
            }
            disabled={disabled || !!diagnosis.id}
            className="h-7"
          />
        </TableCell>
        <TableCell className="py-1 px-0.5">
          <Select
            value={diagnosis.clinical_status}
            onValueChange={(value) =>
              onUpdate?.({
                clinical_status: value as DiagnosisRequest["clinical_status"],
              })
            }
            disabled={disabled}
          >
            <SelectTrigger className="h-7 px-1">
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              {DIAGNOSIS_CLINICAL_STATUS.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {t(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="py-1 px-0.5">
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
            <SelectTrigger className="h-7 px-1">
              <SelectValue placeholder={t("verify")} />
            </SelectTrigger>
            <SelectContent>
              {DIAGNOSIS_VERIFICATION_STATUS.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {t(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="py-1 px-0 flex justify-center items-center">
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
                {showNotes ? t("hide_notes") : t("add_notes")}
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onRemove}
              >
                <MinusCircledIcon className="h-4 w-4 mr-2" />
                {t("remove_diagnosis")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {showNotes && (
        <TableRow>
          <TableCell colSpan={5} className="px-4 py-2">
            <Label className="text-xs text-gray-500">{t("notes")}</Label>
            <Input
              type="text"
              placeholder={t("add_notes_about_diagnosis")}
              value={diagnosis.note ?? ""}
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
