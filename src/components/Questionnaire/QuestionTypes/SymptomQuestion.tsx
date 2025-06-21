import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
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
  Onset,
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
  SYMPTOM_VERIFICATION_STATUS,
  Symptom,
  SymptomRequest,
} from "@/types/emr/symptom/symptom";
import symptomApi from "@/types/emr/symptom/symptomApi";
import { Code } from "@/types/questionnaire/code";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface SymptomQuestionProps {
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

const SYMPTOM_INITIAL_VALUE: Omit<SymptomRequest, "encounter"> = {
  code: { code: "", display: "", system: "" },
  clinical_status: "active",
  verification_status: "confirmed",
  severity: "moderate",
  category: "problem_list_item",
  onset: { onset_datetime: new Date().toISOString().split("T")[0] },
};

function DatePickerField({
  onsetDatetime,
  onChange,
  disabled,
  isSymptomInSheet,
  hasId,
}: {
  onsetDatetime?: string;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  isSymptomInSheet: boolean;
  hasId: boolean;
}) {
  return (
    <CombinedDatePicker
      value={onsetDatetime ? new Date(onsetDatetime) : undefined}
      onChange={onChange}
      disabled={disabled || (!isSymptomInSheet && hasId)}
      dateFormat="P"
      buttonClassName="h-8 md:h-9 w-full justify-start font-normal"
    />
  );
}

function StatusSelect({
  status,
  onValueChange,
  disabled,
}: {
  status: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select value={status} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-8 md:h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SYMPTOM_CLINICAL_STATUS.map((status) => (
          <SelectItem key={status} value={status}>
            {t(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SeveritySelect({
  severity,
  onValueChange,
  disabled,
}: {
  severity: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select value={severity} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-8 md:h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SYMPTOM_SEVERITY.map((severity) => (
          <SelectItem key={severity} value={severity}>
            {t(severity)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function VerificationStatusSelect({
  status,
  onValueChange,
  disabled,
}: {
  status: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select value={status} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-8 md:h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SYMPTOM_VERIFICATION_STATUS.map((status) => (
          <SelectItem key={status} value={status}>
            {t(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NotesInput({
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

function convertToSymptomRequest(symptom: Symptom): SymptomRequest {
  return {
    id: symptom.id,
    code: symptom.code,
    clinical_status: symptom.clinical_status,
    verification_status: symptom.verification_status,
    severity: symptom.severity,
    onset: symptom.onset
      ? {
          ...symptom.onset,
          onset_datetime: symptom.onset.onset_datetime
            ? format(new Date(symptom.onset.onset_datetime), "yyyy-MM-dd")
            : "",
        }
      : undefined,
    recorded_date: symptom.recorded_date,
    note: symptom.note,
    category: symptom.category,
    encounter: symptom.encounter,
    created_date: symptom.created_date,
    updated_date: symptom.updated_date,
    created_by: symptom.created_by,
  };
}

interface SymptomRowProps {
  symptom: SymptomRequest;
  index: number;
  disabled?: boolean;
  onUpdate: (index: number, updates: Partial<SymptomRequest>) => void;
  onRemove: (index: number) => void;
}

function SymptomActionsMenu({
  showNotes,
  verificationStatus,
  disabled,
  onToggleNotes,
  onRemove,
  symptom,
}: {
  showNotes: boolean;
  verificationStatus: string;
  disabled?: boolean;
  onToggleNotes: () => void;
  onRemove: () => void;
  symptom: SymptomRequest;
}) {
  const { t } = useTranslation();

  return (
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
        <DropdownMenuItem onClick={onToggleNotes}>
          <Pencil2Icon className="size-4 mr-2" />
          {showNotes
            ? t("hide_notes")
            : symptom.note
              ? t("show_notes")
              : t("add_notes")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onRemove}
          disabled={verificationStatus === "entered_in_error"}
        >
          <MinusCircledIcon className="size-4 mr-2" />
          {verificationStatus === "entered_in_error"
            ? t("already_marked_as_error")
            : t("remove_symptom")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const SymptomRow = React.memo(function SymptomRow({
  symptom,
  index,
  disabled,
  onUpdate,
  onRemove,
}: SymptomRowProps) {
  const { t } = useTranslation();

  const [showNotes, setShowNotes] = useState(Boolean(symptom.note));
  const [isOpen, setIsOpen] = useState(!symptom.id);
  const isMobile = useBreakpoints({ default: true, md: false });

  const isSymptomInSheet = index === -1;

  const handleDateChange = useCallback(
    (date: Date | undefined) =>
      onUpdate(index, {
        onset: { onset_datetime: dateQueryString(date) },
      }),
    [index, onUpdate],
  );

  const handleStatusChange = useCallback(
    (value: string) =>
      onUpdate(index, {
        clinical_status: value as SymptomRequest["clinical_status"],
      }),
    [index, onUpdate],
  );

  const handleSeverityChange = useCallback(
    (value: string) =>
      onUpdate(index, {
        severity: value as SymptomRequest["severity"],
      }),
    [index, onUpdate],
  );

  const handleVerificationStatusChange = useCallback(
    (value: string) =>
      onUpdate(index, {
        verification_status: value as SymptomRequest["verification_status"],
      }),
    [index, onUpdate],
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(index, { note: e.target.value }),
    [index, onUpdate],
  );

  const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);

  if (isSymptomInSheet) {
    return (
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">
            {t("onset_date")}
          </div>
          <DatePickerField
            onsetDatetime={symptom.onset?.onset_datetime}
            onChange={handleDateChange}
            disabled={disabled}
            isSymptomInSheet={isSymptomInSheet}
            hasId={!!symptom.id}
          />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">
            {t("status")}
          </div>
          <StatusSelect
            status={symptom.clinical_status}
            onValueChange={handleStatusChange}
            disabled={disabled}
          />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">
            {t("severity")}
          </div>
          <SeveritySelect
            severity={symptom.severity}
            onValueChange={handleSeverityChange}
            disabled={disabled}
          />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">
            {t("verification_status")}
          </div>
          <VerificationStatusSelect
            status={symptom.verification_status}
            onValueChange={handleVerificationStatusChange}
            disabled={disabled}
          />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">
            {t("note")}
          </div>
          <NotesInput
            note={symptom.note}
            onChange={handleNotesChange}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  // For mobile view - Card Layout
  if (isMobile) {
    return (
      <div
        className={cn("group hover:bg-gray-50", {
          "opacity-40 pointer-events-none":
            symptom.verification_status === "entered_in_error",
        })}
      >
        <Card
          className={cn(
            "mb-2 rounded-lg border-0 shadow-none",
            isOpen && "border border-primary-500",
          )}
        >
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            key={symptom.id || `symptom-${symptom.code.code}-${index}`}
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
                    <div className="flex-1 min-w-0 mr-2">
                      <CardTitle
                        className="text-base text-gray-950 break-words"
                        title={symptom.code.display}
                      >
                        {symptom.code.display}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOpen && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={
                            disabled ||
                            symptom.verification_status === "entered_in_error"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                          }}
                          className="h-10 w-10 p-4 border border-gray-400 bg-white shadow text-destructive"
                        >
                          <MinusCircledIcon className="size-5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border border-gray-400 bg-white shadow p-4 pointer-events-none"
                      >
                        {isOpen ? (
                          <ChevronsDownUp className="size-5" />
                        ) : (
                          <ChevronsUpDown className="size-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {!isOpen && (
                    <div className="text-sm mt-1 text-gray-600">
                      Onset{" "}
                      {symptom.onset?.onset_datetime
                        ? format(
                            new Date(symptom.onset.onset_datetime),
                            "MMMM d, yyyy",
                          )
                        : ""}
                      {" · "}
                      {t(symptom.clinical_status)}
                      {" · "}
                      {t(symptom.severity)} {t("severity")}
                    </div>
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-3 pt-2 space-y-3 rounded-lg bg-gray-50">
                <div>
                  <div className="block text-sm font-medium  mb-1">
                    {t("onset_date")}
                  </div>
                  <DatePickerField
                    onsetDatetime={symptom.onset?.onset_datetime}
                    onChange={handleDateChange}
                    disabled={disabled}
                    isSymptomInSheet={isSymptomInSheet}
                    hasId={!!symptom.id}
                  />
                </div>
                <div>
                  <div className="block text-sm font-medium mb-1">
                    {t("status")}
                  </div>
                  <StatusSelect
                    status={symptom.clinical_status}
                    onValueChange={handleStatusChange}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <div className="block text-sm font-medium  mb-1">
                    {t("severity")}
                  </div>
                  <SeveritySelect
                    severity={symptom.severity}
                    onValueChange={handleSeverityChange}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <div className="block text-sm font-medium mb-1">
                    {t("verification_status")}
                  </div>
                  <VerificationStatusSelect
                    status={symptom.verification_status}
                    onValueChange={handleVerificationStatusChange}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <div className="block text-sm font-medium  mb-1">
                    {t("note")}
                  </div>
                  <NotesInput
                    note={symptom.note}
                    onChange={handleNotesChange}
                    disabled={disabled}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    );
  }

  // For desktop view - Table Row
  return (
    <>
      <TableRow
        className={cn({
          "opacity-40 pointer-events-none":
            symptom.verification_status === "entered_in_error",
        })}
      >
        <TableCell className="font-medium">
          <div className="truncate max-w-[300px]" title={symptom.code.display}>
            {symptom.code.display}
          </div>
        </TableCell>
        <TableCell>
          <DatePickerField
            onsetDatetime={symptom.onset?.onset_datetime}
            onChange={handleDateChange}
            disabled={disabled}
            isSymptomInSheet={isSymptomInSheet}
            hasId={!!symptom.id}
          />
        </TableCell>
        <TableCell>
          <StatusSelect
            status={symptom.clinical_status}
            onValueChange={handleStatusChange}
            disabled={disabled}
          />
        </TableCell>
        <TableCell>
          <SeveritySelect
            severity={symptom.severity}
            onValueChange={handleSeverityChange}
            disabled={disabled}
          />
        </TableCell>
        <TableCell>
          <VerificationStatusSelect
            status={symptom.verification_status}
            onValueChange={handleVerificationStatusChange}
            disabled={disabled}
          />
        </TableCell>
        <TableCell className="text-center">
          <SymptomActionsMenu
            symptom={symptom}
            showNotes={showNotes}
            verificationStatus={symptom.verification_status}
            disabled={disabled}
            onToggleNotes={() => setShowNotes((n) => !n)}
            onRemove={handleRemove}
          />
        </TableCell>
      </TableRow>
      {showNotes && (
        <TableRow>
          <TableCell colSpan={5} className="px-3 pb-3">
            <NotesInput
              note={symptom.note}
              onChange={handleNotesChange}
              disabled={disabled}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
});

function checkForDuplicateSymptom(
  existingSymptoms: SymptomRequest[],
  newSymptom: Pick<SymptomRequest, "code"> | Code,
  t: (key: string) => string,
) {
  const codeToCheck = "code" in newSymptom ? newSymptom.code : newSymptom;
  const codeValue =
    typeof codeToCheck === "string" ? codeToCheck : codeToCheck.code;

  const isDuplicate = existingSymptoms.some(
    (symptom) =>
      symptom.code.code === codeValue &&
      symptom.verification_status !== "entered_in_error",
  );
  if (isDuplicate) {
    toast.warning(t("symptom_already_exist_warning"));
    return true;
  }
  return false;
}

export function SymptomQuestion({
  patientId,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  encounterId,
}: SymptomQuestionProps) {
  const { t } = useTranslation();

  const isPreview = patientId === "preview";
  const symptoms =
    (questionnaireResponse.values?.[0]?.value as SymptomRequest[]) || [];
  const [showSymptomSelection, setShowSymptomSelection] = useState(false);
  const [newSymptom, setNewSymptom] = useState<Partial<SymptomRequest>>({
    ...SYMPTOM_INITIAL_VALUE,
    onset: { onset_datetime: dateQueryString(new Date()) },
  });
  const isMobile = useBreakpoints({ default: true, md: false });

  const { data: patientSymptoms } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: {
        limit: 100,
        encounter: encounterId,
      },
    }),
    enabled: !isPreview,
  });

  useEffect(() => {
    if (patientSymptoms?.results) {
      updateQuestionnaireResponseCB(
        [
          {
            type: "symptom",
            value: patientSymptoms.results.map(convertToSymptomRequest),
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  }, [patientSymptoms]);

  const handleCodeSelect = (code: Code) => {
    if (checkForDuplicateSymptom(symptoms, code, t)) {
      setShowSymptomSelection(false);
      return;
    }

    setNewSymptom({
      ...SYMPTOM_INITIAL_VALUE,
      onset: { onset_datetime: dateQueryString(new Date()) },
      code,
    });

    if (isMobile) {
      setShowSymptomSelection(true);
    } else {
      addNewSymptom(code);
    }
  };

  const addNewSymptom = (code: Code) => {
    const newSymptoms = [
      ...symptoms,
      { ...newSymptom, code },
    ] as SymptomRequest[];

    updateQuestionnaireResponseCB(
      [{ type: "symptom", value: newSymptoms }],
      questionnaireResponse.question_id,
    );

    setShowSymptomSelection(false);
    setNewSymptom({
      ...SYMPTOM_INITIAL_VALUE,
      onset: { onset_datetime: dateQueryString(new Date()) },
    });
  };

  const handleConfirmSymptom = () => {
    if (!newSymptom.code) return;
    addNewSymptom(newSymptom.code);
  };

  const handleRemoveSymptom = (index: number) => {
    const symptom = symptoms[index];
    if (symptom.id) {
      // For existing records, update verification status to entered_in_error
      const newSymptoms = symptoms.map((s, i) =>
        i === index
          ? { ...s, verification_status: "entered_in_error" as const }
          : s,
      );
      updateQuestionnaireResponseCB(
        [{ type: "symptom", value: newSymptoms }],
        questionnaireResponse.question_id,
      );
    } else {
      // For new records, remove them completely
      const newSymptoms = symptoms.filter((_, i) => i !== index);
      updateQuestionnaireResponseCB(
        [{ type: "symptom", value: newSymptoms }],
        questionnaireResponse.question_id,
      );
    }
  };

  const handleUpdateSymptom = (
    index: number,
    updates: Partial<SymptomRequest>,
  ) => {
    const newSymptoms = symptoms.map((symptom, i) =>
      i === index ? { ...symptom, ...updates } : symptom,
    );
    updateQuestionnaireResponseCB(
      [{ type: "symptom", value: newSymptoms }],
      questionnaireResponse.question_id,
    );
  };

  const handleAddHistoricalSymptoms = async (
    selectedSymptoms: SymptomRequest[],
  ) => {
    // Filter out duplicates before adding
    const nonDuplicateSymptoms = selectedSymptoms.filter(
      (symptom) => !checkForDuplicateSymptom(symptoms, symptom, t),
    );

    if (nonDuplicateSymptoms.length === 0) {
      return;
    }

    const newSymptoms = [
      ...symptoms,
      ...nonDuplicateSymptoms.map(({ id: _id, ...symptom }) => symptom),
    ];
    updateQuestionnaireResponseCB(
      [{ type: "symptom", value: newSymptoms }],
      questionnaireResponse.question_id,
    );
  };

  const addSymptomPlaceholder = t("add_symptom", {
    count: symptoms.length + 1,
  });

  return (
    <div className="space-y-2">
      <HistoricalRecordSelector<SymptomRequest>
        structuredTypes={[
          {
            type: t("symptoms"),
            displayFields: [
              {
                key: "code",
                label: t("symptom"),
                render: (code: Code) => code?.display || "",
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
                key: "severity",
                label: t("severity"),
                render: (severity: string) => t(severity),
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
            queryKey: ["symptoms", patientId],
            queryFn: async (limit: number, offset: number) => {
              const response = await query(symptomApi.listSymptoms, {
                pathParams: { patientId },
                queryParams: {
                  offset,
                  limit,
                  exclude_verification_status: "entered_in_error",
                  ordering: "-created_date",
                },
              })({ signal: new AbortController().signal });
              return response;
            },
            converter: convertToSymptomRequest,
          },
        ]}
        buttonLabel={t("symptom_history")}
        onAddSelected={handleAddHistoricalSymptoms}
      />
      {symptoms.length > 0 && (
        <>
          {/* Desktop View - Table */}
          {!isMobile && (
            <div className="rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[40%]">{t("symptom")}</TableHead>
                    <TableHead className="text-center">{t("date")}</TableHead>
                    <TableHead className="text-center">{t("status")}</TableHead>
                    <TableHead className="text-center">
                      {t("severity")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("verification")}
                    </TableHead>
                    <TableHead className="text-center">{t("action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {symptoms.map((symptom, index) => (
                    <SymptomRow
                      symptom={symptom}
                      index={index}
                      disabled={disabled}
                      onUpdate={handleUpdateSymptom}
                      onRemove={handleRemoveSymptom}
                      key={
                        symptom.id || `symptom-${symptom.code.code}-${index}`
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Mobile View - Cards */}
          {isMobile && (
            <div>
              {symptoms.map((symptom, index) => (
                <SymptomRow
                  symptom={symptom}
                  index={index}
                  disabled={disabled}
                  onUpdate={handleUpdateSymptom}
                  onRemove={handleRemoveSymptom}
                  key={symptom.id || `symptom-${symptom.code.code}-${index}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {isMobile ? (
        <EntitySelectionSheet
          open={showSymptomSelection}
          onOpenChange={setShowSymptomSelection}
          system="system-condition-code"
          entityType="symptom"
          disabled={disabled}
          onEntitySelected={handleCodeSelect}
          onConfirm={handleConfirmSymptom}
          placeholder={addSymptomPlaceholder}
        >
          <div className="space-y-4 p-3">
            <SymptomRow
              symptom={newSymptom as SymptomRequest}
              index={-1}
              disabled={disabled}
              onUpdate={(_, updates) => {
                setNewSymptom((prev) => ({ ...prev, ...updates }));
              }}
              onRemove={() => {}}
            />
          </div>
        </EntitySelectionSheet>
      ) : (
        <ValueSetSelect
          system="system-condition-code"
          placeholder={addSymptomPlaceholder}
          onSelect={handleCodeSelect}
          disabled={disabled}
        />
      )}
    </div>
  );
}
