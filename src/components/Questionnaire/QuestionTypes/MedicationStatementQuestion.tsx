import { MinusCircledIcon, Pencil2Icon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipComponent } from "@/components/ui/tooltip";

import { NotesInput } from "@/components/Questionnaire/QuestionTypes/NotesInput";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import {
  MEDICATION_STATEMENT_STATUS,
  MedicationStatementInformationSourceType,
  MedicationStatementRequest,
  MedicationStatementStatus,
} from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { ResponseValue } from "@/types/questionnaire/form";
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
      return !!period?.start && !!period?.end;
    },
  },
  REASON: {
    key: "reason",
    required: true,
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

  const medications =
    (questionnaireResponse.values?.[0]
      ?.value as MedicationStatementRequest[]) || [];

  const { data: patientMedications } = useQuery({
    queryKey: ["medication_statements", patientId],
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
    const newMedications: MedicationStatementRequest[] = [
      ...medications,
      { ...MEDICATION_STATEMENT_INITIAL_VALUE, medication },
    ];
    updateQuestionnaireResponseCB(
      [{ type: "medication_statement", value: newMedications }],
      questionnaireResponse.question_id,
    );
    setExpandedMedicationIndex(newMedications.length - 1);
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

  return (
    <div className="space-y-4">
      <AlertDialog
        open={medicationToDelete !== null}
        onOpenChange={(open) => !open && setMedicationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("remove_medication")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove_medication_confirmation", {
                medication:
                  medications[medicationToDelete!]?.medication?.display,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMedication}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {medications.length > 0 && (
        <div className="md:overflow-x-auto w-auto pb-2">
          <div className="min-w-fit">
            <div
              className={cn("max-w-[1600px] relative lg:border rounded-md", {
                "bg-gray-50/50": !desktopLayout,
              })}
            >
              {/* Header - Only show on desktop */}
              <div className="hidden lg:grid grid-cols-[300px,180px,170px,250px,260px,190px,200px,48px] bg-gray-50 border-b text-sm font-medium text-gray-500">
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("medicine")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("source")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("status")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("dosage_instructions")}
                  <span className="text-red-500 ml-0.5">*</span>
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("medication_taken_between")}
                  <span className="text-red-500 ml-0.5">*</span>
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("reason")}
                  <span className="text-red-500 ml-0.5">*</span>
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("notes")}
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
                        className="border-b last:border-b-0"
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2 px-2 py-0.5 rounded-md shadow-sm text-sm",
                            expandedMedicationIndex === index
                              ? "bg-gray-50"
                              : "bg-gray-100",
                          )}
                        >
                          <CollapsibleTrigger className="flex-1 text-left">
                            <div className="font-medium text-gray-900">
                              {medication.medication?.display}
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-1">
                            {expandedMedicationIndex !== index && (
                              <Button
                                aria-label="Expand Medication Statement"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMedicationIndex(index);
                                }}
                                disabled={disabled}
                              >
                                <Pencil2Icon className="h-4 w-4" />
                              </Button>
                            )}
                            <TooltipComponent
                              content={
                                medication.status === "entered_in_error"
                                  ? t("medication_already_marked_as_error")
                                  : t("remove_medication")
                              }
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMedication(index);
                                }}
                                disabled={
                                  disabled ||
                                  medication.status === "entered_in_error"
                                }
                                className="h-8 w-8"
                              >
                                <MinusCircledIcon className="h-4 w-4" />
                              </Button>
                            </TooltipComponent>
                          </div>
                        </div>
                        <CollapsibleContent>
                          <div className="py-4 space-y-4 bg-white mx-2 mb-1">
                            <MedicationStatementGridRow
                              medication={medication}
                              disabled={disabled}
                              onUpdate={(updates) =>
                                handleUpdateMedication(index, updates)
                              }
                              onRemove={() => handleRemoveMedication(index)}
                              index={index}
                              questionId={question.id}
                              errors={errors}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <MedicationStatementGridRow
                        medication={medication}
                        disabled={disabled}
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
      <div className="max-w-4xl">
        <ValueSetSelect
          system="system-medication"
          placeholder={t("search_for_medications_to_add")}
          onSelect={handleAddMedication}
          disabled={disabled}
          searchPostFix=" clinical drug"
        />
      </div>
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
        "grid grid-cols-1 lg:grid-cols-[300px,180px,170px,250px,260px,190px,200px,48px] border-b hover:bg-gray-50/50",
        {
          "opacity-40 pointer-events-none":
            medication.status === "entered_in_error",
        },
      )}
    >
      <div className="lg:p-4 lg:px-2 lg:py-1 flex items-center justify-between lg:justify-start lg:col-span-1 lg:border-r font-medium overflow-hidden text-sm">
        <h4 className="text-base font-semibold break-words line-clamp-2 hidden lg:block">
          {index + 1}. {medication.medication?.display}
        </h4>
      </div>

      {/* Source */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
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
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
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
            {MEDICATION_STATEMENT_STATUS.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`medication_status_${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dosage Instructions */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
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
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("medication_taken_between")}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <div
          className={cn(
            hasError(MEDICATION_STATEMENT_FIELDS.PERIOD.key) &&
              "border border-red-500 rounded-md",
          )}
        >
          <DateRangePicker
            date={{
              from: medication.effective_period?.start
                ? new Date(medication.effective_period?.start)
                : undefined,
              to: medication.effective_period?.end
                ? new Date(medication.effective_period?.end)
                : undefined,
            }}
            onChange={(date) =>
              onUpdate?.({
                effective_period: {
                  start: date?.from?.toISOString(),
                  end: date?.to?.toISOString(),
                },
              })
            }
          />
        </div>
        <FieldError
          fieldKey={MEDICATION_STATEMENT_FIELDS.PERIOD.key}
          questionId={questionId}
          errors={errors}
          index={index}
        />
      </div>

      {/* Reason */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("reason")}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <Input
          maxLength={100}
          placeholder={t("reason_for_medication")}
          value={medication.reason || ""}
          onChange={(e) => onUpdate?.({ reason: e.target.value })}
          disabled={disabled || isReadOnly}
          className={cn(
            "h-9 text-sm",
            hasError(MEDICATION_STATEMENT_FIELDS.REASON.key) &&
              "border-red-500",
          )}
        />
        <FieldError
          fieldKey={MEDICATION_STATEMENT_FIELDS.REASON.key}
          questionId={questionId}
          errors={errors}
          index={index}
        />
      </div>

      {/* Notes */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("notes")}</Label>
        {desktopLayout ? (
          <>
            <Label className="mb-1.5 block text-sm lg:hidden">
              {t("notes")}
            </Label>
            <Input
              value={medication.note || ""}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              placeholder={t("add_notes")}
              disabled={disabled}
              className="h-9 text-sm"
            />
          </>
        ) : (
          <NotesInput
            className="mt-2"
            questionnaireResponse={{
              question_id: "",
              structured_type: "medication_statement",
              link_id: "",
              values: [],
              note: medication.note,
            }}
            handleUpdateNote={(note) => {
              onUpdate?.({ note: note });
            }}
            disabled={disabled}
          />
        )}
      </div>

      {/* Remove Button */}
      <div className="hidden lg:flex lg:px-2 lg:py-1 items-center justify-center sticky right-0 bg-white shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="h-8 w-8"
        >
          <MinusCircledIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
