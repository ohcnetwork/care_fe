import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
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
  const [activeTab, setActiveTab] = useState<"absolute" | "relative">(
    "absolute",
  );

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
          <div className="hidden md:grid md:grid-cols-12 items-center gap-4 p-3 bg-gray-50 text-sm font-medium text-gray-500">
            <div className="col-span-5">{t("diagnosis")}</div>
            <div className="col-span-2 text-center">{t("date")}</div>
            <div className="col-span-2 text-center">{t("status")}</div>
            <div className="col-span-2 text-center">{t("verification")}</div>
            <div className="col-span-1 text-center">{t("action")}</div>
          </div>
          <div className="divide-y divide-gray-200">
            {sortedDiagnoses.map((diagnosis, index) => (
              <DiagnosisItem
                key={index}
                diagnosis={diagnosis}
                disabled={disabled}
                onUpdate={(updates) => handleUpdateDiagnosis(index, updates)}
                onRemove={() => handleRemoveDiagnosis(index)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start font-normal"
                    disabled={disabled}
                  >
                    {newDiagnosis.onset?.onset_datetime ? (
                      new Date(
                        newDiagnosis.onset.onset_datetime,
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
                          newDiagnosis.onset?.onset_datetime
                            ? new Date(newDiagnosis.onset.onset_datetime)
                            : undefined
                        }
                        onSelect={(date: Date | undefined) => {
                          setNewDiagnosis((prev) => ({
                            ...prev,
                            onset: { onset_datetime: dateQueryString(date) },
                          }));
                        }}
                      />
                    </TabsContent>
                    <TabsContent value="relative" className="p-0">
                      <RelativeDatePicker
                        value={
                          newDiagnosis.onset?.onset_datetime
                            ? new Date(newDiagnosis.onset.onset_datetime)
                            : undefined
                        }
                        onDateChange={(date) =>
                          setNewDiagnosis((prev) => ({
                            ...prev,
                            onset: { onset_datetime: dateQueryString(date) },
                          }))
                        }
                      />
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>
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
  activeTab: "absolute" | "relative";
  setActiveTab: Dispatch<SetStateAction<"absolute" | "relative">>;
}

const DiagnosisItem: React.FC<DiagnosisItemProps> = ({
  diagnosis,
  disabled,
  onUpdate,
  onRemove,
  activeTab,
  setActiveTab,
}) => {
  const [showNotes, setShowNotes] = useState(Boolean(diagnosis.note));

  return (
    <div
      className={cn("group hover:bg-gray-50", {
        "opacity-40 pointer-events-none":
          diagnosis.verification_status === "entered_in_error",
        "bg-yellow-50/50": diagnosis.category === "chronic_condition",
      })}
    >
      <div className="py-1 px-2 space-y-2 md:space-y-0 md:grid md:grid-cols-12 md:items-center md:gap-4">
        <div className="flex items-center justify-between md:col-span-5">
          <div className="flex items-center space-x-2 min-w-0">
            <div
              className="font-medium text-sm truncate flex-1"
              title={diagnosis.code.display}
            >
              {diagnosis.code.display}
            </div>
            <div
              className={cn(
                "text-xs px-2 py-0.5 rounded-full shrink-0",
                diagnosis.category === "chronic_condition"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700",
              )}
            >
              {t(`Diagnosis_${diagnosis.category}__title`)}
            </div>
          </div>
          <div className="md:hidden shrink-0">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 md:h-9 w-full justify-start font-normal"
                  disabled={disabled || !!diagnosis.id}
                >
                  {diagnosis.onset?.onset_datetime ? (
                    new Date(
                      diagnosis.onset.onset_datetime,
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
                        diagnosis.onset?.onset_datetime
                          ? new Date(diagnosis.onset.onset_datetime)
                          : undefined
                      }
                      onSelect={(date: Date | undefined) => {
                        onUpdate?.({
                          onset: { onset_datetime: dateQueryString(date) },
                        });
                      }}
                    />
                  </TabsContent>
                  <TabsContent value="relative" className="p-0">
                    <RelativeDatePicker
                      value={
                        diagnosis.onset?.onset_datetime
                          ? new Date(diagnosis.onset.onset_datetime)
                          : undefined
                      }
                      onDateChange={(date) =>
                        onUpdate?.({
                          onset: { onset_datetime: dateQueryString(date) },
                        })
                      }
                    />
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
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
