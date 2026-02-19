import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatDateTime, formatName, properCase } from "@/Utils/utils";
import React, { useEffect, useState } from "react";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { cn } from "@/lib/utils";
import { ResponseValue } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import {
  QuestionnaireResponse,
  QuestionnaireResponseStatus,
} from "@/types/questionnaire/questionnaireResponse";
import questionnaireResponseApi from "@/types/questionnaire/questionnaireResponseApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { t } from "i18next";
import { BanIcon, ChevronDown, MoreVertical, Printer } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

interface Props {
  encounterId?: string;
  patientId: string;
  isPrintPreview?: boolean;
  onlyUnstructured?: boolean;
  canAccess?: boolean;
  questionnaireSlug?: string;
  renderItem?: (response: QuestionnaireResponse) => React.ReactNode;
  subjectType?: string;
}

export function formatValue(
  value: ResponseValue["value"],
  type: string,
): string {
  if (!value) return "";

  // Handle complex objects
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  ) {
    return JSON.stringify(value);
  }

  switch (type) {
    case "dateTime":
      return value instanceof Date
        ? formatDateTime(value.toISOString(), "hh:mm A; DD/MM/YYYY")
        : formatDateTime(value.toString(), "hh:mm A; DD/MM/YYYY");
    case "date":
      return formatDateTime(value.toString());
    case "decimal":
    case "integer":
      return typeof value === "number" ? value.toString() : value.toString();
    case "boolean":
      return value === "true" ? t("yes") : t("no");
    case "time":
      return value.toString().slice(0, 5);
    default:
      return value.toString();
  }
}

