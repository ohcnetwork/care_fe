import {
  CheckCircledIcon,
  CircleBackslashIcon,
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

import { CATEGORY_ICONS } from "@/components/Patient/allergy/list";
import { EntitySelectionDrawer } from "@/components/Questionnaire/EntitySelectionDrawer";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import type { Code } from "@/types/base/code/code";
import {
  ALLERGY_VERIFICATION_STATUS,
  type AllergyIntolerance,
  type AllergyIntoleranceRequest,
  type AllergyVerificationStatus,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface AllergyQuestionProps {
  patientId: string;
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
}

const ALLERGY_INITIAL_VALUE: Partial<AllergyIntoleranceRequest> = {
  code: { code: "", display: "", system: "" },
  clinical_status: "active",
  verification_status: "confirmed",
  category: "medication",
  criticality: "low",
};

type AllergyCategory = "food" | "medication" | "environment" | "biologic";

const ALLERGY_CATEGORIES: Record<AllergyCategory, string> = {
  food: "Food",
  medication: "Medication",
  environment: "Environment",
  biologic: "Biologic",
};

function CategorySelect({
  category,
  onValueChange,
  disabled,
  hasId,
}: {
  category: AllergyCategory;
  onValueChange: (value: AllergyCategory) => void;
  disabled?: boolean;
  hasId: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select
      value={category}
      onValueChange={onValueChange}
      disabled={disabled || hasId}
    >
      <SelectTrigger className="h-9 w-full lg:h-8 lg:w-[2rem] lg:px-0 lg:[&>svg]:hidden lg:flex lg:items-center lg:justify-center">
        <SelectValue
          placeholder={t("select_category")}
          className="lg:text-center lg:h-full lg:flex lg:items-center lg:justify-center lg:m-0 lg:p-0"
        >
          {category && (
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[category]}
              <span className="block lg:hidden">
                {ALLERGY_CATEGORIES[category]}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(
          Object.entries(ALLERGY_CATEGORIES) as [AllergyCategory, string][]
        ).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[value]}
              <span>{label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CriticalitySelect({
  criticality,
  onValueChange,
  disabled,
}: {
  criticality: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select
      value={criticality}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="h-9 mt-1 lg:h-8 lg:w-full lg:px-1 lg:text-sm lg:mt-0">
        <SelectValue placeholder={t("critical")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">{t("low")}</SelectItem>
        <SelectItem value="high">{t("high")}</SelectItem>
        <SelectItem value="unable_to_assess">
          {t("unable_to_assess")}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function StatusSelect({
  verificationStatus,
  onValueChange,
  disabled,
  isExistingRecord,
}: {
  verificationStatus: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  isExistingRecord?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select
      value={verificationStatus}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="h-9 mt-1 lg:h-8 lg:w-full lg:px-1 lg:text-sm lg:mt-0">
        <SelectValue placeholder={t("verify")} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ALLERGY_VERIFICATION_STATUS).map(
          ([value, label]) =>
            (isExistingRecord || value !== "entered_in_error") && (
              <SelectItem key={value} value={value}>
                {t(label)}
              </SelectItem>
            ),
        )}
      </SelectContent>
    </Select>
  );
}

function OccurrencePicker({
  lastOccurrence,
  onChange,
  disabled,
}: {
  lastOccurrence?: string;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <CombinedDatePicker
      value={lastOccurrence ? new Date(lastOccurrence) : undefined}
      onChange={onChange}
      disabled={disabled}
      blockDate={(date) => date > new Date()}
      buttonClassName="h-9 mt-1 lg:h-8 lg:text-sm lg:px-2 lg:justify-start lg:font-normal lg:w-full lg:mt-0"
    />
  );
}

function StatusButtons({
  clinicalStatus,
  onUpdate,
  disabled,
}: {
  clinicalStatus: string;
  onUpdate: (updates: Partial<AllergyIntoleranceRequest>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 col-span-2">
      {clinicalStatus !== "active" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ clinical_status: "active" })}
          disabled={disabled}
        >
          <CheckCircledIcon className="size-4 mr-2" />
          {t("mark_active")}
        </Button>
      )}
      {clinicalStatus !== "inactive" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ clinical_status: "inactive" })}
          disabled={disabled}
        >
          <CircleBackslashIcon className="size-4 mr-2" />
          {t("mark_inactive")}
        </Button>
      )}
      {clinicalStatus !== "resolved" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ clinical_status: "resolved" })}
          disabled={disabled}
        >
          <CheckCircledIcon className="size-4 mr-2 text-green-600" />
          {t("mark_resolved")}
        </Button>
      )}
    </div>
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
      value={note ?? ""}
      onChange={onChange}
      disabled={disabled}
      className="mt-1 lg:mt-0.5"
    />
  );
}

