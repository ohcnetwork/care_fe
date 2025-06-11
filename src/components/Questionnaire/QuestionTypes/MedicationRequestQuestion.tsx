import { MinusCircledIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ComboboxQuantityInput } from "@/components/Common/ComboboxQuantityInput";
import { DateTimeInput } from "@/components/Common/DateTimeInput";
import { HistoricalRecordSelector } from "@/components/HistoricalRecordSelector";
import InstructionsPopover from "@/components/Medicine/InstructionsPopover";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";
import { EntitySelectionSheet } from "@/components/Questionnaire/EntitySelectionSheet";
import MedicationValueSetSelect from "@/components/Questionnaire/MedicationValueSetSelect";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { Code } from "@/types/base/code/code";
import {
  DoseRange,
  INACTIVE_MEDICATION_STATUSES,
  MEDICATION_REQUEST_INTENT,
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequest,
  MedicationRequestDosageInstruction,
  MedicationRequestIntent,
  MedicationRequestRead,
  UCUM_TIME_UNITS,
  displayMedicationName,
  parseMedicationStringToRequest,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { MedicationStatementRead } from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { useFieldError } from "@/types/questionnaire/validation";
import { validateFields } from "@/types/questionnaire/validation";

function formatDoseRange(range?: DoseRange): string {
  if (!range?.high?.value) return "";

  const formatValue = (value: number) =>
    value.toString().includes(".") ? value.toFixed(2) : value.toString();

  return `${formatValue(range.low?.value)} → ${formatValue(range.high?.value)} ${range.high?.unit?.display}`;
}

interface MedicationRequestQuestionProps {
  patientId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  encounterId: string;
  errors?: QuestionValidationError[];
}

const MEDICATION_REQUEST_FIELDS = {
  DOSAGE: {
    key: "dosage_instruction.dose",
    required: true,
    validate: (value: unknown) => {
      const dosageInstruction =
        value as MedicationRequest["dosage_instruction"][0];
      return !!(
        dosageInstruction?.dose_and_rate?.dose_quantity ||
        dosageInstruction?.dose_and_rate?.dose_range
      );
    },
  },
  FREQUENCY: {
    key: "dosage_instruction.frequency",
    required: true,
    validate: (value: unknown) => {
      const dosageInstruction =
        value as MedicationRequest["dosage_instruction"][0];
      return !!(
        dosageInstruction?.timing || dosageInstruction?.as_needed_boolean
      );
    },
  },
  DURATION: {
    key: "dosage_instruction.duration",
    required: false,
    validate: (value: unknown) => {
      const dosageInstruction =
        value as MedicationRequest["dosage_instruction"][0];
      if (dosageInstruction?.timing) {
        const duration = dosageInstruction.timing.repeat.bounds_duration;
        return !!(duration?.value && duration?.unit);
      }
      return true;
    },
  },
} as const;

export function validateMedicationRequestQuestion(
  values: MedicationRequest[],
  questionId: string,
): QuestionValidationError[] {
  return values.reduce((errors: QuestionValidationError[], value, index) => {
    // Skip validation for medications marked as entered_in_error
    if (value.status === "entered_in_error") return errors;

    // Validate each dosage instruction
    const dosageInstruction = value.dosage_instruction[0];
    if (!dosageInstruction) {
      return [
        ...errors,
        {
          question_id: questionId,
          error: t("field_required"),
          type: "validation_error",
          field_key: "dosage_instruction",
          index,
        },
      ];
    }

    // Validate using the fields
    const fieldErrors = validateFields(
      {
        [MEDICATION_REQUEST_FIELDS.DOSAGE.key]: dosageInstruction,
        [MEDICATION_REQUEST_FIELDS.FREQUENCY.key]: dosageInstruction,
        [MEDICATION_REQUEST_FIELDS.DURATION.key]: dosageInstruction,
      },
      questionId,
      MEDICATION_REQUEST_FIELDS,
      index,
    );

    // Map error messages to be more specific
    return [
      ...errors,
      ...fieldErrors.map((error) => ({
        ...error,
        error: (["DOSAGE", "FREQUENCY", "DURATION"] as const).some(
          (attr) => MEDICATION_REQUEST_FIELDS[attr].key === error.field_key,
        )
          ? t("field_required")
          : error.error,
      })),
    ];
  }, []);
}

export function MedicationRequestQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  patientId,
  encounterId,
  errors,
}: MedicationRequestQuestionProps) {
  const { t } = useTranslation();

  const isPreview = patientId === "preview";
  const medications =
    (questionnaireResponse.values?.[0]?.value as MedicationRequest[]) || [];

  const { data: patientMedications } = useQuery({
    queryKey: ["medication_requests", patientId, encounterId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
      },
    }),
    enabled: !isPreview,
  });

  useEffect(() => {
    if (patientMedications?.results) {
      updateQuestionnaireResponseCB(
        [
          {
            type: "medication_request",
            value: patientMedications.results.map((medication) => ({
              ...medication,
              requested_product_internal: medication.requested_product,
              requested_product: medication.requested_product?.id,
            })),
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  }, [patientMedications]);

  const [expandedMedicationIndex, setExpandedMedicationIndex] = useState<
    number | null
  >(null);

  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(
    null,
  );
  const desktopLayout = useBreakpoints({ lg: true, default: false });

  const [newMedicationInSheet, setNewMedicationInSheet] =
    useState<MedicationRequest | null>(null);

  const handleAddMedication = (medication: Code) => {
    const initialDetails = {
      ...parseMedicationStringToRequest(medication),
      authored_on: new Date().toISOString(),
    };

    if (desktopLayout) {
      addNewMedication(initialDetails);
    } else {
      setNewMedicationInSheet(initialDetails);
    }
  };

  const handleAddProductMedication = (
    productKnowledge: ProductKnowledgeBase,
  ) => {
    const initialDetails = {
      ...parseMedicationStringToRequest(undefined, productKnowledge),
    };

    if (desktopLayout) {
      addNewMedication(initialDetails);
    } else {
      setNewMedicationInSheet(initialDetails);
    }
  };

  const addNewMedication = (medication: MedicationRequest) => {
    const newMedications: MedicationRequest[] = [...medications, medication];

    updateQuestionnaireResponseCB(
      [{ type: "medication_request", value: newMedications }],
      questionnaireResponse.question_id,
    );

    setExpandedMedicationIndex(newMedications.length - 1);
    setNewMedicationInSheet(null);
  };

  const handleConfirmMedicationInSheet = () => {
    if (!newMedicationInSheet) return;
    addNewMedication(newMedicationInSheet);
  };

  const handleAddHistoricalMedications = (
    selected: (MedicationRequestRead | MedicationStatementRead)[],
  ) => {
    // Filter and convert MedicationStatement to MedicationRequest if needed
    const medicationRequests = selected.map((record) => {
      if ("dosage_instruction" in record) {
        const {
          id: _id,
          requested_product,
          ...request
        } = record as MedicationRequestRead;
        return {
          ...request,
          requested_product: requested_product?.id,
          requested_product_internal: requested_product,
        };
      } else {
        const statement = record as MedicationStatementRead;
        return {
          ...parseMedicationStringToRequest(statement.medication),
          authored_on: new Date().toISOString(),
          note: statement.note,
        } as MedicationRequest;
      }
    });
    const newMedications: MedicationRequest[] = [
      ...medications,
      ...medicationRequests,
    ];
    updateQuestionnaireResponseCB(
      [
        {
          type: "medication_request",
          value: newMedications,
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
        [{ type: "medication_request", value: newMedications }],
        questionnaireResponse.question_id,
      );
    } else {
      // For new records, remove them completely
      const newMedications = medications.filter(
        (_, i) => i !== medicationToDelete,
      );
      updateQuestionnaireResponseCB(
        [{ type: "medication_request", value: newMedications }],
        questionnaireResponse.question_id,
      );
    }
    setMedicationToDelete(null);
  };

  const handleUpdateMedication = (
    index: number,
    updates: Partial<MedicationRequest>,
  ) => {
    const newMedications = medications.map((medication, i) =>
      i === index ? { ...medication, ...updates } : medication,
    );

    updateQuestionnaireResponseCB(
      [{ type: "medication_request", value: newMedications }],
      questionnaireResponse.question_id,
    );
  };

  const newMedicationSheetContent = (
    <div className="space-y-4 p-3">
      {newMedicationInSheet && (
        <MedicationRequestGridRow
          medication={newMedicationInSheet}
          disabled={disabled}
          onUpdate={(updates) => {
            if (newMedicationInSheet) {
              setNewMedicationInSheet({
                ...newMedicationInSheet,
                ...updates,
              });
            }
          }}
          onRemove={() => {}}
          index={-1}
          questionId={questionnaireResponse.question_id}
          errors={errors}
        />
      )}
    </div>
  );

  const addMedicationPlaceholder = t("add_medication", {
    count: medications.length + 1,
  });

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
                medication: displayMedicationName(
                  medications[medicationToDelete!],
                ),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMedication}
              className={cn(buttonVariants({ variant: "destructive" }))}
              data-cy="confirm-remove-medication"
            >
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <HistoricalRecordSelector<MedicationRequestRead | MedicationStatementRead>
        structuredTypes={[
          {
            type: t("past_prescriptions"),
            displayFields: [
              {
                key: "",
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
                label: t("instructions"),
                render: (instructions) =>
                  instructions?.[0]?.additional_instruction?.[0]?.display,
              },
              {
                key: "note",
                label: t("notes"),
                render: (note) => note,
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
                    "active,on-hold,draft,unknown,ended,completed,cancelled",
                  ordering: "-created_date",
                },
              })({ signal: new AbortController().signal });
              return response;
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
              return response;
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
                "max-w-[2344px] relative lg:border border-gray-200 rounded-md",
                {
                  "bg-gray-50/50": !desktopLayout,
                },
              )}
            >
              {/* Header - Only show on desktop */}
              <div className="hidden lg:grid grid-cols-[280px_220px_180px_160px_300px_180px_250px_180px_160px_220px_180px_48px] bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("medicine")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("dosage")}
                  <span className="text-red-500 ml-0.5">*</span>
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("frequency")}
                  <span className="text-red-500 ml-0.5">*</span>
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("duration")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("instructions")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("route")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("site")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("method")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("intent")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("authored_on")}
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
                {medications.map((medication, index) => {
                  const isInactive = INACTIVE_MEDICATION_STATUSES.includes(
                    medication.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
                  );
                  const dosageInstruction =
                    medication.dosage_instruction[0] || {};

                  return (
                    <React.Fragment key={medication.id || index}>
                      {!desktopLayout ? (
                        <Card
                          className={cn(
                            "mb-2 rounded-lg border-0 shadow-none",
                            expandedMedicationIndex === index &&
                              "border border-primary-500",
                          )}
                        >
                          <Collapsible
                            open={expandedMedicationIndex === index}
                            onOpenChange={() => {
                              setExpandedMedicationIndex(
                                expandedMedicationIndex === index
                                  ? null
                                  : index,
                              );
                            }}
                            className="w-full"
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader
                                className={cn(
                                  "p-2 rounded-lg shadow-none bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors",
                                  {
                                    "bg-gray-200 border border-gray-300":
                                      expandedMedicationIndex !== index,
                                  },
                                )}
                              >
                                <div className="flex flex-col space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-2">
                                      <CardTitle
                                        className={cn(
                                          "text-base text-gray-950 break-words",
                                          isInactive &&
                                            medication.status !== "ended" &&
                                            "line-through",
                                        )}
                                        title={
                                          medication.medication?.display ||
                                          medication.requested_product_internal
                                            ?.name
                                        }
                                      >
                                        {medication.medication?.display ||
                                          medication.requested_product_internal
                                            ?.name}
                                      </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {expandedMedicationIndex === index ? (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveMedication(index);
                                          }}
                                          disabled={isInactive || disabled}
                                          className="size-10 p-4 border border-gray-400 bg-white shadow text-destructive"
                                          data-cy="remove-medication"
                                          aria-label="Remove medication"
                                        >
                                          <MinusCircledIcon className="size-5" />
                                        </Button>
                                      ) : null}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-10 border border-gray-400 bg-white shadow p-4 pointer-events-none"
                                        aria-label={
                                          expandedMedicationIndex === index
                                            ? "Collapse medication"
                                            : "Expand medication"
                                        }
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
                                      {dosageInstruction?.dose_and_rate
                                        ?.dose_quantity &&
                                        `${dosageInstruction.dose_and_rate.dose_quantity.value} ${dosageInstruction.dose_and_rate.dose_quantity.unit?.display || ""}`}

                                      {dosageInstruction?.dose_and_rate
                                        ?.dose_range &&
                                        formatDoseRange(
                                          dosageInstruction.dose_and_rate
                                            .dose_range,
                                        )}

                                      {dosageInstruction?.as_needed_boolean
                                        ? ` · ${t("as_needed_prn")}`
                                        : dosageInstruction?.timing?.code
                                            ?.code &&
                                          ` · ${MEDICATION_REQUEST_TIMING_OPTIONS[dosageInstruction.timing.code.code]?.display || ""}`}

                                      {dosageInstruction?.timing?.repeat
                                        ?.bounds_duration?.value &&
                                        ` · ${dosageInstruction.timing.repeat.bounds_duration.value} ${dosageInstruction.timing.repeat.bounds_duration.unit}`}
                                    </div>
                                  )}
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="p-2 pt-2 space-y-3 rounded-lg bg-gray-50">
                                <MedicationRequestGridRow
                                  medication={medication}
                                  disabled={disabled}
                                  onUpdate={(updates) =>
                                    handleUpdateMedication(index, updates)
                                  }
                                  onRemove={() => handleRemoveMedication(index)}
                                  index={index}
                                  questionId={questionnaireResponse.question_id}
                                  errors={errors}
                                />
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      ) : (
                        <MedicationRequestGridRow
                          medication={medication}
                          disabled={disabled || isInactive}
                          onUpdate={(updates) =>
                            handleUpdateMedication(index, updates)
                          }
                          onRemove={() => handleRemoveMedication(index)}
                          index={index}
                          questionId={questionnaireResponse.question_id}
                          errors={errors}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {!desktopLayout ? (
        <EntitySelectionSheet
          open={!!newMedicationInSheet}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setNewMedicationInSheet(null);
            }
          }}
          system="system-medication"
          entityType="medication"
          searchPostFix=" clinical drug"
          disabled={disabled}
          onEntitySelected={handleAddMedication}
          onConfirm={handleConfirmMedicationInSheet}
          placeholder={addMedicationPlaceholder}
          onProductEntitySelected={handleAddProductMedication}
        >
          {newMedicationSheetContent}
        </EntitySelectionSheet>
      ) : (
        <div className="max-w-4xl" data-cy="add-medication-request">
          <MedicationValueSetSelect
            placeholder={addMedicationPlaceholder}
            onSelect={handleAddMedication}
            onProductSelect={handleAddProductMedication}
            disabled={disabled}
            title={t("select_medication")}
          />
        </div>
      )}
    </div>
  );
}

