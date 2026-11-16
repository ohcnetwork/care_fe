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
import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { RegisteredGroupAnswerView } from "@/components/QuestionnaireV2/groups/RegisteredGroupAnswerView";
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
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { t } from "i18next";
import { BanIcon, ChevronDown, MoreVertical, Printer } from "lucide-react";
import { Link, useFullPath } from "raviger";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

interface Props {
  encounterId?: string;
  facilityId?: string;
  title?: string;
  showEmpty?: boolean;
  readOnly?: boolean;
  embedded?: boolean;
  patientId: string;
  isPrintPreview?: boolean;
  onlyUnstructured?: boolean;
  canAccess?: boolean;
  questionnaireSlug?: string;
  authorRoleId?: string;
  /** Only show responses submitted by this user. */
  createdBy?: string;
  /** Maximum total responses to show, newest first. Omit for infinite scrolling. */
  limit?: number;
  renderItem?: (response: QuestionnaireResponse) => React.ReactNode;
  subjectType?: string;
  presentation?: "default" | "panel";
}

export function formatValue(
  value: ResponseValue["value"],
  type: string,
): string {
  if (value === undefined || value === null || value === "") return "";

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
      return value === true || value === "true" || value === "1"
        ? t("yes")
        : t("no");
    case "time":
      return value.toString().slice(0, 5);
    default:
      return value.toString();
  }
}

const hasResponseValue = (value: ResponseValue) =>
  (value.value != null && value.value !== "") || !!value.coding;

