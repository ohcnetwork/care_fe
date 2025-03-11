import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import React, { useCallback, useEffect, useState } from "react";

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
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
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
  onset: { onset_datetime: new Date().toISOString().split("T")[0] },
};

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
    encounter: "", // This will be set when submitting the form
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
}: {
  showNotes: boolean;
  verificationStatus: string;
  disabled?: boolean;
  onToggleNotes: () => void;
  onRemove: () => void;
}) {
  return (
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
        <DropdownMenuItem onClick={onToggleNotes}>
          <Pencil2Icon className="h-4 w-4 mr-2" />
          {showNotes ? t("hide_notes") : t("add_notes")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onRemove}
          disabled={verificationStatus === "entered_in_error"}
        >
          <MinusCircledIcon className="h-4 w-4 mr-2" />
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
  const [showNotes, setShowNotes] = useState(Boolean(symptom.note));

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(index, {
        onset: { onset_datetime: e.target.value },
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

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(index, { note: e.target.value }),
    [index, onUpdate],
  );

  const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);
  const handleToggleNotes = useCallback(() => setShowNotes((n) => !n), []);

  return (
    <>
      <TableRow
        className={cn("group hover:bg-gray-50", {
          "opacity-40 pointer-events-none":
            symptom.verification_status === "entered_in_error",
        })}
      >
        <TableCell className="min-w-[220px] font-medium py-1 pl-1">
          {symptom.code.display}
        </TableCell>
        <TableCell className="min-w-[100px] py-1 px-1">
          <Input
            type="date"
            value={symptom.onset?.onset_datetime || ""}
            onChange={handleDateChange}
            disabled={disabled || !!symptom.id}
            className="h-7 text-sm px-1"
          />
        </TableCell>

        <TableCell className="min-w-[80px] py-1 px-0.5">
          <Select
            value={symptom.clinical_status}
            onValueChange={handleStatusChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 px-1">
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              {SYMPTOM_CLINICAL_STATUS.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {t(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>

        <TableCell className="min-w-[80px] py-1 px-0.5">
          <Select
            value={symptom.severity}
            onValueChange={handleSeverityChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 px-1">
              <SelectValue placeholder={t("severity")} />
            </SelectTrigger>
            <SelectContent>
              {SYMPTOM_SEVERITY.map((severity) => (
                <SelectItem
                  key={severity}
                  value={severity}
                  className="capitalize"
                >
                  {t(severity)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>

        <TableCell className="min-w-[35px] py-1 px-0">
          <SymptomActionsMenu
            showNotes={showNotes}
            verificationStatus={symptom.verification_status}
            disabled={disabled}
            onToggleNotes={handleToggleNotes}
            onRemove={handleRemove}
          />
        </TableCell>
      </TableRow>

      {showNotes && (
        <TableRow>
          <TableCell colSpan={5} className="px-4 py-2">
            <Input
              type="text"
              placeholder={t("add_notes_about_symptom")}
              value={symptom.note ?? ""}
              onChange={handleNotesChange}
              disabled={disabled}
              className="mt-0.5"
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
});

export function SymptomQuestion({
  patientId,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  encounterId,
}: SymptomQuestionProps) {
  const isPreview = patientId === "preview";
  const symptoms =
    (questionnaireResponse.values?.[0]?.value as SymptomRequest[]) || [];

  const { data: patientSymptoms } = useQuery({
    queryKey: ["symptoms", patientId],
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

  const handleAddSymptom = (code: Code) => {
    const newSymptoms = [
      ...symptoms,
      { ...SYMPTOM_INITIAL_VALUE, code },
    ] as SymptomRequest[];
    updateQuestionnaireResponseCB(
      [{ type: "symptom", value: newSymptoms }],
      questionnaireResponse.question_id,
    );
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

  return (
    <div className="space-y-2">
      {symptoms.length > 0 && (
        <div className="rounded-lg border">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-55">{t("symptom")}</TableHead>
                  <TableHead className="w-20 text-center px-0.5">
                    {t("date")}
                  </TableHead>
                  <TableHead className="w-21 text-center px-0.5">
                    {t("status")}
                  </TableHead>
                  <TableHead className="w-21 text-center px-0.5">
                    {t("severity")}
                  </TableHead>
                  <TableHead className="w-9">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {symptoms.map((symptom, index) => (
                  <SymptomRow
                    key={index}
                    symptom={symptom}
                    index={index}
                    disabled={disabled}
                    onUpdate={handleUpdateSymptom}
                    onRemove={handleRemoveSymptom}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden divide-y divide-gray-200">
            {symptoms.map((symptom, index) => (
              <div key={index} className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{symptom.code.display}</div>
                  <SymptomActionsMenu
                    showNotes={Boolean(symptom.note)}
                    verificationStatus={symptom.verification_status}
                    disabled={disabled}
                    onToggleNotes={() =>
                      handleUpdateSymptom(index, {
                        note: symptom.note ? undefined : "",
                      })
                    }
                    onRemove={() => handleRemoveSymptom(index)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">{t("date")}</Label>
                    <Input
                      type="date"
                      value={symptom.onset?.onset_datetime || ""}
                      onChange={(e) =>
                        handleUpdateSymptom(index, {
                          onset: { onset_datetime: e.target.value },
                        })
                      }
                      disabled={disabled || !!symptom.id}
                      className="h-8 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("status")}
                    </Label>
                    <Select
                      value={symptom.clinical_status}
                      onValueChange={(value) =>
                        handleUpdateSymptom(index, {
                          clinical_status:
                            value as SymptomRequest["clinical_status"],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder={t("status")} />
                      </SelectTrigger>
                      <SelectContent>
                        {SYMPTOM_CLINICAL_STATUS.map((status) => (
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
                      {t("severity")}
                    </Label>
                    <Select
                      value={symptom.severity}
                      onValueChange={(value) =>
                        handleUpdateSymptom(index, {
                          severity: value as SymptomRequest["severity"],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder={t("severity")} />
                      </SelectTrigger>
                      <SelectContent>
                        {SYMPTOM_SEVERITY.map((severity) => (
                          <SelectItem
                            key={severity}
                            value={severity}
                            className="capitalize"
                          >
                            {t(severity)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {symptom.note !== undefined && (
                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("notes")}
                    </Label>
                    <Input
                      type="text"
                      placeholder={t("add_notes_about_symptom")}
                      value={symptom.note ?? ""}
                      onChange={(e) =>
                        handleUpdateSymptom(index, { note: e.target.value })
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
      <ValueSetSelect
        system="system-condition-code"
        placeholder={t("search_for_symptoms_to_add")}
        onSelect={handleAddSymptom}
        disabled={disabled}
      />
    </div>
  );
}
