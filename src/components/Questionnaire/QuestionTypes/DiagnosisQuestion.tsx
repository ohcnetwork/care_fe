import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import { Command, CommandList } from "@/components/ui/command";
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

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
  const { t } = useTranslation();

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
  const isMobile = useBreakpoints({ default: true, md: false });

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

  const handleCloseDrawer = () => {
    setShowCategorySelection(false);
    handleBackToValueSet();
  };

  const handleBackToValueSet = () => {
    setSelectedCode(null);
    setSelectedCategory("encounter_diagnosis");
    setNewDiagnosis({
      ...DIAGNOSIS_INITIAL_VALUE,
      onset: {
        onset_datetime: new Date().toISOString().split("T")[0],
      },
    });
  };

  const diagnosisDetailsContent = (
    <div className="space-y-4 p-4">
      <CategorySelector
        categories={DIAGNOSIS_CATEGORY}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">{t("date")}</Label>
          <CombinedDatePicker
            value={
              newDiagnosis.onset?.onset_datetime
                ? new Date(newDiagnosis.onset.onset_datetime)
                : undefined
            }
            onChange={(date) =>
              setNewDiagnosis((prev) => ({
                ...prev,
                onset: { onset_datetime: dateQueryString(date) },
              }))
            }
            dateFormat="P"
            disabled={disabled || !!newDiagnosis.id}
            buttonClassName="h-8 md:h-9 w-full justify-start font-normal"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">{t("status")}</Label>
          <Select
            value={newDiagnosis.clinical_status}
            onValueChange={(value) =>
              setNewDiagnosis((prev) => ({
                ...prev,
                clinical_status: value as DiagnosisRequest["clinical_status"],
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
                <SelectItem key={status} value={status} className="capitalize">
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
                <SelectItem key={status} value={status} className="capitalize">
                  {t(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">{t("notes")}</Label>
          <Input
            type="text"
            placeholder={t("add_notes_about_diagnosis")}
            value={newDiagnosis.note || ""}
            onChange={(e) =>
              setNewDiagnosis((prev) => ({
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
        <Button onClick={handleCategoryConfirm}>{t("add_diagnosis")}</Button>
      </div>
    </div>
  );

  const desktopDiagnosisContent = (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {selectedCode && (
            <Label className="text-sm font-medium">
              {selectedCode.display}
            </Label>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleCloseDrawer}>
          {t("cancel")}
        </Button>
      </div>
      <CategorySelector
        categories={DIAGNOSIS_CATEGORY}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        gridCols="grid-cols-1 md:grid-cols-2"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">{t("date")}</Label>
          <CombinedDatePicker
            value={
              newDiagnosis.onset?.onset_datetime
                ? new Date(newDiagnosis.onset.onset_datetime)
                : undefined
            }
            onChange={(date) =>
              setNewDiagnosis((prev) => ({
                ...prev,
                onset: { onset_datetime: dateQueryString(date) },
              }))
            }
            dateFormat="P"
            disabled={disabled}
            buttonClassName="h-9 w-full justify-start font-normal"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">{t("status")}</Label>
          <Select
            value={newDiagnosis.clinical_status}
            onValueChange={(value) =>
              setNewDiagnosis((prev) => ({
                ...prev,
                clinical_status: value as DiagnosisRequest["clinical_status"],
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
                <SelectItem key={status} value={status} className="capitalize">
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
                <SelectItem key={status} value={status} className="capitalize">
                  {t(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button onClick={handleCategoryConfirm}>{t("add_diagnosis")}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
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
                    disabled={disabled}
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
                disabled={disabled}
                onUpdate={(updates) => handleUpdateDiagnosis(index, updates)}
                onRemove={() => handleRemoveDiagnosis(index)}
              />
            ))}
          </div>
        </div>
      )}

      {isMobile && showCategorySelection ? (
        <>
          <ValueSetSelect
            system="system-condition-code"
            placeholder={t("add_another_diagnosis")}
            onSelect={handleCodeSelect}
            disabled={disabled}
          />
          <Sheet
            open={showCategorySelection}
            onOpenChange={setShowCategorySelection}
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
                  <SheetContent
                    side="bottom"
                    className="h-[80vh] px-0 pt-2 pb-0 rounded-t-lg"
                  >
                    <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto rounded-full bg-gray-300 mt-2" />
                    <div className="mt-6 h-full">
                      <CommandList className="max-h-[calc(80vh-2rem)] overflow-y-auto">
                        {diagnosisDetailsContent}
                      </CommandList>
                    </div>
                  </SheetContent>
                </>
              ) : (
                <>
                  <div className="py-3 px-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      {t("select_diagnosis")}
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
                  <SheetContent
                    side="bottom"
                    className="h-[80vh] px-0 pt-2 pb-0 rounded-t-lg"
                  >
                    <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto rounded-full bg-gray-300 mt-2" />
                    <div className="mt-6 h-full">
                      <CommandList className="max-h-[calc(80vh-2rem)] overflow-y-auto">
                        <ValueSetSelect
                          system="system-condition-code"
                          placeholder={t("add_another_diagnosis")}
                          onSelect={handleCodeSelect}
                          disabled={disabled}
                          hideTrigger={true}
                          controlledOpen={true}
                        />
                      </CommandList>
                    </div>
                  </SheetContent>
                </>
              )}
            </Command>
          </Sheet>
        </>
      ) : showCategorySelection ? (
        desktopDiagnosisContent
      ) : (
        <ValueSetSelect
          system="system-condition-code"
          placeholder={t("add_another_diagnosis")}
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
      <TableRow
        className={cn(
          diagnosis.verification_status === "entered_in_error" &&
            "opacity-40 pointer-events-none",
          diagnosis.category === "chronic_condition" && "bg-yellow-50/50",
        )}
      >
        <TableCell className="py-1">
          <div className="flex items-center space-x-2 min-w-0">
            <div
              className="font-medium text-sm truncate max-w-[12rem]"
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
        </TableCell>
        <TableCell className="py-1">
          <CombinedDatePicker
            value={
              diagnosis.onset?.onset_datetime
                ? new Date(diagnosis.onset.onset_datetime)
                : undefined
            }
            onChange={(date) =>
              onUpdate?.({ onset: { onset_datetime: dateQueryString(date) } })
            }
            dateFormat="P"
            disabled={disabled || !!diagnosis.id}
            buttonClassName="h-8 md:h-9 w-full justify-start font-normal"
          />
        </TableCell>
        <TableCell className="py-1">
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
                <SelectItem key={status} value={status} className="capitalize">
                  {t(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="py-1">
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
                <SelectItem key={status} value={status} className="capitalize">
                  {t(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <Input
              type="text"
              placeholder={t("add_notes_about_diagnosis")}
              value={diagnosis.note || ""}
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
    <div
      className={cn("group hover:bg-gray-50", {
        "opacity-40 pointer-events-none":
          diagnosis.verification_status === "entered_in_error",
        "bg-yellow-50/50": diagnosis.category === "chronic_condition",
      })}
    >
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
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                            diagnosis.category === "chronic_condition"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700",
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
              <div>
                <div className="block text-sm font-medium text-gray-500 mb-1">
                  {t("diagnosis")} {t("date")}
                </div>
                <CombinedDatePicker
                  value={
                    diagnosis.onset?.onset_datetime
                      ? new Date(diagnosis.onset.onset_datetime)
                      : undefined
                  }
                  onChange={(date) =>
                    onUpdate?.({
                      onset: { onset_datetime: dateQueryString(date) },
                    })
                  }
                  dateFormat="P"
                  disabled={disabled || !!diagnosis.id}
                  buttonClassName="h-8 md:h-9 w-full justify-start font-normal"
                />
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-500 mb-1">
                  {t("status")}
                </div>
                <Select
                  value={diagnosis.clinical_status}
                  onValueChange={(value) =>
                    onUpdate?.({
                      clinical_status:
                        value as DiagnosisRequest["clinical_status"],
                    })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
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
                <div className="block text-sm font-medium text-gray-500 mb-1">
                  {t("verification")}
                </div>
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
                  <SelectTrigger className="h-9">
                    <SelectValue />
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
              <div>
                <div className="block text-sm font-medium text-gray-500 mb-1">
                  {t("notes")}
                </div>
                <Input
                  type="text"
                  placeholder={t("add_notes_about_diagnosis")}
                  value={diagnosis.note || ""}
                  onChange={(e) => onUpdate?.({ note: e.target.value })}
                  disabled={disabled}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

function CategorySelector({
  categories,
  selectedCategory,
  onCategorySelect,
  gridCols = "grid-cols-1",
}: {
  categories: readonly string[];
  selectedCategory: DiagnosisRequest["category"];
  onCategorySelect: Dispatch<SetStateAction<DiagnosisRequest["category"]>>;
  gridCols?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className={cn("grid gap-4", gridCols)}>
      {categories.map((category) => (
        <div
          key={category}
          className={cn(
            "relative flex flex-col p-4 rounded-lg border cursor-pointer transition-colors",
            selectedCategory === category
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
          )}
          onClick={() =>
            onCategorySelect(category as DiagnosisRequest["category"])
          }
        >
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="font-medium">
                {t(`Diagnosis_${category}__title`)}
              </div>
              <div className="flex-1 text-sm text-muted-foreground">
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
  );
}