function ResponseRows({
  questions,
  responses,
  className,
  presentation,
}: {
  questions: Question[];
  responses: QuestionnaireResponse["responses"];
  className?: string;
  presentation: "default" | "panel";
}) {
  const { t } = useTranslation();
  const rows = questions.flatMap((question) => {
    const response = responses.find((r) => r.question_id === question.id);
    const values = response?.values ?? [];
    return response && values.some(hasResponseValue)
      ? [{ question, response, values }]
      : [];
  });
  if (!rows.length) return null;

  if (presentation === "default") {
    return (
      <Table className={className}>
        <TableBody>
          {rows.map(({ question, response, values }) => (
            <TableRow key={question.id}>
              <TableCell className="w-2/5 align-top text-sm text-gray-600">
                {question.text}
              </TableCell>
              <TableCell className="align-top text-sm font-medium whitespace-pre-wrap text-gray-900">
                {values.map((val, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && ", "}
                    {formatValue(val.value, question.type)}
                    {val.unit && (
                      <span className="ml-1 font-normal text-gray-600">
                        {val.unit.code}
                      </span>
                    )}
                    {val.coding && (
                      <span className="ml-1 font-normal text-gray-600">
                        {val.coding.display} ({val.coding.code})
                      </span>
                    )}
                  </React.Fragment>
                ))}
                {response.note && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 h-6 px-2 text-xs"
                      >
                        {t("see_note")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-[90vw] p-3">
                      <p className="text-xs whitespace-pre-wrap text-gray-700">
                        {response.note}
                      </p>
                    </PopoverContent>
                  </Popover>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <dl className={cn("min-w-0 divide-y divide-gray-100", className)}>
      {rows.map(({ question, response, values }) => (
        <div
          key={question.id}
          className="grid gap-x-4 gap-y-0.5 py-1.5 @md/response-card:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
        >
          <dt className="text-sm leading-5 break-words text-gray-600">
            {question.text}
          </dt>
          <dd className="flex min-w-0 items-start justify-between gap-2">
            <span className="min-w-0 text-sm leading-5 font-medium wrap-break-word whitespace-pre-wrap text-gray-900">
              {values.map((val, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && ", "}
                  {formatValue(val.value, question.type)}
                  {val.unit && (
                    <span className="ml-1 font-normal text-gray-600">
                      {val.unit.code}
                    </span>
                  )}
                  {val.coding && (
                    <span className="ml-1 font-normal text-gray-600">
                      {val.coding.display} ({val.coding.code})
                    </span>
                  )}
                </React.Fragment>
              ))}
            </span>
            {response.note && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 shrink-0 px-2 text-xs"
                  >
                    {t("see_note")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-w-[90vw] p-3">
                  <p className="text-xs whitespace-pre-wrap text-gray-700">
                    {response.note}
                  </p>
                </PopoverContent>
              </Popover>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const groupHasAnswer = (
  question: Question,
  responses: QuestionnaireResponse["responses"],
): boolean =>
  question.type === "group"
    ? question.repeats
      ? !!responses.find((answer) => answer.question_id === question.id)
          ?.sub_results?.length
      : (question.questions?.some((sub) => groupHasAnswer(sub, responses)) ??
        false)
    : responses.some((response) => response.question_id === question.id);

/** Groups read as headed sections of the card; nested groups keep the parent's value column. */
function GroupFrame({
  title,
  depth,
  children,
}: {
  title: string;
  depth: number;
  children: React.ReactNode;
}) {
  if (depth === 0) {
    return (
      <section className="min-w-0 pt-2">
        <h3 className="pb-0.5 text-sm font-semibold text-gray-900">{title}</h3>
        {children}
      </section>
    );
  }
  return (
    <section className="min-w-0 border-t border-gray-100 pt-2">
      <h4 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}

function QuestionGroup({
  group,
  responses,
  depth = 0,
  isSingleGroup = false,
  presentation,
}: {
  group: Question;
  responses: QuestionnaireResponse["responses"];
  depth?: number;
  isSingleGroup?: boolean;
  presentation: "default" | "panel";
}) {
  if (group.repeats) {
    const rows =
      responses.find((answer) => answer.question_id === group.id)
        ?.sub_results ?? [];
    if (!rows.length) return null;
    return (
      <GroupFrame title={group.text} depth={depth}>
        <RegisteredGroupAnswerView
          question={group}
          responses={responses}
          fallback={rows.map((row, index) => (
            <QuestionGroup
              key={index}
              group={{
                ...group,
                repeats: false,
                structured_type: undefined,
                text: `${group.text} (${index + 1})`,
              }}
              responses={row}
              depth={depth + 1}
              presentation={presentation}
            />
          ))}
        />
      </GroupFrame>
    );
  }
  if (!groupHasAnswer(group, responses)) return null;

  const questionsWithResponses =
    group.questions?.filter((question) => {
      if (question.type === "structured" || question.type === "group")
        return false;
      return !!responses
        .find((r) => r.question_id === question.id)
        ?.values?.some(hasResponseValue);
    }) ?? [];

  // Long answers read better in a single column.
  const hasLongText = questionsWithResponses.some((question) => {
    const response = responses.find((r) => r.question_id === question.id);
    const value = response?.values?.[0]?.value;
    const coding = response?.values?.[0]?.coding;
    const text = [
      value?.toString() || "",
      coding?.display || "",
      coding?.code || "",
    ].join(" ");
    return text.length > 50;
  });

  const shouldUseTwoColumns = isSingleGroup && !hasLongText;
  const midPoint = shouldUseTwoColumns
    ? Math.ceil(questionsWithResponses.length / 2)
    : questionsWithResponses.length;
  const leftQuestions = questionsWithResponses.slice(0, midPoint);
  const rightQuestions = questionsWithResponses.slice(midPoint);

  return (
    <GroupFrame title={group.text} depth={depth}>
      <RegisteredGroupAnswerView
        question={group}
        responses={responses}
        fallback={
          <>
            {questionsWithResponses.length > 0 && (
              <div
                className={cn(
                  "min-w-0",
                  shouldUseTwoColumns &&
                    "grid gap-x-6 @3xl/response-card:grid-cols-2",
                )}
              >
                <ResponseRows
                  questions={leftQuestions}
                  responses={responses}
                  presentation={presentation}
                />
                {rightQuestions.length > 0 && (
                  <ResponseRows
                    questions={rightQuestions}
                    responses={responses}
                    className="border-t border-gray-100 @3xl/response-card:border-t-0"
                    presentation={presentation}
                  />
                )}
              </div>
            )}
            {group.questions?.map((subQuestion, idx) =>
              subQuestion.type === "group" ? (
                <QuestionGroup
                  key={idx}
                  group={subQuestion}
                  responses={responses}
                  depth={depth + 1}
                  presentation={presentation}
                />
              ) : null,
            )}
          </>
        }
      />
    </GroupFrame>
  );
}

function ResponseActionsMenu({
  item,
  patientId,
  encounterId,
  facilityId,
  readOnly = false,
  embedded = false,
}: {
  item: QuestionnaireResponse;
  patientId: string;
  encounterId?: string;
  facilityId?: string;
  readOnly?: boolean;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fullPath = useFullPath();
  const routeScope = fullPath.match(/^\/(facility|organization)\/[^/]+/)?.[0];
  const scope = facilityId ? `/facility/${facilityId}` : routeScope;
  const printEncounterId =
    encounterId ??
    (embedded ? undefined : fullPath.match(/\/encounter\/([^/?]+)/)?.[1]);
  const printBase = `${scope ?? ""}/patient/${patientId}${scope && printEncounterId ? `/encounter/${printEncounterId}` : ""}`;

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
          <Link
            href={`${printBase}/questionnaire_response/${item.id}/print`}
            target={embedded ? "_blank" : undefined}
            rel={embedded ? "noopener noreferrer" : undefined}
          >
            <DropdownMenuItem>
              <Printer className="size-4" />
              {t("print_this_response")}
            </DropdownMenuItem>
          </Link>
          {item.questionnaire && (
            <Link
              href={`${printBase}/questionnaire/${item.questionnaire.id}/responses/print`}
              target={embedded ? "_blank" : undefined}
              rel={embedded ? "noopener noreferrer" : undefined}
            >
              <DropdownMenuItem>
                <Printer className="size-4" />
                {t("print_all_responses", {
                  title: item.questionnaire.title,
                })}
              </DropdownMenuItem>
            </Link>
          )}
          {isUnstructured && !readOnly && (
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
        open={showConfirmDialog && !readOnly}
        onOpenChange={setShowConfirmDialog}
        title={t("mark_as_entered_in_error")}
        description={t("questionnaire_response_entered_in_error_warning")}
        onConfirm={() => {
          if (!readOnly)
            updateStatus({
              status: QuestionnaireResponseStatus.EnteredInError,
            });
        }}
        confirmText={t("confirm")}
        variant="destructive"
        disabled={isPending}
      />
    </>
  );
}

function ResponseCardContent({
  item,
  presentation,
}: {
  item: QuestionnaireResponse;
  presentation: "default" | "panel";
}) {
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
    const result: { kind: "rows" | "group"; element: React.ReactElement }[] =
      [];
    let currentNonGroupQuestions: Question[] = [];

    const flushNonGroupQuestions = () => {
      const answered = currentNonGroupQuestions.some(
        (question) =>
          !!item.responses
            .find((r) => r.question_id === question.id)
            ?.values?.some(hasResponseValue),
      );
      if (answered) {
        result.push({
          kind: "rows",
          element: (
            <ResponseRows
              key={`rows-${result.length}`}
              questions={currentNonGroupQuestions}
              responses={item.responses}
              presentation={presentation}
            />
          ),
        });
      }
      currentNonGroupQuestions = [];
    };

    questions.forEach((question, index) => {
      if (question.type === "structured") return;

      if (question.type === "group") {
        // Unanswered groups render nothing, so they must not split the rows around them.
        if (!groupHasAnswer(question, item.responses)) return;
        flushNonGroupQuestions();
        result.push({
          kind: "group",
          element: (
            <QuestionGroup
              key={`group-${index}`}
              group={question}
              responses={item.responses}
              isSingleGroup={groups.length === 1}
              presentation={presentation}
            />
          ),
        });
      } else {
        currentNonGroupQuestions.push(question);
      }
    });

    flushNonGroupQuestions();
    return result;
  };

  const leftSegments = renderColumn(leftGroups);
  const rightSegments = renderColumn(rightGroups);
  // When the columns stack, a split inside a run of rows must read as one list, not a new section.
  const rightContinuesRows =
    leftSegments.at(-1)?.kind === "rows" && rightSegments[0]?.kind === "rows";

  return (
    <div className="w-full">
      <div
        className={cn(
          "grid gap-x-6",
          shouldUseTwoColumns
            ? "grid-cols-1 @3xl/response-card:grid-cols-2"
            : "grid-cols-1",
        )}
      >
        <div className="flex min-w-0 flex-col divide-y divide-gray-200">
          {leftSegments.map((segment) => segment.element)}
        </div>
        {rightSegments.length > 0 && (
          <div
            className={cn(
              "flex min-w-0 flex-col divide-y divide-gray-200 border-t @3xl/response-card:border-t-0",
              rightContinuesRows ? "border-gray-100" : "border-gray-200",
            )}
          >
            {rightSegments.map((segment) => segment.element)}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-col border-t border-gray-100 pt-2 text-xs text-gray-500 @md/response-card:flex-row @md/response-card:items-center @md/response-card:justify-between">
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

interface ResponseCardProps {
  item: QuestionnaireResponse;
  encounterId?: string;
  facilityId?: string;
  readOnly?: boolean;
  embedded?: boolean;
  patientId: string;
  isPrintPreview?: boolean;
  onTitleClick?: (questionnaireSlug: string) => void;
  showTitle?: boolean;
  presentation?: "default" | "panel";
}

export function ResponseCard({
  item,
  patientId,
  encounterId,
  facilityId,
  readOnly = false,
  embedded = false,
  onTitleClick,
  showTitle = true,
  isPrintPreview = false,
  presentation = "default",
}: ResponseCardProps) {
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
        "@container/response-card min-w-0 shadow-none border",
        presentation === "panel"
          ? "overflow-hidden rounded-xl border-gray-200 bg-white"
          : "rounded-md",
        isEnteredInError && "opacity-70",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild className="cursor-pointer">
          <CardHeader
            className={cn(
              "flex flex-row items-center",
              presentation === "panel"
                ? "gap-2 space-y-0 px-3 py-2"
                : "py-2 px-3",
              presentation === "panel" &&
                isExpanded &&
                "border-b border-gray-200",
              isEnteredInError && "hover:bg-gray-50",
            )}
          >
            {showTitle && (
              <CardTitle
                className={cn(
                  presentation === "panel"
                    ? "min-w-0 break-words text-sm font-bold tracking-wide text-gray-600 uppercase"
                    : "text-base font-medium",
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
            <div className="ml-auto flex shrink-0 items-center gap-1">
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
                  <ResponseActionsMenu
                    item={item}
                    patientId={patientId}
                    encounterId={encounterId}
                    facilityId={facilityId}
                    readOnly={readOnly}
                    embedded={embedded}
                  />
                </div>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent
            className={
              presentation === "panel" ? "px-3 pt-1 pb-2" : "px-3 pb-3 pt-0"
            }
          >
            <ResponseCardContent item={item} presentation={presentation} />
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
  facilityId,
  title,
  showEmpty = true,
  readOnly = false,
  embedded = false,
  isPrintPreview = false,
  onlyUnstructured,
  canAccess = true,
  questionnaireSlug,
  authorRoleId,
  createdBy,
  limit,
  renderItem,
  subjectType = "encounter",
  presentation = "default",
}: Props) {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      "questionnaireResponses",
      patientId,
      questionnaireSlug,
      encounterId,
      authorRoleId,
      createdBy,
      { onlyUnstructured, subjectType, isPrintPreview, limit },
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(questionnaireResponseApi.list, {
        pathParams: { patientId },
        silent: true,
        queryParams: {
          ...(!isPrintPreview && {
            limit: String(
              limit === undefined ? RESULTS_PER_PAGE_LIMIT : limit - pageParam,
            ),
            offset: String(pageParam),
          }),
          encounter: encounterId,
          role: authorRoleId,
          created_by: createdBy,
          // The backend treats presence of this parameter as true.
          only_unstructured: onlyUnstructured ? true : undefined,
          subject_type: subjectType,
          ...(questionnaireSlug
            ? { questionnaire_slug: questionnaireSlug }
            : {}),
        },
      })({ signal });

      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (isPrintPreview) return undefined;
      const currentOffset = allPages.reduce(
        (count, page) => count + page.results.length,
        0,
      );
      const total =
        limit === undefined ? lastPage.count : Math.min(lastPage.count, limit);
      return lastPage.results.length > 0 && currentOffset < total
        ? currentOffset
        : undefined;
    },
    select: (data) => {
      // The response API orders by -created_date before applying limit/offset.
      const responses = data.pages.flatMap((page) => page.results);
      return limit === undefined ? responses : responses.slice(0, limit);
    },
    enabled: canAccess,
  });

  const responses = data ?? [];
  useEffect(() => {
    if (
      canAccess &&
      (limit !== undefined || inView) &&
      hasNextPage &&
      !isFetching &&
      !isError
    )
      fetchNextPage();
  }, [
    canAccess,
    inView,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isError,
    limit,
  ]);

  if (!canAccess || (!isLoading && !isError && !responses.length && !showEmpty))
    return null;

  return (
    <section
      aria-label={title ?? t("questionnaire_responses")}
      className="min-w-0 space-y-3"
    >
      {title && (
        <h2 className="text-sm font-semibold text-gray-600">{title}</h2>
      )}
      {isError && (
        <ClinicalListError isFetching={isFetching} onRetry={refetch} />
      )}
      <div className="max-w-full">
        {isLoading ? (
          <div className="grid gap-3">
            <CardListSkeleton
              count={Math.min(
                RESULTS_PER_PAGE_LIMIT,
                limit ?? RESULTS_PER_PAGE_LIMIT,
              )}
            />
          </div>
        ) : responses.length === 0 ? (
          !isError && (
            <Card
              className={cn(
                "p-4",
                presentation === "panel" &&
                  "rounded-xl border-gray-200 bg-white p-2 shadow-none",
                isPrintPreview && "shadow-none border-gray-200",
              )}
            >
              <div className="text-sm font-medium text-gray-500">
                {t("no_responses_found")}
              </div>
            </Card>
          )
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
                    facilityId={facilityId}
                    encounterId={encounterId}
                    readOnly={readOnly}
                    embedded={embedded}
                    isPrintPreview={isPrintPreview}
                    presentation={presentation}
                  />
                )}
              </li>
            ))}

            {!isPrintPreview && hasNextPage && (
              <li ref={ref} className="flex justify-center py-2">
                {isFetchingNextPage && (
                  <CardListSkeleton
                    count={Math.min(
                      RESULTS_PER_PAGE_LIMIT,
                      limit === undefined
                        ? RESULTS_PER_PAGE_LIMIT
                        : limit - responses.length,
                    )}
                  />
                )}
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
