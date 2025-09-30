import { MinusCircledIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { HistoricalRecordSelector } from "@/components/HistoricalRecordSelector";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";
import { EntitySelectionSheet } from "@/components/Questionnaire/EntitySelectionSheet";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatName } from "@/Utils/utils";
import { Code } from "@/types/base/code/code";
import {
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequestCreate,
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import {
  MEDICATION_STATEMENT_STATUS,
  MedicationStatementInformationSourceType,
  MedicationStatementRead,
  MedicationStatementRequest,
  MedicationStatementStatus,
} from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import {
  FieldDefinitions,
  useFieldError,
  validateFields,
} from "@/types/questionnaire/validation";

import { FieldError } from "./FieldError";

interface MedicationStatementQuestionProps {
  patientId: string;
  encounterId: string;
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  errors: QuestionValidationError[];
}

const MEDICATION_STATEMENT_INITIAL_VALUE: MedicationStatementRequest = {
  status: "active",
  reason: undefined,
  medication: {
    code: "",
    display: "",
    system: "",
  },
  dosage_text: "",
  effective_period: undefined,
  information_source: MedicationStatementInformationSourceType.PATIENT,
  note: undefined,
};

const MEDICATION_STATEMENT_FIELDS: FieldDefinitions = {
  DOSAGE: {
    key: "dosage_text",
    required: true,
  },
  PERIOD: {
    key: "effective_period",
    required: true,
    validate: (value: unknown) => {
      const period = value as { start?: string; end?: string };
      if (!period?.start) {
        throw Error(t("start_date_required"));
      }

      if (period.end) {
        const startDate = new Date(period.start);
        const endDate = new Date(period.end);
        if (endDate < startDate) {
          throw new Error(t("end_date_after_start"));
        }
      }

      return true;
    },
  },
} as const;

export function validateMedicationStatementQuestion(
  values: MedicationStatementRequest[],
  questionId: string,
): QuestionValidationError[] {
  return values.reduce((errors: QuestionValidationError[], value, index) => {
    // Skip validation for medications marked as entered_in_error
    if (value.status === "entered_in_error") return errors;
    return [
      ...errors,
      ...validateFields(value, questionId, MEDICATION_STATEMENT_FIELDS, index),
    ];
  }, []);
}

export function MedicationStatementQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  patientId,
  encounterId,
  question,
  errors,
}: MedicationStatementQuestionProps) {
  const { t } = useTranslation();
  const isPreview = patientId === "preview";
  const desktopLayout = useBreakpoints({ lg: true, default: false });
  const [expandedMedicationIndex, setExpandedMedicationIndex] = useState<
    number | null
  >(null);
  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(
    null,
  );

  const [newMedicationInSheet, setNewMedicationInSheet] =
    useState<MedicationStatementRequest | null>(null);

  const medications =
    (questionnaireResponse.values?.[0]
      ?.value as MedicationStatementRequest[]) || [];

  const { data: patientMedications } = useQuery({
    queryKey: ["medication_statements", patientId, encounterId],
    queryFn: query(medicationStatementApi.list, {
      pathParams: { patientId },
      queryParams: {
        limit: 100,
        encounter: encounterId,
      },
    }),
    enabled: !isPreview,
  });

  useEffect(() => {
    if (patientMedications?.results) {
      updateQuestionnaireResponseCB(
        [{ type: "medication_statement", value: patientMedications.results }],
        questionnaireResponse.question_id,
      );
    }
  }, [patientMedications]);

  const handleAddMedication = (medication: Code) => {
    const newMedication = {
      ...MEDICATION_STATEMENT_INITIAL_VALUE,
      medication,
    };

    if (desktopLayout) {
      addNewMedication(newMedication);
    } else {
      setNewMedicationInSheet(newMedication);
    }
  };

  const addNewMedication = (medication: MedicationStatementRequest) => {
    const newMedications: MedicationStatementRequest[] = [
      ...medications,
      medication,
    ];

    updateQuestionnaireResponseCB(
      [{ type: "medication_statement", value: newMedications }],
      questionnaireResponse.question_id,
    );

    setExpandedMedicationIndex(newMedications.length - 1);
    setNewMedicationInSheet(null);
  };

  const handleConfirmMedication = () => {
    if (!newMedicationInSheet) return;
    addNewMedication(newMedicationInSheet);
  };

  const handleAddHistoricalMedications = (
    selected: (MedicationRequestRead | MedicationStatementRead)[],
  ) => {
    const newMedications = selected.map((record) => {
      if ("dosage_instruction" in record) {
        // Convert MedicationRequest to MedicationStatementRequest
        const request = record as MedicationRequestCreate;
        return {
          ...MEDICATION_STATEMENT_INITIAL_VALUE,
          medication: request.medication,
          note: request.note,
        } as MedicationStatementRequest;
      } else {
        // For MedicationStatementRequest, exclude the id
        const { id: _id, ...statement } = record as MedicationStatementRequest;
        return statement;
      }
    });

    updateQuestionnaireResponseCB(
      [
        {
          type: "medication_statement",
          value: [...medications, ...newMedications],
        },
      ],
      questionnaireResponse.question_id,
    );
    setExpandedMedicationIndex(medications.length);
  };

  const handleRemoveMedication = (index: number) => {
    setMedicationToDelete(index);
  };

  const confirmRemoveMedication = () => {
    if (medicationToDelete === null) return;

    const medication = medications[medicationToDelete];
    if (medication.id) {
      // For existing records, update status to entered_in_error
      const newMedications = medications.map((med, i) =>
        i === medicationToDelete
          ? { ...med, status: "entered_in_error" as const }
          : med,
      );
      updateQuestionnaireResponseCB(
        [{ type: "medication_statement", value: newMedications }],
        questionnaireResponse.question_id,
      );
    } else {
      // For new records, remove them completely
      const newMedications = medications.filter(
        (_, i) => i !== medicationToDelete,
      );
      updateQuestionnaireResponseCB(
        [{ type: "medication_statement", value: newMedications }],
        questionnaireResponse.question_id,
      );
    }
    setMedicationToDelete(null);
  };

  const handleUpdateMedication = (
    index: number,
    updates: Partial<MedicationStatementRequest>,
  ) => {
    const newMedications = medications.map((medication, i) =>
      i === index ? { ...medication, ...updates } : medication,
    );

    updateQuestionnaireResponseCB(
      [{ type: "medication_statement", value: newMedications }],
      questionnaireResponse.question_id,
    );
  };

  const addMedicationPlaceholder = t("add_medication", {
    count: medications.length + 1,
  });

  return (
    <div
      className={cn(
        "space-y-4",
        medications.length > 0 ? "md:max-w-fit" : "max-w-4xl",
      )}
    >
      <ConfirmActionDialog
        open={medicationToDelete !== null}
        onOpenChange={(open) => !open && setMedicationToDelete(null)}
        title={t("remove_medication")}
        description={t("remove_medication_confirmation", {
          medication: medications[medicationToDelete!]?.medication?.display,
        })}
        onConfirm={confirmRemoveMedication}
        confirmText={t("remove")}
        variant="destructive"
      />

      <HistoricalRecordSelector<MedicationRequestRead | MedicationStatementRead>
        title={t("medication_history")}
        structuredTypes={[
          {
            type: t("past_prescriptions"),
            displayFields: [
              {
                key: "requested_product,code",
                label: t("medicine"),
                render: (med) => displayMedicationName(med),
              },
              {
                key: "dosage_instruction",
                label: t("dosage"),
                render: (instructions) => {
                  const dosage = formatDosage(instructions[0]) || "";

                  const frequency =
                    getFrequencyDisplay(instructions[0]?.timing)?.meaning || "";

                  const duration = instructions?.[0]?.timing?.repeat
                    ?.bounds_duration
                    ? `${instructions[0].timing.repeat.bounds_duration.value} ${instructions[0].timing.repeat.bounds_duration.unit}`
                    : "";

                  return `${dosage}\n${frequency}\n${duration}`;
                },
              },
              {
                key: "dosage_instruction",
                label: t("frequency"),
                render: (instructions) => {
                  const timing = instructions?.[0]?.timing;
                  const option = reverseFrequencyOption(timing);
                  return option
                    ? MEDICATION_REQUEST_TIMING_OPTIONS[option].display
                    : "";
                },
              },
              {
                key: "dosage_instruction",
                label: t("instructions"),
                render: (instructions) =>
                  instructions?.[0]?.additional_instruction?.[0]?.display,
              },
              {
                key: "note",
                label: t("notes"),
                render: (note) => note || "-",
              },
              {
                key: "created_by",
                label: t("prescribed_by"),
                render: (created_by) => formatName(created_by),
              },
            ],
            queryKey: ["medication_requests", patientId],
            queryFn: async (limit: number, offset: number) => {
              const response = await query(medicationRequestApi.list, {
                pathParams: { patientId },
                queryParams: {
                  limit,
                  offset,
                  status:
                    "active,on_hold,draft,unknown,ended,completed,cancelled",
                  ordering: "-created_date",
                },
              })({ signal: new AbortController().signal });
              return response as PaginatedResponse<MedicationRequestRead>;
            },
          },
          {
            type: t("medication_statements"),
            displayFields: [
              {
                key: "medication",
                label: t("medicine"),
                render: (med) => med?.display,
              },
              {
                key: "dosage_text",
                label: t("dosage"),
                render: (dosage) => dosage,
              },
              {
                key: "status",
                label: t("status"),
                render: (status) => t(status),
              },
              {
                key: "note",
                label: t("notes"),
                render: (note) => note || "-",
              },
              {
                key: "created_by",
                label: t("prescribed_by"),
                render: (created_by) => formatName(created_by),
              },
            ],
            queryKey: ["medication_statements", patientId],
            queryFn: async (limit: number, offset: number) => {
              const response = await query(medicationStatementApi.list, {
                pathParams: { patientId },
                queryParams: {
                  limit,
                  offset,
                  status:
                    "active,on_hold,completed,stopped,unknown,not_taken,intended",
                  ordering: "-created_date",
                },
              })({ signal: new AbortController().signal });
              return response as PaginatedResponse<MedicationStatementRead>;
            },
          },
        ]}
        buttonLabel={t("medication_history")}
        onAddSelected={handleAddHistoricalMedications}
      />

      {medications.length > 0 && (
        <div className="md:overflow-x-auto w-auto">
          <div className="min-w-fit">
            <div
              className={cn(
                "max-w-[2000px] relative lg:border border-gray-200 rounded-md",
                {
                  "bg-gray-50/50": !desktopLayout,
                },
              )}
            >
              {/* Header - Only show on desktop */}
              <div className="hidden lg:grid grid-cols-[300px_180px_170px_250px_450px_190px_300px_48px] bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("medicine")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("source")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("status")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("dosage_instructions")}
                  <span className="text-red-500 ml-0.5">*</span>
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("medication_taken_between")}
                  <span className="text-red-500 ml-0.5">*</span>
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("reason")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("note")}
                </div>
                <div className="font-semibold text-gray-600 p-3 sticky right-0 bg-gray-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12" />
              </div>

              {/* Body */}
              <div
                className={cn("bg-white", {
                  "bg-transparent": !desktopLayout,
                })}
              >
                {medications.map((medication, index) => (
                  <React.Fragment key={index}>
                    {!desktopLayout ? (
                      <Collapsible
                        open={expandedMedicationIndex === index}
                        onOpenChange={() => {
                          setExpandedMedicationIndex(
                            expandedMedicationIndex === index ? null : index,
                          );
                        }}
                        className="mb-2"
                      >
                        <Card
                          className={cn("rounded-lg", {
                            "border border-primary-500":
                              expandedMedicationIndex === index,
                            "border-0 shadow-none":
                              expandedMedicationIndex !== index,
                          })}
                        >
                          <CollapsibleTrigger asChild>
                            <CardHeader
                              className={cn(
                                "p-2 rounded-lg shadow-none bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors",
                                {
                                  "bg-gray-200 border border-gray-300":
                                    expandedMedicationIndex !== index,
                                  "opacity-40":
                                    medication.status === "entered_in_error",
                                },
                              )}
                            >
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0 mr-2">
                                    <CardTitle
                                      className="text-base text-gray-950 break-words"
                                      title={medication.medication?.display}
                                    >
                                      {medication.medication?.display}
                                    </CardTitle>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {expandedMedicationIndex === index && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={
                                          disabled ||
                                          medication.status ===
                                            "entered_in_error"
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveMedication(index);
                                        }}
                                        className="size-10 p-4 border border-gray-400 bg-white shadow text-destructive"
                                      >
                                        <MinusCircledIcon className="size-5" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-10 border border-gray-400 bg-white shadow p-4 pointer-events-none"
                                    >
                                      {expandedMedicationIndex === index ? (
                                        <ChevronsDownUp className="size-5" />
                                      ) : (
                                        <ChevronsUpDown className="size-5" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                {expandedMedicationIndex !== index && (
                                  <div className="text-sm mt-1 text-gray-600">
                                    <span>
                                      {t(
                                        `medication_status__${medication.status}`,
                                      )}
                                      {" · "}
                                    </span>
                                    {medication.effective_period?.start ? (
                                      <span>
                                        {format(
                                          new Date(
                                            medication.effective_period.start,
                                          ),
                                          "d MMM, yyyy",
                                        )}
                                        {" - "}
                                        {medication.effective_period?.end
                                          ? format(
                                              new Date(
                                                medication.effective_period.end,
                                              ),
                                              "d MMM, yyyy",
                                            )
                                          : t("ongoing")}
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="p-2 pt-2 space-y-3 rounded-lg bg-gray-50">
                              <MedicationStatementGridRow
                                medication={medication}
                                disabled={
                                  disabled ||
                                  patientMedications?.results[index]?.status ===
                                    "entered_in_error"
                                }
                                onUpdate={(updates) =>
                                  handleUpdateMedication(index, updates)
                                }
                                onRemove={() => handleRemoveMedication(index)}
                                index={index}
                                questionId={question.id}
                                errors={errors}
                              />
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ) : (
                      <MedicationStatementGridRow
                        medication={medication}
                        disabled={
                          disabled ||
                          patientMedications?.results[index]?.status ===
                            "entered_in_error"
                        }
                        onUpdate={(updates) =>
                          handleUpdateMedication(index, updates)
                        }
                        onRemove={() => handleRemoveMedication(index)}
                        index={index}
                        questionId={question.id}
                        errors={errors}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {desktopLayout ? (
        <div className="max-w-4xl">
          <ValueSetSelect
            system="system-medication"
            placeholder={addMedicationPlaceholder}
            onSelect={handleAddMedication}
            disabled={disabled}
            searchPostFix=" clinical drug"
          />
        </div>
      ) : (
        <EntitySelectionSheet
          open={!!newMedicationInSheet}
          onOpenChange={(open) => {
            if (!open) {
              setNewMedicationInSheet(null);
            }
          }}
          system="system-medication"
          entityType="medication"
          searchPostFix=" clinical drug"
          disabled={disabled}
          onEntitySelected={handleAddMedication}
          onConfirm={handleConfirmMedication}
          placeholder={addMedicationPlaceholder}
        >
          <div className="space-y-4 p-3">
            {newMedicationInSheet && (
              <MedicationStatementGridRow
                medication={newMedicationInSheet}
                disabled={disabled}
                onUpdate={(updates) => {
                  setNewMedicationInSheet((prev) =>
                    prev
                      ? {
                          ...prev,
                          ...updates,
                        }
                      : null,
                  );
                }}
                onRemove={() => {}}
                index={-1}
                questionId={question.id}
                errors={errors}
              />
            )}
          </div>
        </EntitySelectionSheet>
      )}
    </div>
  );
}

interface MedicationStatementGridRowProps {
  medication: MedicationStatementRequest;
  disabled?: boolean;
  onUpdate?: (medication: Partial<MedicationStatementRequest>) => void;
  onRemove?: () => void;
  index: number;
  questionId: string;
  errors?: QuestionValidationError[];
}

const MedicationStatementGridRow: React.FC<MedicationStatementGridRowProps> = ({
  medication,
  disabled,
  onUpdate,
  onRemove,
  index,
  questionId,
  errors,
}) => {
  const { t } = useTranslation();
  const desktopLayout = useBreakpoints({ lg: true, default: false });
  const isReadOnly = !!medication.id;
  const { hasError } = useFieldError(questionId, errors, index);

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-[300px_180px_170px_250px_450px_190px_300px_48px] border-b border-gray-200 hover:bg-gray-50/50 space-y-3 lg:space-y-0",
        {
          "opacity-40 pointer-events-none": disabled,
        },
      )}
    >
      {desktopLayout && (
        <div className="lg:p-4 lg:px-2 lg:py-1 flex items-center justify-between lg:justify-start lg:col-span-1 lg:border-r border-gray-200 font-medium overflow-hidden text-sm">
          <h4 className="text-base font-semibold break-words line-clamp-2">
            {index + 1}. {medication.medication?.display}
          </h4>
        </div>
      )}

      {/* Source */}
      <div className="lg:px-2 lg:py-1 px-1 py-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("source")}</Label>
        <Select
          value={medication.information_source}
          onValueChange={(value: MedicationStatementInformationSourceType) =>
            onUpdate?.({ information_source: value })
          }
          disabled={disabled || isReadOnly}
        >
          <SelectTrigger className="h-9 text-sm capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  value: MedicationStatementInformationSourceType.PATIENT,
                  icon: "l-user",
                },
                {
                  value: MedicationStatementInformationSourceType.PRACTITIONER,
                  icon: "l-user-nurse",
                },
                {
                  value:
                    MedicationStatementInformationSourceType.RELATED_PERSON,
                  icon: "l-users-alt",
                },
              ] as {
                value: MedicationStatementInformationSourceType;
                icon: IconName;
              }[]
            ).map((source) => (
              <SelectItem
                key={source.value}
                value={source.value}
                className="capitalize"
              >
                <CareIcon icon={source.icon} className="mr-2" />
                {t(`${source.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="lg:px-2 lg:py-1 px-1 py-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("status")}</Label>
        <Select
          value={medication.status}
          onValueChange={(value: MedicationStatementStatus) =>
            onUpdate?.({ status: value })
          }
          disabled={disabled}
        >
          <SelectTrigger className="h-9 text-sm capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEDICATION_STATEMENT_STATUS.map(
              (status) =>
                (medication.id || status !== "entered_in_error") && (
                  <SelectItem key={status} value={status}>
                    {t(`medication_status__${status}`)}
                  </SelectItem>
                ),
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Dosage Instructions */}
      <div className="lg:px-2 lg:py-1 px-1 py-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("dosage_instructions")}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <Input
          value={medication.dosage_text || ""}
          onChange={(e) => onUpdate?.({ dosage_text: e.target.value })}
          placeholder={t("enter_dosage_instructions")}
          disabled={disabled || isReadOnly}
          className={cn(
            "h-9 text-sm",
            hasError(MEDICATION_STATEMENT_FIELDS.DOSAGE.key) &&
              "border-red-500",
          )}
        />
        <FieldError
          fieldKey={MEDICATION_STATEMENT_FIELDS.DOSAGE.key}
          questionId={questionId}
          errors={errors}
          index={index}
        />
      </div>

      {/* Period */}
      <div className="lg:px-2 lg:py-1 px-2 py-1 lg:border-r border-gray-200 overflow-hidden bg-gray-100 rounded-md lg:bg-transparent lg:rounded-none lg:p-0">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("medication_taken_between")}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <div
          className={cn(
            "flex sm:flex-row flex-col gap-2 w-full justify-between",
            hasError(MEDICATION_STATEMENT_FIELDS.PERIOD.key) &&
              "border border-red-500 rounded-md p-2",
          )}
        >
          <div className="w-full sm:w-1/2">
            <Label className="text-xs text-gray-500 mb-1 block lg:hidden">
              {t("start_date")}
            </Label>
            <CombinedDatePicker
              value={
                medication.effective_period?.start
                  ? new Date(medication.effective_period?.start)
                  : undefined
              }
              onChange={(date) =>
                onUpdate?.({
                  effective_period: {
                    ...medication.effective_period,
                    start: date?.toISOString(),
                  },
                })
              }
              buttonClassName="h-9 w-full"
              disabled={disabled || isReadOnly}
            />
          </div>
          <div className="w-full sm:w-1/2">
            <Label className="text-xs text-gray-500 mb-1 block lg:hidden">
              {t("end_date")}
            </Label>
            <CombinedDatePicker
              value={
                medication.effective_period?.end
                  ? new Date(medication.effective_period?.end)
                  : undefined
              }
              onChange={(date) =>
                onUpdate?.({
                  effective_period: {
                    ...medication.effective_period,
                    end: date?.toISOString(),
                  },
                })
              }
              buttonClassName="h-9 w-full"
              disabled={disabled || isReadOnly}
            />
          </div>
        </div>
        <FieldError
          fieldKey={MEDICATION_STATEMENT_FIELDS.PERIOD.key}
          questionId={questionId}
          errors={errors}
          index={index}
        />
      </div>

      {/* Reason */}
      <div className="lg:px-2 lg:py-1 px-1 py-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("reason")}</Label>
        <Input
          maxLength={100}
          placeholder={t("reason_for_medication")}
          value={medication.reason || ""}
          onChange={(e) => onUpdate?.({ reason: e.target.value })}
          disabled={disabled || isReadOnly}
          className="h-9 text-sm"
        />
      </div>

      {/* Notes */}
      <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("note")}</Label>
        <Input
          value={medication.note || ""}
          onChange={(e) => onUpdate?.({ note: e.target.value })}
          placeholder={t("additional_notes")}
          disabled={disabled}
          className="h-9 text-sm"
        />
      </div>

      {/* Remove Button */}
      {desktopLayout && (
        <div className="hidden lg:flex lg:px-2 lg:py-1 items-center justify-center sticky right-0 bg-white shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
            className="size-8"
          >
            <MinusCircledIcon className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Helper function to find the frequency option from timing
const reverseFrequencyOption = (
  timing?: MedicationRequestCreate["dosage_instruction"][0]["timing"],
) => {
  if (!timing?.code?.code) return undefined;
  return Object.entries(MEDICATION_REQUEST_TIMING_OPTIONS).find(
    ([_, option]) => option.timing.code?.code === timing.code?.code,
  )?.[0];
};