function QuestionGroup({
  group,
  responses,
  parentTitle = "",
  isSingleGroup = false,
}: {
  group: Question;
  responses: QuestionnaireResponse["responses"];
  parentTitle?: string;
  isSingleGroup?: boolean;
}) {
  const { t } = useTranslation();
  const hasResponses = group.questions?.some((q) => {
    if (q.type === "group") {
      return q.questions?.some((subQ) =>
        responses.some((r) => r.question_id === subQ.id),
      );
    }
    return responses.some((r) => r.question_id === q.id);
  });

  if (!hasResponses) return null;

  const currentTitle = parentTitle
    ? `${parentTitle} - ${group.text}`
    : group.text;

  // Filter out questions with responses and split them for two-column layout
  const questionsWithResponses =
    group.questions?.reduce((acc: Question[], question) => {
      if (question.type === "structured") return acc;
      if (question.type === "group") return acc;

      const response = responses.find((r) => r.question_id === question.id);
      if (!response) return acc;

      const value = response.values[0]?.value;
      if (!value && !response.values[0]?.coding) return acc;

      acc.push(question);
      return acc;
    }, []) || [];

  // Check if any response has long text (>100 chars)
  const hasLongText = questionsWithResponses.some((question) => {
    const response = responses.find((r) => r.question_id === question.id);
    if (!response) return false;

    const value = response.values[0]?.value;
    const coding = response.values[0]?.coding;
    const text = [
      value?.toString() || "",
      coding?.display || "",
      coding?.code || "",
    ].join(" ");

    return text.length > 50;
  });

  // Use single column if any response has long text
  const shouldUseTwoColumns = isSingleGroup && !hasLongText;
  const midPoint = shouldUseTwoColumns
    ? Math.ceil(questionsWithResponses.length / 2)
    : questionsWithResponses.length;
  const leftQuestions = questionsWithResponses.slice(0, midPoint);
  const rightQuestions = shouldUseTwoColumns
    ? questionsWithResponses.slice(midPoint)
    : [];

  const renderQuestionRow = (question: Question) => {
    const response = responses.find((r) => r.question_id === question.id);
    if (!response) return null;

    const values = response.values;
    if (!values?.length) return null;

    const hasAnyValue = values.some((v) => v.value || v.coding);
    if (!hasAnyValue) return null;

    return (
      <TableRow key={question.id} className="flex flex-col md:table-row">
        <TableCell className="py-1 pl-0 align-top">
          <div className="text-sm text-gray-600 break-words whitespace-normal">
            {question.text}
          </div>
        </TableCell>
        <TableCell
          className="py-1 pr-0 align-top"
          colSpan={response.note ? 1 : 2}
        >
          <div className="text-sm font-medium break-words whitespace-pre-wrap">
            {values.map((val, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && ", "}
                {val.value && formatValue(val.value, question.type)}
                {val.unit && (
                  <span className="ml-1 text-gray-600">{val.unit.code}</span>
                )}
                {val.coding && (
                  <span className="ml-1 text-gray-600">
                    {val.coding.display} ({val.coding.code})
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </TableCell>
        {response.note && (
          <TableCell className="py-1 pr-0 align-top text-right md:table-cell">
            <div className="flex justify-end">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs shrink-0 px-2"
                  >
                    {t("see_note")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-w-[90vw] p-3">
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                    {response.note}
                  </p>
                </PopoverContent>
              </Popover>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <div className="border border-gray-200 rounded-md px-3 py-1.5">
      <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-1">
        {group.text}
      </h3>
      <div
        className={cn("w-full", {
          "grid md:grid-cols-2 grid-cols-1 gap-4": shouldUseTwoColumns,
        })}
      >
        {leftQuestions.length > 0 && (
          <div className="w-full">
            <Table className="w-full">
              <TableBody>{leftQuestions.map(renderQuestionRow)}</TableBody>
            </Table>
          </div>
        )}

        {shouldUseTwoColumns && rightQuestions.length > 0 && (
          <div className="w-full">
            <Table className="w-full">
              <TableBody>{rightQuestions.map(renderQuestionRow)}</TableBody>
            </Table>
          </div>
        )}

        {group.questions?.map((subQuestion, idx) => {
          if (subQuestion.type === "structured" || !subQuestion.type)
            return null;
          if (subQuestion.type !== "group") return null;

          return (
            <QuestionGroup
              key={idx}
              group={subQuestion}
              responses={responses}
              parentTitle={currentTitle}
            />
          );
        })}
      </div>
    </div>
  );
}

function ResponseActionsMenu({
  item,
  patientId,
}: {
  item: QuestionnaireResponse;
  patientId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isUnstructured = !!item.questionnaire;
  const isEnteredInError =
    item.status === QuestionnaireResponseStatus.EnteredInError;

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: mutate(questionnaireResponseApi.update, {
      pathParams: { patientId, responseId: item.id },
    }),
    onSuccess: () => {
      toast.success(t("questionnaire_response_marked_as_entered_in_error"));
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponses", patientId],
      });
      setShowConfirmDialog(false);
    },
  });

  if (isEnteredInError) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-gray-500"
            aria-label={t("more_actions")}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={`questionnaire_response/${item.id}/print`}>
            <DropdownMenuItem>
              <Printer className="size-4" />
              {t("print_this_response")}
            </DropdownMenuItem>
          </Link>
          {item.questionnaire && (
            <Link
              href={`questionnaire/${item.questionnaire.id}/responses/print`}
            >
              <DropdownMenuItem>
                <Printer className="size-4" />
                {t("print_all_responses", {
                  title: item.questionnaire.title,
                })}
              </DropdownMenuItem>
            </Link>
          )}
          {isUnstructured && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setShowConfirmDialog(true)}
                className="text-red-500 focus:text-red-700"
              >
                <BanIcon className="size-4" />
                {t("mark_as_entered_in_error")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={t("mark_as_entered_in_error")}
        description={t("questionnaire_response_entered_in_error_warning")}
        onConfirm={() =>
          updateStatus({ status: QuestionnaireResponseStatus.EnteredInError })
        }
        confirmText={t("confirm")}
        variant="destructive"
        disabled={isPending}
      />
    </>
  );
}

function ResponseCardContent({ item }: { item: QuestionnaireResponse }) {
  const { t } = useTranslation();
  const groups =
    item.questionnaire?.questions.filter(
      (q) =>
        q.type === "group" ||
        item.responses.some((r) => r.question_id === q.id),
    ) || [];

  // Split groups into two columns only if there are enough items
  const shouldUseTwoColumns = groups.length > 3;
  const midPoint = shouldUseTwoColumns
    ? Math.ceil(groups.length / 2)
    : groups.length;
  const leftGroups = groups.slice(0, midPoint);
  const rightGroups = shouldUseTwoColumns ? groups.slice(midPoint) : [];

  // Helper function to render a column of questions
  const renderColumn = (questions: Question[]) => {
    const result: React.ReactElement[] = [];
    let currentNonGroupQuestions: Question[] = [];

    const flushNonGroupQuestions = () => {
      if (currentNonGroupQuestions.length > 0) {
        result.push(
          <div
            key={`group-${result.length}`}
            className="border border-gray-200 rounded-md px-3 py-1.5"
          >
            <div className="w-full">
              <Table className="table-fixed w-full">
                <TableBody>
                  {currentNonGroupQuestions.map((question) => {
                    const response = item.responses.find(
                      (r) => r.question_id === question.id,
                    );
                    if (!response) return null;

                    const values = response.values;
                    if (!values?.length) return null;

                    const hasAnyValue = values.some((v) => v.value || v.coding);
                    if (!hasAnyValue) return null;

                    return (
                      <TableRow
                        key={question.id}
                        className="flex flex-col md:table-row"
                      >
                        <TableCell className="py-1 pl-0 align-top">
                          <div className="text-sm text-gray-600 break-words whitespace-normal">
                            {question.text}
                          </div>
                        </TableCell>
                        <TableCell
                          className="py-1 pr-0 align-top"
                          colSpan={response.note ? 1 : 2}
                        >
                          <div className="text-sm font-medium break-words whitespace-pre-wrap">
                            {values.map((val, idx) => (
                              <React.Fragment key={idx}>
                                {idx > 0 && ", "}
                                {val.value &&
                                  formatValue(val.value, question.type)}
                                {val.unit && (
                                  <span className="ml-1 text-gray-600">
                                    {val.unit.code}
                                  </span>
                                )}
                                {val.coding && (
                                  <span className="ml-1 text-gray-600">
                                    {val.coding.display} ({val.coding.code})
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </TableCell>
                        {response.note && (
                          <TableCell className="py-1 pr-0 align-top text-right md:table-cell">
                            <div className="flex justify-end">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs shrink-0 px-2"
                                  >
                                    {t("see_note")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="max-w-[90vw] p-3">
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {response.note}
                                  </p>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>,
        );
        currentNonGroupQuestions = [];
      }
    };

    questions.forEach((question, index) => {
      if (question.type === "structured") return;

      if (question.type === "group") {
        flushNonGroupQuestions();
        result.push(
          <React.Fragment key={`group-${index}`}>
            <QuestionGroup
              group={question}
              responses={item.responses}
              isSingleGroup={groups.length === 1 && question.type === "group"}
            />
          </React.Fragment>,
        );
      } else {
        currentNonGroupQuestions.push(question);
      }
    });

    flushNonGroupQuestions();
    return result;
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "grid gap-3",
          shouldUseTwoColumns ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        {/* Left Column */}
        <div className="space-y-2">{renderColumn(leftGroups)}</div>

        {/* Right Column */}
        {shouldUseTwoColumns && (
          <div className="space-y-2">{renderColumn(rightGroups)}</div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-gray-200 pt-2 text-xs text-gray-500">
        <div>
          <span className="text-gray-600">{t("filed_by")}</span>{" "}
          <span className="font-medium text-gray-700">
            {formatName(item.created_by)}
          </span>
        </div>
        <div>
          <span className="text-gray-600">{t("at")}</span>{" "}
          <span className="font-medium text-gray-700">
            {formatDateTime(item.created_date)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ResponseCard({
  item,
  patientId,
  onTitleClick,
  showTitle = true,
  isPrintPreview = false,
}: {
  item: QuestionnaireResponse;
  patientId: string;
  isPrintPreview?: boolean;
  onTitleClick?: (questionnaireSlug: string) => void;
  showTitle?: boolean;
}) {
  const { t } = useTranslation();
  const isStructured = !item.questionnaire;
  const structuredType = Object.keys(item.structured_responses || {})[0];
  const title =
    isStructured && structuredType
      ? properCase(structuredType.replace(/_/g, " "))
      : item.questionnaire?.title || "";
  const isEnteredInError =
    item.status === QuestionnaireResponseStatus.EnteredInError;
  const [isExpanded, setIsExpanded] = useState(!isEnteredInError);

  return (
    <Card
      className={cn(
        "shadow-none border rounded-md",
        isEnteredInError && "opacity-70",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild className="cursor-pointer">
          <CardHeader
            className={cn(
              "flex flex-row items-center py-2 px-3",
              isEnteredInError && "hover:bg-gray-50",
            )}
          >
            {showTitle && (
              <CardTitle
                className={cn(
                  "text-base font-medium",
                  onTitleClick &&
                    !isEnteredInError &&
                    "cursor-pointer hover:bg-gray-100 rounded px-1.5 py-0.5",
                )}
                onClick={(e) => {
                  if (
                    item.questionnaire?.id &&
                    onTitleClick &&
                    !isEnteredInError
                  ) {
                    e.stopPropagation();
                    onTitleClick(item.questionnaire.id);
                  }
                }}
              >
                {title}
              </CardTitle>
            )}
            {isEnteredInError && (
              <Badge variant="destructive" className="ml-2">
                {t("entered_in_error")}
              </Badge>
            )}
            <div className="ml-auto flex items-center gap-1">
              {isEnteredInError && (
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform text-gray-500",
                    isExpanded && "rotate-180",
                  )}
                />
              )}
              {!isPrintPreview && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ResponseActionsMenu item={item} patientId={patientId} />
                </div>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0">
            <ResponseCardContent item={item} />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
const RESULTS_PER_PAGE_LIMIT = 10;

export default function QuestionnaireResponsesList({
  encounterId,
  patientId,
  isPrintPreview = false,
  onlyUnstructured,
  canAccess = true,
  questionnaireSlug,
  renderItem,
  subjectType = "encounter",
}: Props) {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [
        "questionnaireResponses",
        patientId,
        questionnaireSlug,
        encounterId,
      ],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = await query(questionnaireResponseApi.list, {
          pathParams: { patientId },
          queryParams: {
            ...(!isPrintPreview && {
              limit: String(RESULTS_PER_PAGE_LIMIT),
              offset: String(pageParam),
            }),
            encounter: encounterId,
            only_unstructured: onlyUnstructured,
            subject_type: subjectType,
            ...(questionnaireSlug
              ? { questionnaire_slug: questionnaireSlug }
              : {}),
          },
        })({ signal });

        return response as PaginatedResponse<QuestionnaireResponse>;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * RESULTS_PER_PAGE_LIMIT;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
      select: (data) => data?.pages.flatMap((p) => p.results) || [],
      enabled: canAccess,
    });

  const responses = data ?? [];
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div>
      <div className="max-w-full">
        {isLoading ? (
          <div className="grid gap-3">
            <CardListSkeleton count={RESULTS_PER_PAGE_LIMIT} />
          </div>
        ) : responses.length === 0 ? (
          <Card
            className={cn(
              "p-4",
              isPrintPreview && "shadow-none border-gray-200",
            )}
          >
            <div className="text-sm font-medium text-gray-500">
              {t("no_responses_found")}
            </div>
          </Card>
        ) : (
          <ul className="grid gap-3">
            {responses.map((item: QuestionnaireResponse) => (
              <li key={item.id}>
                {renderItem ? (
                  renderItem(item)
                ) : (
                  <ResponseCard
                    key={item.id}
                    item={item}
                    patientId={patientId}
                    isPrintPreview={isPrintPreview}
                  />
                )}
              </li>
            ))}

            {!isPrintPreview && hasNextPage && (
              <li ref={ref} className="flex justify-center py-2">
                {isFetchingNextPage && (
                  <CardListSkeleton count={RESULTS_PER_PAGE_LIMIT} />
                )}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
