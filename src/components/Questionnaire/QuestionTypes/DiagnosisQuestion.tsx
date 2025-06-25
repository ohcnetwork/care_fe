import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
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

import { HistoricalRecordSelector } from "@/components/HistoricalRecordSelector";
import { EntitySelectionSheet } from "@/components/Questionnaire/EntitySelectionSheet";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { dateQueryString, formatName } from "@/Utils/utils";
import {
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_VERIFICATION_STATUS,
  Diagnosis,
  DiagnosisClinicalStatus,
  DiagnosisRequest,
  Onset,
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

function DiagnosisDatePicker({
  onsetDatetime,
  onChange,
  disabled,
  hasId,
}: {
  onsetDatetime?: string;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  hasId: boolean;
}) {
  return (
    <CombinedDatePicker
      value={onsetDatetime ? new Date(onsetDatetime) : undefined}
      onChange={onChange}
      dateFormat="P"
      disabled={disabled || hasId}
      buttonClassName="h-8 md:h-9 w-full justify-start font-normal"
    />
  );
}

function ClinicalStatusSelect({
  status,
  onValueChange,
  disabled,
}: {
  status: DiagnosisClinicalStatus;
  onValueChange: (value: DiagnosisClinicalStatus) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select value={status} onValueChange={onValueChange} disabled={disabled}>
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
          <SelectItem key={status} value={status} className="capitalize">
            {t(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function VerificationStatusSelect({
  status,
  onValueChange,
  isExistingRecord,
  disabled,
}: {
  status: string;
  onValueChange: (value: string) => void;
  isExistingRecord?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select value={status} onValueChange={onValueChange} disabled={disabled}>
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
        {DIAGNOSIS_VERIFICATION_STATUS.map(
          (status) =>
            (isExistingRecord || status !== "entered_in_error") && (
              <SelectItem key={status} value={status} className="capitalize">
                {t(status)}
              </SelectItem>
            ),
        )}
      </SelectContent>
    </Select>
  );
}

function DiagnosisNotesInput({
  note,
  onChange,
  disabled,
}: {
  note?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Input
      type="text"
      placeholder={t("additional_notes")}
      value={note || ""}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

// Create a reusable form component
function DiagnosisDetailsForm({
  diagnosis,
  onUpdate,
  disabled,
}: {
  diagnosis: Partial<DiagnosisRequest>;
  onUpdate: (updates: Partial<DiagnosisRequest>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-sm">{t("date")}</Label>
        <DiagnosisDatePicker
          onsetDatetime={diagnosis.onset?.onset_datetime}
          onChange={(date) =>
            onUpdate({
              onset: { onset_datetime: dateQueryString(date) },
            })
          }
          disabled={disabled}
          hasId={!!diagnosis.id}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">{t("status")}</Label>
        <ClinicalStatusSelect
          status={diagnosis.clinical_status || "active"}
          onValueChange={(value) =>
            onUpdate({
              clinical_status: value as DiagnosisRequest["clinical_status"],
            })
          }
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">{t("verification")}</Label>
        <VerificationStatusSelect
          status={diagnosis.verification_status || ""}
          onValueChange={(value) =>
            onUpdate({
              verification_status:
                value as DiagnosisRequest["verification_status"],
            })
          }
          isExistingRecord={!!diagnosis.id}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">{t("notes")}</Label>
        <DiagnosisNotesInput
          note={diagnosis.note}
          onChange={(e) => onUpdate({ note: e.target.value })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

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
    created_by: diagnosis.created_by,
    created_date: diagnosis.created_date,
    dirty: false,
  };
}

function checkForDuplicateDiagnosis(
  existingDiagnoses: DiagnosisRequest[],
  newDiagnosis: Pick<DiagnosisRequest, "code"> | Code,
  t: (key: string) => string,
) {
  const codeToCheck = "code" in newDiagnosis ? newDiagnosis.code : newDiagnosis;
  const codeValue =
    typeof codeToCheck === "string" ? codeToCheck : codeToCheck.code;

  const isDuplicate = existingDiagnoses.some(
    (diagnosis) =>
      diagnosis.code.code === codeValue &&
      diagnosis.verification_status !== "entered_in_error",
  );

  if (isDuplicate) {
    toast.warning(t("diagnosis_already_exist_warning"));
    return true;
  }
  return false;
}

export function DiagnosisQuestion({
  patientId,
  encounterId,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: DiagnosisQuestionProps) {
  const { t } = useTranslation();

  const isPreview = patientId === "preview";
  const [selectedCategory] = useState<DiagnosisRequest["category"]>(
    "encounter_diagnosis",
  );
  const [newDiagnosis, setNewDiagnosis] = useState<Partial<DiagnosisRequest>>({
    ...DIAGNOSIS_INITIAL_VALUE,
    onset: { onset_datetime: new Date().toISOString().split("T")[0] },
  });
  const [showDiagnosisSelection, setShowDiagnosisSelection] = useState(false);
  const isMobile = useBreakpoints({ default: true, md: false });

  // Sort diagnoses by date
  const sortedDiagnoses = useMemo(() => {
    const diagnoses =
      (questionnaireResponse.values?.[0]?.value as DiagnosisRequest[]) || [];
    return [...diagnoses].sort((a, b) => {
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
    queryKey: ["diagnoses", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
        category: "encounter_diagnosis,chronic_condition",
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

  const handleCodeSelect = (code: Code) => {
    if (checkForDuplicateDiagnosis(sortedDiagnoses, code, t)) {
      setShowDiagnosisSelection(false);
      return;
    }

    if (isMobile) {
      setNewDiagnosis({
        ...DIAGNOSIS_INITIAL_VALUE,
        code,
      });
      setShowDiagnosisSelection(true);
    } else {
      addNewDiagnosis(code);
    }
  };

  const addNewDiagnosis = (code: Code) => {
    const newDiagnoses = [
      ...sortedDiagnoses,
      {
        ...newDiagnosis,
        code,
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

    setShowDiagnosisSelection(false);
    setNewDiagnosis({
      ...DIAGNOSIS_INITIAL_VALUE,
      onset: { onset_datetime: new Date().toISOString().split("T")[0] },
    });
  };

  const handleConfirmDiagnosis = () => {
    if (!newDiagnosis.code) return;
    addNewDiagnosis(newDiagnosis.code);
  };

  const handleRemoveDiagnosis = (index: number) => {
    const diagnosis = sortedDiagnoses[index];
    if (diagnosis.id) {
      // For existing records, update verification status to entered_in_error
      const newDiagnoses = sortedDiagnoses.map((d, i) =>
        i === index
          ? {
              ...d,
              verification_status: "entered_in_error" as const,
              dirty: true,
            }
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

  const addDiagnosisPlaceholder = t("add_diagnosis", {
    count: sortedDiagnoses.length + 1,
  });

  const handleAddHistoricalDiagnoses = async (
    selectedDiagnoses: DiagnosisRequest[],
  ) => {
    // Filter out duplicates before adding
    const nonDuplicateDiagnoses = selectedDiagnoses.filter(
      (diagnosis) => !checkForDuplicateDiagnosis(sortedDiagnoses, diagnosis, t),
    );

    if (nonDuplicateDiagnoses.length === 0) {
      return;
    }

    const newDiagnoses = [
      ...sortedDiagnoses,
      ...nonDuplicateDiagnoses.map(({ id: _id, ...diagnosis }) => ({
        ...diagnosis,
        dirty: true,
      })),
    ];
    updateQuestionnaireResponseCB(
      [{ type: "diagnosis", value: newDiagnoses }],
      questionnaireResponse.question_id,
    );
  };

  return (
    <div className="space-y-4">
      <HistoricalRecordSelector<DiagnosisRequest>
        title={t("diagnosis_history")}
        structuredTypes={[
          {
            type: t("diagnoses"),
            converter: convertToDiagnosisRequest,
            displayFields: [
              {
                key: "code",
                label: t("diagnosis"),
                render: (code: Code) => code?.display || "-",
              },
              {
                key: "clinical_status",
                label: t("status"),
                render: (status: string) => t(status),
              },
              {
                key: "onset",
                label: t("onset_date"),
                render: (onset: Onset) =>
                  onset?.onset_datetime
                    ? format(new Date(onset.onset_datetime), "dd-MM-yyyy")
                    : "",
              },
              {
                key: "note",
                label: t("notes"),
                render: (note: string | undefined) => note || "-",
              },
              {
                key: "created_by",
                label: t("recorded_by"),
                render: (created_by) => formatName(created_by),
              },
            ],
            queryKey: ["diagnoses_and_chronic_conditions", patientId],
            queryFn: async (limit: number, offset: number) => {
              const response = await query(diagnosisApi.listDiagnosis, {
                pathParams: { patientId },
                queryParams: {
                  offset,
                  limit,
                  exclude_verification_status: "entered_in_error",
                  ordering: "-created_date",
                  category: "encounter_diagnosis,chronic_condition",
                },
              })({ signal: new AbortController().signal });
              return response;
            },
          },
        ]}
        buttonLabel={t("diagnosis_history")}
        onAddSelected={handleAddHistoricalDiagnoses}
      />

      {sortedDiagnoses.length > 0 && (
        <div className="md:rounded-lg md:border">
          {/* Desktop View - Table */}
          {!isMobile && (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[30%]">{t("diagnosis")}</TableHead>
                  <TableHead className="w-[15%] text-center">
                    {t("date")}
                  </TableHead>
                  <TableHead className="w-[15%] text-center">
                    {t("status")}
                  </TableHead>
                  <TableHead className="w-[15%] text-center">
                    {t("verification")}
                  </TableHead>
                  <TableHead className="w-[5%] text-center">
                    {t("action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDiagnoses.map((diagnosis, index) => (
                  <DiagnosisTableRow
                    key={
                      diagnosis.id ||
                      `diagnosis-${diagnosis.code.code}-${index}`
                    }
                    diagnosis={diagnosis}
                    disabled={
                      disabled ||
                      patientDiagnoses?.results[index]?.verification_status ===
                        "entered_in_error"
                    }
                    onUpdate={(updates) =>
                      handleUpdateDiagnosis(index, updates)
                    }
                    onRemove={() => handleRemoveDiagnosis(index)}
                  />
                ))}
              </TableBody>
            </Table>
          )}

          {/* Mobile View */}
          <div className="md:hidden">
            {sortedDiagnoses.map((diagnosis, index) => (
              <DiagnosisItem
                key={
                  diagnosis.id || `diagnosis-${diagnosis.code.code}-${index}`
                }
                diagnosis={diagnosis}
                disabled={
                  disabled ||
                  patientDiagnoses?.results[index]?.verification_status ===
                    "entered_in_error"
                }
                onUpdate={(updates) => handleUpdateDiagnosis(index, updates)}
                onRemove={() => handleRemoveDiagnosis(index)}
              />
            ))}
          </div>
        </div>
      )}

      {isMobile ? (
        <EntitySelectionSheet
          open={showDiagnosisSelection}
          onOpenChange={setShowDiagnosisSelection}
          system="system-condition-code"
          entityType="diagnosis"
          disabled={disabled}
          onEntitySelected={handleCodeSelect}
          onConfirm={handleConfirmDiagnosis}
          placeholder={addDiagnosisPlaceholder}
        >
          <div className="space-y-4 p-3">
            <DiagnosisDetailsForm
              diagnosis={newDiagnosis}
              onUpdate={(updates) =>
                setNewDiagnosis((prev) => ({ ...prev, ...updates }))
              }
              disabled={disabled}
            />
          </div>
        </EntitySelectionSheet>
      ) : (
        <ValueSetSelect
          system="system-condition-code"
          placeholder={addDiagnosisPlaceholder}
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
  const { t } = useTranslation();
  return (
    <>
      <TableRow className={cn(disabled && "opacity-40 pointer-events-none")}>
        <TableCell className="py-1">
          <div className="flex items-center space-x-2 min-w-0">
            <div
              className="font-medium text-sm truncate max-w-[12rem]"
              title={diagnosis.code.display}
            >
              {diagnosis.code.display}
            </div>
            <div className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-gray-100 text-gray-700">
              {t(`Diagnosis_${diagnosis.category}__title`)}
            </div>
          </div>
        </TableCell>
        <TableCell className="py-1">
          <DiagnosisDatePicker
            onsetDatetime={diagnosis.onset?.onset_datetime}
            onChange={(date) =>
              onUpdate?.({ onset: { onset_datetime: dateQueryString(date) } })
            }
            disabled={disabled}
            hasId={!!diagnosis.id}
          />
        </TableCell>
        <TableCell className="py-1">
          <ClinicalStatusSelect
            status={diagnosis.clinical_status}
            onValueChange={(value) =>
              onUpdate?.({
                clinical_status: value as DiagnosisRequest["clinical_status"],
              })
            }
            disabled={disabled}
          />
        </TableCell>
        <TableCell className="py-1">
          <VerificationStatusSelect
            status={diagnosis.verification_status}
            onValueChange={(value) =>
              onUpdate?.({
                verification_status:
                  value as DiagnosisRequest["verification_status"],
              })
            }
            isExistingRecord={!!diagnosis.id}
            disabled={disabled}
          />
        </TableCell>
        <TableCell className="py-1 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="size-9"
              >
                <DotsVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowNotes(!showNotes)}>
                <Pencil2Icon className="size-4 mr-2" />
                {showNotes
                  ? t("hide_notes")
                  : diagnosis.note
                    ? t("show_notes")
                    : t("add_notes")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onRemove}
              >
                <MinusCircledIcon className="size-4 mr-2" />
                {t("remove_diagnosis")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {showNotes && (
        <TableRow>
          <TableCell colSpan={5} className="px-4 py-2">
            <DiagnosisNotesInput
              note={diagnosis.note}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              disabled={disabled}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// Keep the original DiagnosisItem component for mobile view
const DiagnosisItem: React.FC<DiagnosisItemProps> = ({
  diagnosis,
  disabled,
  onUpdate,
  onRemove,
}) => {
  const [isOpen, setIsOpen] = useState(
    Boolean(diagnosis.dirty) || !diagnosis.id,
  );
  const { t } = useTranslation();
  return (
    <div className="group hover:bg-gray-50">
      {/* Mobile View - Card Layout */}
      <Card
        className={cn("mb-2 rounded-lg", {
          "border border-primary-500": isOpen,
          "border-0 shadow-none": !isOpen,
        })}
      >
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          key={diagnosis.id || `diagnosis-${diagnosis.code.code}`}
        >
          <CollapsibleTrigger asChild>
            <CardHeader
              className={cn(
                "p-2 rounded-lg shadow-none bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors",
                {
                  "bg-gray-200 border border-gray-300": !isOpen,
                },
              )}
            >
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-1">
                      <CardTitle
                        className="text-base text-gray-950 break-words"
                        title={diagnosis.code.display}
                      >
                        <span className="mr-2">{diagnosis.code.display}</span>
                        <div
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-700",
                          )}
                        >
                          {t(`Diagnosis_${diagnosis.category}__title`)}
                        </div>
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    {isOpen && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={
                          disabled ||
                          diagnosis.verification_status === "entered_in_error"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove?.();
                        }}
                        className="h-10 w-10 p-4 border border-gray-400 bg-white shadow text-destructive"
                      >
                        <MinusCircledIcon className="h-5 w-5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 border border-gray-400 bg-white shadow p-4"
                    >
                      {isOpen ? (
                        <ChevronsDownUp className="h-5 w-5" />
                      ) : (
                        <ChevronsUpDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                {!isOpen && (
                  <div className="text-sm text-gray-500">
                    {t("diagnosed_on")}{" "}
                    {diagnosis.onset?.onset_datetime
                      ? format(
                          new Date(diagnosis.onset.onset_datetime),
                          "MMMM d, yyyy",
                        )
                      : ""}
                    {" · "}
                    {t(diagnosis.clinical_status)}
                    {" · "}
                    {t(diagnosis.verification_status)}
                  </div>
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-3 pt-2 space-y-3 rounded-lg bg-gray-50">
              <DiagnosisDetailsForm
                diagnosis={diagnosis}
                onUpdate={onUpdate || (() => {})}
                disabled={disabled}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};
