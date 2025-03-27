"use client";

import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Command, CommandDrawer, CommandList } from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RelativeDatePicker } from "@/components/ui/relative-date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
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
  category: "problem_list_item",
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
    category: symptom.category,
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
          className="size-8 p-2 border border-gray-200 bg-white shadow"
        >
          <DotsVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onToggleNotes}>
          <Pencil2Icon className="size-4 mr-2" />
          {showNotes ? t("hide_notes") : t("add_notes")}
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
  const [showNotes, setShowNotes] = useState(Boolean(symptom.note));
  const [activeTab, setActiveTab] = useState<"absolute" | "relative">(
    "absolute",
  );
  const [isOpen, setIsOpen] = useState(!symptom.id);

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

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(index, { note: e.target.value }),
    [index, onUpdate],
  );

  const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);
  const handleToggleNotes = useCallback(() => setShowNotes((n) => !n), []);

  return (
    <div
      className={cn("group hover:bg-gray-50", {
        "opacity-40 pointer-events-none":
          symptom.verification_status === "entered_in_error",
      })}
    >
      {/* Desktop View */}
      <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-4 py-1 px-2">
        <div className="flex items-center justify-between md:col-span-5">
          <div
            className="font-medium text-sm truncate"
            title={symptom.code.display}
          >
            {symptom.code.display}
          </div>
        </div>
        <div className="col-span-2">
          <div className="block text-sm font-medium text-gray-500 mb-1 md:hidden">
            {t("date")}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 md:h-9 w-full justify-start font-normal"
                disabled={disabled || !!symptom.id}
              >
                {symptom.onset?.onset_datetime ? (
                  new Date(symptom.onset.onset_datetime).toLocaleDateString()
                ) : (
                  <span className="text-muted-foreground">
                    {t("select_date")}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto" align="start">
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  setActiveTab(v as "absolute" | "relative")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="absolute">
                    {t("absolute_date")}
                  </TabsTrigger>
                  <TabsTrigger value="relative">
                    {t("relative_date")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="absolute" className="p-0">
                  <Calendar
                    mode="single"
                    selected={
                      symptom.onset?.onset_datetime
                        ? new Date(symptom.onset.onset_datetime)
                        : undefined
                    }
                    onSelect={(date: Date | undefined) => {
                      handleDateChange(date);
                    }}
                  />
                </TabsContent>
                <TabsContent value="relative" className="p-0">
                  <RelativeDatePicker
                    value={
                      symptom.onset?.onset_datetime
                        ? new Date(symptom.onset.onset_datetime)
                        : undefined
                    }
                    onDateChange={(date) => handleDateChange(date)}
                  />
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </div>
        <div className="col-span-2">
          <Select
            value={symptom.clinical_status}
            onValueChange={handleStatusChange}
            disabled={disabled}
          >
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
        </div>
        <div className="col-span-2">
          <Select
            value={symptom.severity}
            onValueChange={handleSeverityChange}
            disabled={disabled}
          >
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
        </div>
        <div className="col-span-1 flex justify-center">
          <SymptomActionsMenu
            showNotes={showNotes}
            verificationStatus={symptom.verification_status}
            disabled={disabled}
            onToggleNotes={handleToggleNotes}
            onRemove={handleRemove}
          />
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="md:hidden rounded-lg">
        <Card
          className={cn("mb-2 rounded-lg", {
            "border border-primary-500": isOpen,
            "border-0 shadow-none": !isOpen,
          })}
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
                          <MinusCircledIcon className="h-5 w-5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border border-gray-400 bg-white shadow p-4 pointer-events-none"
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
                  <div className="block text-sm font-medium text-gray-500 mb-1">
                    {t("onset_date")}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 md:h-9 w-full justify-start font-normal"
                        disabled={disabled || !!symptom.id}
                      >
                        {symptom.onset?.onset_datetime ? (
                          new Date(
                            symptom.onset.onset_datetime,
                          ).toLocaleDateString()
                        ) : (
                          <span className="text-muted-foreground">
                            {t("select_date")}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-auto" align="start">
                      <Tabs
                        value={activeTab}
                        onValueChange={(v) =>
                          setActiveTab(v as "absolute" | "relative")
                        }
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="absolute">
                            {t("absolute_date")}
                          </TabsTrigger>
                          <TabsTrigger value="relative">
                            {t("relative_date")}
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="absolute" className="p-0">
                          <Calendar
                            mode="single"
                            selected={
                              symptom.onset?.onset_datetime
                                ? new Date(symptom.onset.onset_datetime)
                                : undefined
                            }
                            onSelect={(date: Date | undefined) => {
                              handleDateChange(date);
                            }}
                          />
                        </TabsContent>
                        <TabsContent value="relative" className="p-0">
                          <RelativeDatePicker
                            value={
                              symptom.onset?.onset_datetime
                                ? new Date(symptom.onset.onset_datetime)
                                : undefined
                            }
                            onDateChange={(date) => handleDateChange(date)}
                          />
                        </TabsContent>
                      </Tabs>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <div className="block text-sm font-medium text-gray-500 mb-1">
                    {t("status")}
                  </div>
                  <Select
                    value={symptom.clinical_status}
                    onValueChange={handleStatusChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
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
                </div>
                <div>
                  <div className="block text-sm font-medium text-gray-500 mb-1">
                    {t("severity")}
                  </div>
                  <Select
                    value={symptom.severity}
                    onValueChange={handleSeverityChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
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
                </div>
                <div>
                  <div className="block text-sm font-medium text-gray-500 mb-1">
                    {t("notes")}
                  </div>
                  <Input
                    type="text"
                    placeholder={t("add_notes_about_symptom")}
                    value={symptom.note || ""}
                    onChange={handleNotesChange}
                    disabled={disabled}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      {/* Notes for Desktop */}
      {showNotes && (
        <div className="hidden md:block px-3 pb-3">
          <Input
            type="text"
            placeholder={t("add_notes_about_symptom")}
            value={symptom.note || ""}
            onChange={handleNotesChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
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
  const [showSymptomSelection, setShowSymptomSelection] = useState(false);
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);
  const [newSymptom, setNewSymptom] = useState<Partial<SymptomRequest>>({
    ...SYMPTOM_INITIAL_VALUE,
    onset: { onset_datetime: new Date().toISOString().split("T")[0] },
  });
  const isMobile = useBreakpoints({ default: true, md: false });

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

  const handleCodeSelect = (code: Code) => {
    const isDuplicate = symptoms.some(
      (symptom) =>
        symptom.code.code === code.code &&
        symptom.verification_status !== "entered_in_error",
    );

    if (isDuplicate) {
      toast.warning(t("symptom_already_exist_warning"));
      return;
    }

    setSelectedCode(code);
    setNewSymptom((prev) => ({ ...prev, code }));

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

    setSelectedCode(null);
    setShowSymptomSelection(false);
    setNewSymptom({
      ...SYMPTOM_INITIAL_VALUE,
      onset: { onset_datetime: new Date().toISOString().split("T")[0] },
    });
  };

  const handleConfirmSymptom = () => {
    if (!selectedCode) return;
    addNewSymptom(selectedCode);
  };

  const handleCloseDrawer = () => {
    setShowSymptomSelection(false);
    handleBackToValueSet();
  };

  const handleBackToValueSet = () => {
    setSelectedCode(null);
    setNewSymptom({
      ...SYMPTOM_INITIAL_VALUE,
      onset: { onset_datetime: new Date().toISOString().split("T")[0] },
    });
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

  const [activeTab, setActiveTab] = useState<"absolute" | "relative">(
    "absolute",
  );

  const handleDateChange = (date: Date | undefined) => {
    setNewSymptom((prev) => ({
      ...prev,
      onset: { onset_datetime: dateQueryString(date) },
    }));
  };

  const symptomDetailsContent = (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            {t("onset_date")}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 md:h-9 w-full justify-start font-normal"
                disabled={disabled || !!newSymptom.id}
              >
                {newSymptom.onset?.onset_datetime ? (
                  new Date(newSymptom.onset.onset_datetime).toLocaleDateString()
                ) : (
                  <span className="text-muted-foreground">
                    {t("select_date")}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto" align="start">
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  setActiveTab(v as "absolute" | "relative")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="absolute">
                    {t("absolute_date")}
                  </TabsTrigger>
                  <TabsTrigger value="relative">
                    {t("relative_date")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="absolute" className="p-0">
                  <Calendar
                    mode="single"
                    selected={
                      newSymptom.onset?.onset_datetime
                        ? new Date(newSymptom.onset.onset_datetime)
                        : undefined
                    }
                    onSelect={(date: Date | undefined) => {
                      handleDateChange(date);
                    }}
                  />
                </TabsContent>
                <TabsContent value="relative" className="p-0">
                  <RelativeDatePicker
                    value={
                      newSymptom.onset?.onset_datetime
                        ? new Date(newSymptom.onset.onset_datetime)
                        : undefined
                    }
                    onDateChange={(date) => handleDateChange(date)}
                  />
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">{t("status")}</div>
          <Select
            value={newSymptom.clinical_status}
            onValueChange={(value) =>
              setNewSymptom((prev) => ({
                ...prev,
                clinical_status: value as SymptomRequest["clinical_status"],
              }))
            }
          >
            <SelectTrigger className="h-9">
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
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            {t("severity")}
          </div>
          <Select
            value={newSymptom.severity}
            onValueChange={(value) =>
              setNewSymptom((prev) => ({
                ...prev,
                severity: value as SymptomRequest["severity"],
              }))
            }
          >
            <SelectTrigger className="h-9">
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
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">{t("notes")}</div>
          <Input
            type="text"
            placeholder={t("add_notes_about_symptom")}
            value={newSymptom.note || ""}
            onChange={(e) =>
              setNewSymptom((prev) => ({
                ...prev,
                note: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="flex justify-between space-x-2">
        <Button variant="outline" onClick={handleBackToValueSet}>
          {t("cancel")}
        </Button>
        <Button onClick={handleConfirmSymptom}>{t("add_symptom")}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {symptoms.length > 0 && (
        <div className="md:rounded-lg md:border md:border-gray-200">
          <div className="hidden md:grid md:grid-cols-12 items-center gap-4 p-3 bg-gray-50 text-sm font-medium text-gray-500">
            <div className="col-span-5">{t("symptom")}</div>
            <div className="col-span-2 text-center">{t("date")}</div>
            <div className="col-span-2 text-center">{t("status")}</div>
            <div className="col-span-2 text-center">{t("severity")}</div>
            <div className="col-span-1 text-center">{t("action")}</div>
          </div>
          <div className="md:divide-y md:divide-gray-200">
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
        </div>
      )}

      {isMobile && showSymptomSelection ? (
        <>
          <ValueSetSelect
            system="system-condition-code"
            placeholder={t("add_another_symptom")}
            onSelect={handleCodeSelect}
            disabled={disabled}
          />
          <CommandDrawer
            open={showSymptomSelection}
            onOpenChange={setShowSymptomSelection}
          >
            <Command className="px-0">
              {selectedCode ? (
                <>
                  <div className="py-3 px-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      {selectedCode.display}
                    </h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleBackToValueSet}
                    >
                      <CareIcon icon="l-times" className="h-5 w-5" />
                    </Button>
                  </div>
                  <CommandList className="max-h-[100vh] overflow-y-auto pb-1">
                    {symptomDetailsContent}
                  </CommandList>
                </>
              ) : (
                <>
                  <div className="py-3 px-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      {t("select_symptom")}
                    </h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleCloseDrawer}
                    >
                      <CareIcon icon="l-times" className="h-5 w-5" />
                    </Button>
                  </div>
                  <CommandList className="max-h-[70vh] overflow-y-auto pb-8">
                    <ValueSetSelect
                      system="system-condition-code"
                      placeholder={t("search_symptom")}
                      onSelect={handleCodeSelect}
                      disabled={disabled}
                      hideTrigger={true}
                      controlledOpen={true}
                    />
                  </CommandList>
                </>
              )}
            </Command>
          </CommandDrawer>
        </>
      ) : (
        <ValueSetSelect
          system="system-condition-code"
          placeholder={t("add_another_symptom")}
          onSelect={handleCodeSelect}
          disabled={disabled}
        />
      )}
    </div>
  );
}
