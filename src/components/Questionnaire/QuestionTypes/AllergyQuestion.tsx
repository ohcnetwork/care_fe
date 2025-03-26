"use client";

import {
  CheckCircledIcon,
  CircleBackslashIcon,
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CATEGORY_ICONS } from "@/components/Patient/allergy/list";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import {
  ALLERGY_VERIFICATION_STATUS,
  type AllergyIntolerance,
  type AllergyIntoleranceRequest,
  type AllergyVerificationStatus,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import type { Code } from "@/types/questionnaire/code";
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

export function AllergyQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  patientId,
}: AllergyQuestionProps) {
  const isPreview = patientId === "preview";
  const allergies =
    (questionnaireResponse.values?.[0]?.value as AllergyIntoleranceRequest[]) ||
    [];
  const [activeTab, setActiveTab] = useState<"absolute" | "relative">(
    "absolute",
  );

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
    const newAllergies = [
      ...allergies,
      { ...ALLERGY_INITIAL_VALUE, code },
    ] as AllergyIntoleranceRequest[];
    updateQuestionnaireResponseCB(
      [{ type: "allergy_intolerance", value: newAllergies }],
      questionnaireResponse.question_id,
    );
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

  return (
    <>
      {allergies.length > 0 && (
        <div className="rounded-lg border">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableHead className="w-[5%]">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allergies.map((allergy, index) => (
                  <AllergyTableRow
                    key={index}
                    allergy={allergy}
                    disabled={disabled}
                    onUpdate={(updates) => handleUpdateAllergy(index, updates)}
                    onRemove={() => handleRemoveAllergy(index)}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden divide-y divide-gray-200">
            {allergies.map((allergy, index) => (
              <div
                key={index}
                className={`p-3 space-y-3 ${
                  allergy.verification_status === "entered_in_error"
                    ? "opacity-40 pointer-events-none"
                    : allergy.clinical_status === "inactive"
                      ? "opacity-60"
                      : allergy.clinical_status === "resolved"
                        ? "line-through"
                        : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select
                      value={allergy.category}
                      onValueChange={(value) =>
                        handleUpdateAllergy(index, { category: value })
                      }
                      disabled={disabled || !!allergy.id}
                    >
                      <SelectTrigger className="h-8 w-[2rem] px-0 [&>svg]:hidden flex items-center justify-center">
                        <SelectValue>
                          {allergy.category &&
                            CATEGORY_ICONS[allergy.category as AllergyCategory]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ALLERGY_CATEGORIES).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                {CATEGORY_ICONS[value as AllergyCategory]}
                                <span>{label}</span>
                              </div>
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <span className="font-medium">{allergy.code.display}</span>
                  </div>
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
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateAllergy(index, {
                            note: allergy.note !== undefined ? undefined : "",
                          })
                        }
                      >
                        <Pencil2Icon className="h-4 w-4 mr-2" />
                        {allergy.note !== undefined
                          ? "Hide Notes"
                          : "Add Notes"}
                      </DropdownMenuItem>
                      {allergy.clinical_status !== "active" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateAllergy(index, {
                              clinical_status: "active",
                            })
                          }
                        >
                          <CheckCircledIcon className="h-4 w-4 mr-2" />
                          {t("mark_active")}
                        </DropdownMenuItem>
                      )}
                      {allergy.clinical_status !== "inactive" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateAllergy(index, {
                              clinical_status: "inactive",
                            })
                          }
                        >
                          <CircleBackslashIcon className="h-4 w-4 mr-2" />
                          {t("mark_inactive")}
                        </DropdownMenuItem>
                      )}
                      {allergy.clinical_status !== "resolved" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateAllergy(index, {
                              clinical_status: "resolved",
                            })
                          }
                        >
                          <CheckCircledIcon className="h-4 w-4 mr-2 text-green-600" />
                          {t("mark_resolved")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleRemoveAllergy(index)}
                      >
                        <MinusCircledIcon className="h-4 w-4 mr-2" />
                        {t("remove_allergy")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("criticality")}
                    </Label>
                    <Select
                      value={allergy.criticality}
                      onValueChange={(value) =>
                        handleUpdateAllergy(index, { criticality: value })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder="Critical" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="unable_to_assess">
                          Unable to Assess
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("status")}
                    </Label>
                    <Select
                      value={allergy.verification_status}
                      onValueChange={(value) =>
                        handleUpdateAllergy(index, {
                          verification_status:
                            value as AllergyVerificationStatus,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue placeholder="Verify" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ALLERGY_VERIFICATION_STATUS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("occurrence")}
                    </Label>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-7 text-sm px-2 justify-start font-normal w-full"
                          disabled={disabled}
                        >
                          {allergy.last_occurrence ? (
                            new Date(
                              allergy.last_occurrence,
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
                                allergy.last_occurrence
                                  ? new Date(allergy.last_occurrence)
                                  : undefined
                              }
                              onSelect={(date: Date | undefined) => {
                                handleUpdateAllergy(index, {
                                  last_occurrence: dateQueryString(date),
                                });
                              }}
                            />
                          </TabsContent>
                          <TabsContent value="relative" className="p-0">
                            <RelativeDatePicker
                              value={
                                allergy.last_occurrence
                                  ? new Date(allergy.last_occurrence)
                                  : undefined
                              }
                              onDateChange={(date) =>
                                handleUpdateAllergy(index, {
                                  last_occurrence: dateQueryString(date),
                                })
                              }
                            />
                          </TabsContent>
                        </Tabs>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {allergy.note !== undefined && (
                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("notes")}
                    </Label>
                    <Input
                      type="text"
                      placeholder="Add notes about the allergy..."
                      value={allergy.note ?? ""}
                      onChange={(e) =>
                        handleUpdateAllergy(index, { note: e.target.value })
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
        system="system-allergy-code"
        placeholder={t("search_for_allergies_to_add")}
        onSelect={handleAddAllergy}
        disabled={disabled}
      />
    </>
  );
}
interface AllergyItemProps {
  allergy: AllergyIntoleranceRequest;
  disabled?: boolean;
  onUpdate?: (allergy: Partial<AllergyIntoleranceRequest>) => void;
  onRemove?: () => void;
  activeTab: "absolute" | "relative";
  setActiveTab: Dispatch<SetStateAction<"absolute" | "relative">>;
}
const AllergyTableRow = ({
  allergy,
  disabled,
  onUpdate,
  onRemove,
  activeTab,
  setActiveTab,
}: AllergyItemProps) => {
  const [showNotes, setShowNotes] = useState(allergy.note !== undefined);

  const rowClassName = `group ${
    allergy.verification_status === "entered_in_error"
      ? "opacity-40 pointer-events-none"
      : allergy.clinical_status === "inactive"
        ? "opacity-60"
        : allergy.clinical_status === "resolved"
          ? "line-through"
          : ""
  }`;

  const handleNotesToggle = () => {
    if (showNotes) {
      setShowNotes(false);
      onUpdate?.({ note: undefined });
    } else {
      setShowNotes(true);
      onUpdate?.({ note: "" });
    }
  };

  return (
    <>
      <TableRow className={rowClassName}>
        <TableCell className="py-1 pr-0">
          <Select
            value={allergy.category}
            onValueChange={(value) => onUpdate?.({ category: value })}
            disabled={disabled || !!allergy.id}
          >
            <SelectTrigger className="h-7 w-[2rem] px-0 [&>svg]:hidden flex items-center justify-center">
              <SelectValue
                placeholder="Cat"
                className="text-center h-full flex items-center justify-center m-0 p-0"
              >
                {allergy.category &&
                  CATEGORY_ICONS[allergy.category as AllergyCategory]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(ALLERGY_CATEGORIES) as [
                  AllergyCategory,
                  string,
                ][]
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
        </TableCell>
        <TableCell className="font-medium py-1 pl-1">
          {allergy.code.display}
        </TableCell>
        <TableCell className="py-1 px-0.5">
          <Select
            value={allergy.criticality}
            onValueChange={(value) => onUpdate?.({ criticality: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-full px-1 text-sm">
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
        </TableCell>
        <TableCell className="py-1 px-0.5">
          <Select
            value={allergy.verification_status}
            onValueChange={(value) => {
              if (value in ALLERGY_VERIFICATION_STATUS) {
                onUpdate?.({
                  verification_status: value as AllergyVerificationStatus,
                });
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-full px-1 text-sm">
              <SelectValue placeholder={t("verify")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ALLERGY_VERIFICATION_STATUS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="py-1 px-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-7 text-sm px-2 justify-start font-normal w-full"
                disabled={disabled}
              >
                {allergy.last_occurrence ? (
                  new Date(allergy.last_occurrence).toLocaleDateString()
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
                      allergy.last_occurrence
                        ? new Date(allergy.last_occurrence)
                        : undefined
                    }
                    onSelect={(date: Date | undefined) => {
                      onUpdate?.({ last_occurrence: dateQueryString(date) });
                    }}
                  />
                </TabsContent>
                <TabsContent value="relative" className="p-0">
                  <RelativeDatePicker
                    value={
                      allergy.last_occurrence
                        ? new Date(allergy.last_occurrence)
                        : undefined
                    }
                    onDateChange={(date) => {
                      onUpdate?.({ last_occurrence: dateQueryString(date) });
                    }}
                  />
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </TableCell>
        <TableCell className="py-1 px-0 flex justify-center items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="h-7 w-6 px-0"
              >
                <DotsVerticalIcon className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleNotesToggle}>
                <Pencil2Icon className="h-4 w-4 mr-2" />
                {showNotes ? t("hide_notes") : t("add_notes")}
              </DropdownMenuItem>
              {allergy.clinical_status !== "active" && (
                <DropdownMenuItem
                  onClick={() => onUpdate?.({ clinical_status: "active" })}
                >
                  <CheckCircledIcon className="h-4 w-4 mr-2" />
                  {t("mark_active")}
                </DropdownMenuItem>
              )}
              {allergy.clinical_status !== "inactive" && (
                <DropdownMenuItem
                  onClick={() => onUpdate?.({ clinical_status: "inactive" })}
                >
                  <CircleBackslashIcon className="h-4 w-4 mr-2" />
                  {t("mark_inactive")}
                </DropdownMenuItem>
              )}
              {allergy.clinical_status !== "resolved" && (
                <DropdownMenuItem
                  onClick={() => onUpdate?.({ clinical_status: "resolved" })}
                >
                  <CheckCircledIcon className="h-4 w-4 mr-2 text-green-600" />
                  {t("mark_resolved")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onRemove}
              >
                <MinusCircledIcon className="h-4 w-4 mr-2" />
                {t("remove_allergy")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {showNotes && (
        <TableRow>
          <TableCell colSpan={6} className="px-4 py-2">
            <Label className="text-xs text-gray-500">{t("notes")}</Label>
            <Input
              type="text"
              placeholder={t("add_notes_about_the_allergy")}
              value={allergy.note ?? ""}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              disabled={disabled}
              className="mt-0.5"
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