interface MedicationRequestGridRowProps {
  medication: MedicationRequest;
  disabled?: boolean;
  onUpdate?: (medication: Partial<MedicationRequest>) => void;
  onRemove?: () => void;
  index: number;
  questionId: string;
  errors?: QuestionValidationError[];
}

const MedicationRequestGridRow: React.FC<MedicationRequestGridRowProps> = ({
  medication,
  disabled,
  onUpdate,
  onRemove,
  index,
  questionId,
  errors,
}) => {
  const { t } = useTranslation();
  const [showDosageDialog, setShowDosageDialog] = useState(false);
  const desktopLayout = useBreakpoints({ lg: true, default: false });
  const dosageInstruction = medication.dosage_instruction[0] || {};
  const isReadOnly = !!medication.id;
  const { hasError } = useFieldError(questionId, errors, index);

  const [currentInstructions, setCurrentInstructions] = useState<Code[]>(
    dosageInstruction?.additional_instruction || [],
  );

  const updateInstructions = (instructions: Code[]) => {
    setCurrentInstructions(instructions);
    handleUpdateDosageInstruction({
      additional_instruction:
        instructions.length > 0 ? instructions : undefined,
    });
  };

  const addInstruction = (instruction: Code) => {
    if (!currentInstructions.some((item) => item.code === instruction.code)) {
      updateInstructions([...currentInstructions, instruction]);
    } else {
      toast.warning(`${instruction.display} ${t("is_already_selected")}`);
    }
  };

  const removeInstruction = (instructionCode: string) => {
    updateInstructions(
      currentInstructions.filter((item) => item.code !== instructionCode),
    );
  };

  const handleUpdateDosageInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => {
    onUpdate?.({
      dosage_instruction: [{ ...dosageInstruction, ...updates }],
    });
  };

  interface DosageDialogProps {
    dosageRange: DoseRange;
  }

  const DosageDialog: React.FC<DosageDialogProps> = ({ dosageRange }) => {
    const [localDoseRange, setLocalDoseRange] =
      useState<DoseRange>(dosageRange);

    return (
      <div className="flex flex-col gap-3">
        <div className="font-medium text-base">{t("taper_titrate_dosage")}</div>
        <div>
          <Label className="mb-1.5">{t("start_dose")}</Label>
          <ComboboxQuantityInput
            quantity={localDoseRange.low}
            onChange={(value) => {
              if (value) {
                setLocalDoseRange((prev) => ({
                  ...prev,
                  low: value,
                  high: {
                    ...prev.high,
                    unit: value.unit || prev.high.unit,
                  },
                }));
              }
            }}
            disabled={disabled || isReadOnly}
            className="lg:max-w-[200px]"
          />
        </div>
        <div>
          <Label className="mb-1.5">{t("end_dose")}</Label>
          <ComboboxQuantityInput
            quantity={localDoseRange.high}
            onChange={(value) => {
              if (value) {
                setLocalDoseRange((prev) => ({
                  ...prev,
                  high: value,
                  low: {
                    ...prev.low,
                    unit: value.unit || prev.low.unit,
                  },
                }));
              }
            }}
            disabled={disabled || !localDoseRange.low.value || isReadOnly}
            className="lg:max-w-[200px]"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              handleUpdateDosageInstruction({
                dose_and_rate: undefined,
              });
              setShowDosageDialog(false);
            }}
          >
            {t("clear")}
          </Button>
          <Button
            onClick={() => {
              handleUpdateDosageInstruction({
                dose_and_rate: {
                  type: "ordered",
                  dose_range: localDoseRange,
                },
              });
              setShowDosageDialog(false);
            }}
            disabled={
              !localDoseRange.low.value ||
              !localDoseRange.high.value ||
              !localDoseRange.low.unit ||
              !localDoseRange.high.unit ||
              isReadOnly
            }
          >
            {t("save")}
          </Button>
        </div>
      </div>
    );
  };

  const handleDoseRangeClick = () => {
    const dose_quantity = dosageInstruction?.dose_and_rate?.dose_quantity;

    if (dose_quantity) {
      handleUpdateDosageInstruction({
        dose_and_rate: {
          type: "ordered",
          dose_quantity: undefined,
          dose_range: {
            low: dose_quantity,
            high: dose_quantity,
          },
        },
      });
    }
    setShowDosageDialog(true);
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-[280px_220px_180px_160px_300px_180px_250px_180px_160px_220px_180px_48px] border-b border-gray-200 hover:bg-gray-50/50 space-y-3 lg:space-y-0",
        {
          "opacity-40 pointer-events-none": disabled,
        },
      )}
    >
      {/* Medicine Name */}
      {desktopLayout && (
        <div
          className="lg:p-4 lg:px-2 lg:py-1 flex items-center justify-between lg:justify-start lg:col-span-1 lg:border-r border-gray-200 font-medium overflow-hidden text-sm"
          data-cy="medicine-name-view"
        >
          <span
            className={cn(
              "break-words line-clamp-2 hidden lg:block",
              disabled &&
                medication.status !== "entered_in_error" &&
                "line-through",
            )}
          >
            {displayMedicationName(medication)}
          </span>
        </div>
      )}
      {/* Dosage */}
      <div className="lg:px-2 p-1 lg:py-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("dosage")}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <div data-cy="dosage">
          {dosageInstruction?.dose_and_rate?.dose_range ? (
            <Input
              readOnly
              value={formatDoseRange(
                dosageInstruction.dose_and_rate.dose_range,
              )}
              onClick={() => setShowDosageDialog(true)}
              className={cn(
                "h-9 text-sm cursor-pointer mb-3",
                hasError(MEDICATION_REQUEST_FIELDS.DOSAGE.key) &&
                  "border-red-500",
              )}
            />
          ) : (
            <>
              <div
                className={cn(
                  hasError(MEDICATION_REQUEST_FIELDS.DOSAGE.key) &&
                    "border border-red-500 rounded-md",
                )}
              >
                <ComboboxQuantityInput
                  data-cy="dosage-input"
                  quantity={dosageInstruction?.dose_and_rate?.dose_quantity}
                  onChange={(value) => {
                    if (value?.value && value?.unit) {
                      handleUpdateDosageInstruction({
                        dose_and_rate: {
                          type: "ordered",
                          dose_quantity: value,
                          dose_range: undefined,
                        },
                      });
                    }
                  }}
                  disabled={disabled || isReadOnly}
                  className="lg:max-w-[200px]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-3 rounded-full hover:bg-transparent"
                  onClick={handleDoseRangeClick}
                  disabled={disabled || isReadOnly}
                >
                  +
                </Button>
              </div>
            </>
          )}
          <FieldError
            fieldKey={MEDICATION_REQUEST_FIELDS.DOSAGE.key}
            questionId={questionId}
            errors={errors}
            index={index}
          />
        </div>

        {dosageInstruction?.dose_and_rate?.dose_range &&
          (desktopLayout ? (
            <Popover open={showDosageDialog} onOpenChange={setShowDosageDialog}>
              <PopoverTrigger asChild>
                <div className="w-full" />
              </PopoverTrigger>
              <PopoverContent className="w-55 p-4" align="start">
                <DosageDialog
                  dosageRange={dosageInstruction.dose_and_rate.dose_range}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Dialog open={showDosageDialog} onOpenChange={setShowDosageDialog}>
              <DialogContent>
                <DosageDialog
                  dosageRange={dosageInstruction.dose_and_rate.dose_range}
                />
              </DialogContent>
            </Dialog>
          ))}
      </div>
      {/* Frequency */}
      <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("frequency")}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <Select
          value={
            dosageInstruction?.as_needed_boolean
              ? "PRN"
              : reverseFrequencyOption(dosageInstruction?.timing)
          }
          onValueChange={(value) => {
            if (value === "PRN") {
              handleUpdateDosageInstruction({
                as_needed_boolean: true,
                timing: undefined,
              });
            } else {
              const timingOption =
                MEDICATION_REQUEST_TIMING_OPTIONS[
                  value as keyof typeof MEDICATION_REQUEST_TIMING_OPTIONS
                ];

              handleUpdateDosageInstruction({
                as_needed_boolean: false,
                timing: timingOption.timing,
              });
            }
          }}
          disabled={disabled || isReadOnly}
        >
          <SelectTrigger
            data-cy="frequency"
            className={cn(
              "h-9 text-sm",
              hasError(MEDICATION_REQUEST_FIELDS.FREQUENCY.key) &&
                "border-red-500",
            )}
          >
            <SelectValue placeholder={t("select_frequency")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRN">{t("as_needed_prn")}</SelectItem>
            {Object.entries(MEDICATION_REQUEST_TIMING_OPTIONS).map(
              ([key, option]) => (
                <SelectItem key={key} value={key}>
                  {option.display}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <FieldError
          fieldKey={MEDICATION_REQUEST_FIELDS.FREQUENCY.key}
          questionId={questionId}
          errors={errors}
          index={index}
        />
      </div>
      {/* Duration */}
      <div className="lg:px-2 p-1 lg:py-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("duration")}
        </Label>
        <div
          className={cn(
            "flex gap-2",
            hasError(MEDICATION_REQUEST_FIELDS.DURATION.key) &&
              "border border-red-500 rounded-md p-1",
            dosageInstruction?.as_needed_boolean &&
              "opacity-50 bg-gray-100 rounded-md",
          )}
        >
          {dosageInstruction?.timing && (
            <Input
              type="number"
              min={0}
              value={
                dosageInstruction.timing.repeat.bounds_duration?.value == 0
                  ? ""
                  : dosageInstruction.timing.repeat.bounds_duration?.value
              }
              onChange={(e) => {
                const value = e.target.value;
                if (!dosageInstruction.timing) return;
                handleUpdateDosageInstruction({
                  timing: {
                    ...dosageInstruction.timing,
                    repeat: {
                      ...dosageInstruction.timing.repeat,
                      bounds_duration: {
                        value: Number(value),
                        unit: dosageInstruction.timing.repeat.bounds_duration
                          .unit,
                      },
                    },
                  },
                });
              }}
              disabled={
                disabled ||
                !dosageInstruction?.timing?.repeat ||
                dosageInstruction?.as_needed_boolean ||
                isReadOnly
              }
              className="h-9 text-sm"
            />
          )}
          <Select
            value={
              dosageInstruction?.timing?.repeat?.bounds_duration?.unit ??
              UCUM_TIME_UNITS[0]
            }
            onValueChange={(unit: (typeof UCUM_TIME_UNITS)[number]) => {
              if (dosageInstruction?.timing?.repeat) {
                const value =
                  dosageInstruction?.timing?.repeat?.bounds_duration?.value ??
                  0;
                handleUpdateDosageInstruction({
                  timing: {
                    ...dosageInstruction.timing,
                    repeat: {
                      ...dosageInstruction.timing.repeat,
                      bounds_duration: { value, unit },
                    },
                  },
                });
              }
            }}
            disabled={
              disabled ||
              !dosageInstruction?.timing?.repeat ||
              dosageInstruction?.as_needed_boolean ||
              isReadOnly
            }
          >
            <SelectTrigger
              className={cn(
                "h-9 text-sm w-full",
                dosageInstruction?.as_needed_boolean &&
                  "cursor-not-allowed bg-gray-50",
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UCUM_TIME_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FieldError
          fieldKey={MEDICATION_REQUEST_FIELDS.DURATION.key}
          questionId={questionId}
          errors={errors}
          index={index}
        />
      </div>
      {/* Instructions */}
      <div className="lg:px-2 lg:py-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("instructions")}
        </Label>
        {dosageInstruction?.as_needed_boolean ? (
          <div className="space-y-2">
            <ValueSetSelect
              system="system-as-needed-reason"
              value={dosageInstruction?.as_needed_for || null}
              placeholder={t("select_prn_reason")}
              onSelect={(value) => {
                handleUpdateDosageInstruction({
                  as_needed_for: value || undefined,
                });
              }}
              disabled={disabled || isReadOnly}
              asSheet
            />

            <InstructionsPopover
              currentInstructions={currentInstructions}
              removeInstruction={removeInstruction}
              addInstruction={addInstruction}
              isReadOnly={isReadOnly}
              disabled={disabled}
            />
          </div>
        ) : (
          <InstructionsPopover
            currentInstructions={currentInstructions}
            removeInstruction={removeInstruction}
            addInstruction={addInstruction}
            isReadOnly={isReadOnly}
            disabled={disabled}
          />
        )}
      </div>
      {/* Route */}
      <div
        className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden"
        data-cy="route"
      >
        <Label className="mb-1.5 block text-sm lg:hidden">{t("route")}</Label>
        <ValueSetSelect
          system="system-route"
          value={dosageInstruction?.route}
          onSelect={(route) => handleUpdateDosageInstruction({ route })}
          placeholder={t("select_route")}
          disabled={disabled || isReadOnly}
          asSheet
        />
      </div>
      {/* Site */}
      <div
        className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden"
        data-cy="site"
      >
        <Label className="mb-1.5 block text-sm lg:hidden">{t("site")}</Label>
        <ValueSetSelect
          system="system-body-site"
          value={dosageInstruction?.site}
          onSelect={(site) => handleUpdateDosageInstruction({ site })}
          placeholder={t("select_site")}
          disabled={disabled || isReadOnly}
          wrapTextForSmallScreen={true}
          asSheet
        />
      </div>
      {/* Method */}
      <div
        className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden"
        data-cy="method"
      >
        <Label className="mb-1.5 block text-sm lg:hidden">{t("method")}</Label>
        <ValueSetSelect
          system="system-administration-method"
          value={dosageInstruction?.method}
          onSelect={(method) => handleUpdateDosageInstruction({ method })}
          placeholder={t("select_method")}
          disabled={disabled || isReadOnly}
          count={20}
          asSheet
        />
      </div>
      {/* Intent */}
      <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("intent")}</Label>
        <Select
          value={medication.intent}
          onValueChange={(value: MedicationRequestIntent) =>
            onUpdate?.({ intent: value })
          }
          disabled={disabled || isReadOnly}
        >
          <SelectTrigger className="h-9 text-sm capitalize">
            <SelectValue
              className="capitalize"
              placeholder={t("select_intent")}
            />
          </SelectTrigger>
          <SelectContent>
            {MEDICATION_REQUEST_INTENT.map((intent) => (
              <SelectItem key={intent} value={intent} className="capitalize">
                {intent.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Authored On */}
      <div className="lg:px-1 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("authored_on")}
        </Label>
        <DateTimeInput
          value={medication.authored_on}
          onDateChange={(val) => onUpdate?.({ authored_on: val })}
          disabled={disabled || isReadOnly}
        />
      </div>
      {/* Notes */}
      <div
        className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden"
        data-cy="notes"
      >
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
      <div className="hidden lg:flex lg:px-2 lg:py-1 items-center justify-center sticky right-0 bg-white shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12">
        <Button
          data-cy="remove-medication"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="size-8"
          aria-label="Remove medication"
        >
          <MinusCircledIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export const reverseFrequencyOption = (
  option: MedicationRequest["dosage_instruction"][0]["timing"],
) => {
  return Object.entries(MEDICATION_REQUEST_TIMING_OPTIONS).find(
    ([key]) => key === option?.code?.code,
  )?.[0] as keyof typeof MEDICATION_REQUEST_TIMING_OPTIONS;
};