function convertToAllergyRequest(
  allergy: AllergyIntolerance,
): AllergyIntoleranceRequest {
  return {
    id: allergy.id,
    code: allergy.code,
    clinical_status: allergy.clinical_status,
    verification_status: allergy.verification_status,
    category: allergy.category,
    criticality: allergy.criticality,
    last_occurrence: allergy.last_occurrence
      ? dateQueryString(new Date(allergy.last_occurrence))
      : undefined,
    note: allergy.note,
    encounter: allergy.encounter,
  };
}

interface AllergyItemProps {
  allergy: AllergyIntoleranceRequest;
  disabled?: boolean;
  onUpdate?: (allergy: Partial<AllergyIntoleranceRequest>) => void;
  onRemove?: () => void;
}

const AllergyItem = ({
  allergy,
  disabled,
  onUpdate,
  onRemove,
}: AllergyItemProps) => {
  const { t } = useTranslation();
  const [showNotes, setShowNotes] = useState(allergy.note !== undefined);
  const desktopLayout = useBreakpoints({ lg: true, default: false });
  if (desktopLayout) {
    return (
      <>
        <TableRow
          className={cn({
            "opacity-40 pointer-events-none": disabled,
            "opacity-60": allergy.clinical_status === "inactive",
            "[&_*]:line-through": allergy.clinical_status === "resolved",
          })}
        >
          <TableCell className="py-1 pr-0">
            <CategorySelect
              category={allergy.category}
              onValueChange={(value: AllergyCategory) =>
                onUpdate?.({ category: value })
              }
              disabled={disabled}
              hasId={!!allergy.id}
            />
          </TableCell>
          <TableCell className="font-medium py-1 pl-1">
            {allergy.code.display}
          </TableCell>
          <TableCell className="py-1 px-0.5">
            <CriticalitySelect
              criticality={allergy.criticality}
              onValueChange={(value) => onUpdate?.({ criticality: value })}
              disabled={disabled}
            />
          </TableCell>
          <TableCell className="py-1 px-0.5">
            <StatusSelect
              verificationStatus={allergy.verification_status}
              onValueChange={(value) => {
                onUpdate?.({
                  verification_status: value as AllergyVerificationStatus,
                });
              }}
              isExistingRecord={!!allergy.id}
              disabled={disabled}
            />
          </TableCell>
          <TableCell className="py-1 px-1">
            <OccurrencePicker
              lastOccurrence={allergy.last_occurrence}
              onChange={(date) =>
                onUpdate?.({
                  last_occurrence: dateQueryString(date),
                })
              }
              disabled={disabled}
            />
          </TableCell>
          <TableCell className="py-1 px-0 flex justify-center items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  className="size-8"
                >
                  <DotsVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowNotes((n) => !n)}>
                  <Pencil2Icon className="size-4 mr-2" />
                  {showNotes
                    ? t("hide_notes")
                    : allergy.note
                      ? t("show_notes")
                      : t("add_notes")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {allergy.clinical_status !== "active" && (
                  <DropdownMenuItem
                    onClick={() =>
                      onUpdate?.({
                        clinical_status: "active",
                      })
                    }
                    disabled={disabled}
                  >
                    <CheckCircledIcon className="size-4 mr-2" />
                    {t("mark_active")}
                  </DropdownMenuItem>
                )}
                {allergy.clinical_status !== "inactive" && (
                  <DropdownMenuItem
                    onClick={() =>
                      onUpdate?.({
                        clinical_status: "inactive",
                      })
                    }
                    disabled={disabled}
                  >
                    <CircleBackslashIcon className="size-4 mr-2" />
                    {t("mark_inactive")}
                  </DropdownMenuItem>
                )}
                {allergy.clinical_status !== "resolved" && (
                  <DropdownMenuItem
                    onClick={() =>
                      onUpdate?.({
                        clinical_status: "resolved",
                      })
                    }
                    disabled={disabled}
                  >
                    <CheckCircledIcon className="size-4 mr-2 text-green-600" />
                    {t("mark_resolved")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onRemove}
                  disabled={allergy.verification_status === "entered_in_error"}
                >
                  <MinusCircledIcon className="size-4 mr-2" />
                  {allergy.verification_status === "entered_in_error"
                    ? t("already_marked_as_error")
                    : t("remove_allergy")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {showNotes && (
          <TableRow>
            <TableCell colSpan={6} className="px-4 py-2">
              <Label className="text-xs text-gray-500">{t("note")}</Label>
              <NotesInput
                note={allergy.note}
                onChange={(e) => onUpdate?.({ note: e.target.value })}
                disabled={disabled}
              />
            </TableCell>
          </TableRow>
        )}
      </>
    );
  }

  // Mobile view layout
  return (
    <div className="grid grid-cols-2 gap-2 space-y-4">
      <div>
        <Label className="mb-1">{t("category")}</Label>
        <CategorySelect
          category={allergy.category}
          onValueChange={(value: AllergyCategory) =>
            onUpdate?.({ category: value })
          }
          disabled={disabled}
          hasId={!!allergy.id}
        />
      </div>

      <div>
        <Label>{t("criticality")}</Label>
        <CriticalitySelect
          criticality={allergy.criticality}
          onValueChange={(value) => onUpdate?.({ criticality: value })}
          disabled={disabled}
        />
      </div>

      <div>
        <Label>{t("status")}</Label>
        <StatusSelect
          verificationStatus={allergy.verification_status}
          onValueChange={(value) => {
            onUpdate?.({
              verification_status: value as AllergyVerificationStatus,
            });
          }}
          disabled={disabled}
          isExistingRecord={!!allergy.id}
        />
      </div>

      <div className="col-span-2">
        <Label>{t("occurrence")}</Label>
        <OccurrencePicker
          lastOccurrence={allergy.last_occurrence}
          onChange={(date) =>
            onUpdate?.({
              last_occurrence: dateQueryString(date),
            })
          }
          disabled={disabled}
        />
      </div>

      <StatusButtons
        clinicalStatus={allergy.clinical_status}
        onUpdate={onUpdate || (() => {})}
        disabled={disabled}
      />

      <div className="col-span-2">
        <Label>{t("note")}</Label>
        <NotesInput
          note={allergy.note}
          onChange={(e) => onUpdate?.({ note: e.target.value })}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export function AllergyQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  patientId,
}: AllergyQuestionProps) {
  const { t } = useTranslation();

  const isPreview = patientId === "preview";
  const allergies =
    (questionnaireResponse.values?.[0]?.value as AllergyIntoleranceRequest[]) ||
    [];
  const [expandedAllergyIndex, setExpandedAllergyIndex] = useState<
    number | null
  >(null);

  const [newAllergyInSheet, setNewAllergyInSheet] =
    useState<AllergyIntoleranceRequest | null>(null);
  const isMobile = useBreakpoints({ default: true, lg: false });

  const { data: patientAllergies } = useQuery({
    queryKey: ["allergies", patientId],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: {
        limit: 100,
      },
    }),
    enabled: !isPreview,
  });

  useEffect(() => {
    if (patientAllergies?.results) {
      updateQuestionnaireResponseCB(
        [
          {
            type: "allergy_intolerance",
            value: patientAllergies.results.map(convertToAllergyRequest),
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  }, [patientAllergies]);

  const handleAddAllergy = (code: Code) => {
    const newAllergy = {
      ...ALLERGY_INITIAL_VALUE,
      code,
    } as AllergyIntoleranceRequest;
    if (isMobile) {
      setNewAllergyInSheet(newAllergy);
    } else {
      addNewAllergy(newAllergy);
    }
  };

  const addNewAllergy = (allergy: AllergyIntoleranceRequest) => {
    const newAllergies = [...allergies, allergy];
    updateQuestionnaireResponseCB(
      [{ type: "allergy_intolerance", value: newAllergies }],
      questionnaireResponse.question_id,
    );
    setExpandedAllergyIndex(newAllergies.length - 1);
    setNewAllergyInSheet(null);
  };

  const handleConfirmAllergy = () => {
    if (!newAllergyInSheet) return;
    addNewAllergy(newAllergyInSheet);
  };

  const handleRemoveAllergy = (index: number) => {
    const allergy = allergies[index];
    if (allergy.id) {
      // For existing records, update verification status to entered_in_error
      const newAllergies = allergies.map((a, i) =>
        i === index
          ? { ...a, verification_status: "entered_in_error" as const }
          : a,
      ) as AllergyIntoleranceRequest[];
      updateQuestionnaireResponseCB(
        [
          {
            type: "allergy_intolerance",
            value: newAllergies,
          },
        ],
        questionnaireResponse.question_id,
      );
    } else {
      // For new records, remove them completely
      const newAllergies = allergies.filter((_, i) => i !== index);
      updateQuestionnaireResponseCB(
        [
          {
            type: "allergy_intolerance",
            value: newAllergies,
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  };

  const handleUpdateAllergy = (
    index: number,
    updates: Partial<AllergyIntoleranceRequest>,
  ) => {
    const newAllergies = allergies.map((allergy, i) =>
      i === index ? { ...allergy, ...updates } : allergy,
    );
    updateQuestionnaireResponseCB(
      [{ type: "allergy_intolerance", value: newAllergies }],
      questionnaireResponse.question_id,
    );
  };

  const addAllergyPlaceholder = t("add_allergy", {
    count: allergies.length + 1,
  });

  return (
    <div className="space-y-4">
      {allergies.length > 0 && (
        <div className="rounded-lg lg:border lg:border-gray-200">
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[10%] max-w-[3rem]"></TableHead>
                  <TableHead className="w-[40%]">{t("substance")}</TableHead>
                  <TableHead className="w-[15%] text-center">
                    {t("criticality")}
                  </TableHead>
                  <TableHead className="w-[15%] text-center">
                    {t("status")}
                  </TableHead>
                  <TableHead className="w-[15%] text-center">
                    {t("occurrence")}
                  </TableHead>
                  <TableHead className="w-[5%] text-center">
                    {t("action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allergies.map((allergy, index) => (
                  <AllergyItem
                    key={index}
                    allergy={allergy}
                    disabled={
                      disabled ||
                      patientAllergies?.results[index]?.verification_status ===
                        "entered_in_error"
                    }
                    onUpdate={(updates) => handleUpdateAllergy(index, updates)}
                    onRemove={() => handleRemoveAllergy(index)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="lg:hidden">
            {allergies.map((allergy, index) => (
              <Collapsible
                key={index}
                open={expandedAllergyIndex === index}
                onOpenChange={() => {
                  setExpandedAllergyIndex(
                    expandedAllergyIndex === index ? null : index,
                  );
                }}
                className="mb-2"
              >
                <Card
                  className={cn(
                    "rounded-lg",
                    expandedAllergyIndex === index &&
                      "border border-primary-500 bg-gray-50",
                    expandedAllergyIndex !== index && "border-0 shadow-none",
                    (disabled ||
                      patientAllergies?.results[index]?.verification_status ===
                        "entered_in_error") &&
                      "opacity-40",
                    allergy.clinical_status === "inactive" && "opacity-60",
                    allergy.clinical_status === "resolved" && "line-through",
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader
                      className={cn(
                        "p-2 rounded-lg shadow-none bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors",
                        expandedAllergyIndex !== index &&
                          "bg-gray-200 border border-gray-300",
                      )}
                    >
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle
                              className={cn(
                                "text-base text-gray-950 break-words",
                                allergy.clinical_status === "resolved" &&
                                  "line-through",
                                allergy.clinical_status === "inactive" &&
                                  "opacity-60",
                              )}
                              title={allergy.code.display}
                            >
                              {allergy.code.display}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {expandedAllergyIndex === index && (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAllergy(index);
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
                              {expandedAllergyIndex === index ? (
                                <ChevronsDownUp className="size-5" />
                              ) : (
                                <ChevronsUpDown className="size-5" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {expandedAllergyIndex !== index && (
                          <div
                            className={cn("text-sm mt-1 text-gray-600", {
                              "line-through":
                                allergy.clinical_status === "resolved",
                            })}
                          >
                            {t(allergy.category)}
                            {" · "}
                            {t(allergy.criticality)}
                            {" · "}
                            {t(allergy.verification_status)}
                            {allergy.last_occurrence && (
                              <>
                                {" · "}
                                {format(
                                  new Date(allergy.last_occurrence),
                                  "MMM d, yyyy",
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent
                      className={cn(
                        "p-3 pt-2 space-y-3 rounded-lg bg-gray-50",
                        disabled && "pointer-events-none",
                      )}
                    >
                      <AllergyItem
                        allergy={allergy}
                        disabled={disabled}
                        onUpdate={(updates) =>
                          handleUpdateAllergy(index, updates)
                        }
                        onRemove={() => handleRemoveAllergy(index)}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      )}

      {isMobile ? (
        <EntitySelectionDrawer
          open={!!newAllergyInSheet}
          onOpenChange={(open) => {
            if (!open) {
              setNewAllergyInSheet(null);
            }
          }}
          system="system-allergy-code"
          entityType="allergy"
          disabled={disabled}
          onEntitySelected={handleAddAllergy}
          onConfirm={handleConfirmAllergy}
          placeholder={addAllergyPlaceholder}
        >
          {newAllergyInSheet && (
            <AllergyItem
              allergy={newAllergyInSheet}
              disabled={disabled}
              onUpdate={(updates) => {
                setNewAllergyInSheet((prev) =>
                  prev
                    ? {
                        ...prev,
                        ...updates,
                      }
                    : null,
                );
              }}
              onRemove={() => {}}
            />
          )}
        </EntitySelectionDrawer>
      ) : (
        <ValueSetSelect
          system="system-allergy-code"
          placeholder={addAllergyPlaceholder}
          onSelect={handleAddAllergy}
          disabled={disabled}
        />
      )}
    </div>
  );
}
