import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Printer } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import PaginationComponent from "@/components/Common/Pagination";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, formatName, properCase } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";
import { ResponseValue } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";

interface Props {
  encounter?: Encounter;
  patientId: string;
  isPrintPreview?: boolean;
  onlyUnstructured?: boolean;
  canAccess?: boolean;
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
        ? formatDateTime(value.toISOString())
        : formatDateTime(value.toString());
    case "choice":
      return properCase(value.toString());
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

  const midPoint = isSingleGroup
    ? Math.ceil(questionsWithResponses.length / 2)
    : questionsWithResponses.length;
  const leftQuestions = questionsWithResponses.slice(0, midPoint);
  const rightQuestions = isSingleGroup
    ? questionsWithResponses.slice(midPoint)
    : [];

  const renderQuestionRow = (question: Question) => {
    const response = responses.find((r) => r.question_id === question.id);
    if (!response) return null;

    const value = response.values[0]?.value;
    const unit = response.values[0]?.unit || question.unit;
    const coding = response.values[0]?.coding;

    return (
      <TableRow key={question.id}>
        <TableCell className="py-1 pl-0 align-top">
          <div className="text-sm text-gray-600 break-words whitespace-normal">
            {question.text}
          </div>
        </TableCell>
        <TableCell className="py-1 pr-0 align-top">
          <div className="text-sm font-medium break-words whitespace-normal">
            {formatValue(value, question.type)}
            {unit && <span className="ml-1 text-gray-600">{unit.code}</span>}
            {coding && (
              <span className="ml-1 text-gray-600">
                {coding.display} ({coding.code})
              </span>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg px-4 py-2">
      <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-1">
        {group.text}
      </h3>
      <div
        className={cn("w-full", {
          "grid md:grid-cols-2 grid-cols-1 gap-8": isSingleGroup,
        })}
      >
        {leftQuestions.length > 0 && (
          <div className="w-full">
            <Table className="table-fixed w-full">
              <TableBody>{leftQuestions.map(renderQuestionRow)}</TableBody>
            </Table>
          </div>
        )}

        {isSingleGroup && rightQuestions.length > 0 && (
          <div className="w-full">
            <Table className="table-fixed w-full">
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

export function StructuredResponseBadge({
  type,
  submitType,
}: {
  type: string;
  submitType: string;
}) {
  const { t } = useTranslation();

  const colors = {
    symptom: "bg-yellow-100 text-yellow-800",
    diagnosis: "bg-blue-100 text-blue-800",
    medication_request: "bg-green-100 text-green-800",
    medication_statement: "bg-purple-100 text-purple-800",
    follow_up_appointment: "bg-pink-100 text-pink-800",
  };

  return (
    <Badge
      variant="outline"
      className={`${
        colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
      } border-none`}
    >
      {submitType === "CREATE" ? t("created") : t("updated")}{" "}
      {properCase(type.replace(/_/g, " "))}
    </Badge>
  );
}

function PrintButton({ item }: { item: QuestionnaireResponse }) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="xs" className="[&_svg]:size-3">
          <Printer className="size-4" />
          {t("print")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link href={`questionnaire_response/${item.id}/print`}>
          <DropdownMenuItem>{t("print_this_response")}</DropdownMenuItem>
        </Link>
        <Link href={`questionnaire/${item.questionnaire?.id}/responses/print`}>
          <DropdownMenuItem>
            {t("print_all_responses", {
              title: item.questionnaire?.title,
            })}
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ResponseCardContent({ item }: { item: QuestionnaireResponse }) {
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
            className="border border-gray-200 rounded-lg px-4 py-2"
          >
            <div className="w-full">
              <Table className="table-fixed w-full">
                <TableBody>
                  {currentNonGroupQuestions.map((question) => {
                    const response = item.responses.find(
                      (r) => r.question_id === question.id,
                    );
                    if (!response) return null;

                    const value = response.values[0]?.value;
                    const unit = response.values[0]?.unit || question.unit;
                    const coding = response.values[0]?.coding;

                    if (!value && !coding) return null;

                    return (
                      <TableRow key={question.id}>
                        <TableCell className="py-1 pl-0 align-top">
                          <div className="text-sm text-gray-600 break-words whitespace-normal">
                            {question.text}
                          </div>
                        </TableCell>
                        <TableCell className="py-1 pr-0 align-top">
                          <div className="text-sm font-medium break-words whitespace-normal">
                            {formatValue(value, question.type)}
                            {unit && (
                              <span className="ml-1 text-gray-600">
                                {unit.code}
                              </span>
                            )}
                            {coding && (
                              <span className="ml-1 text-gray-600">
                                {coding.display} ({coding.code})
                              </span>
                            )}
                          </div>
                        </TableCell>
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
    <div className="w-full p-3">
      <div
        className={cn(
          "grid gap-6",
          shouldUseTwoColumns ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        {/* Left Column */}
        <div className="space-y-3">{renderColumn(leftGroups)}</div>

        {/* Right Column */}
        {shouldUseTwoColumns && (
          <div className="space-y-3">{renderColumn(rightGroups)}</div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 mt-8 pt-4 text-sm text-gray-500">
        <div>
          <span className="text-gray-600">filed by</span>{" "}
          <span className="font-medium text-gray-700">
            {formatName(item.created_by)}
            {item.created_by?.user_type && ` (${item.created_by.user_type})`}
          </span>
        </div>
        <div>
          <span className="text-gray-600">at</span>{" "}
          <span className="font-medium text-gray-700">
            {formatDateTime(item.created_date)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ResponseCard({
  item,
  isPrintPreview,
}: {
  item: QuestionnaireResponse;
  isPrintPreview?: boolean;
}) {
  const isStructured = !item.questionnaire;
  const structuredType = Object.keys(item.structured_responses || {})[0];
  const title =
    isStructured && structuredType
      ? properCase(structuredType.replace(/_/g, " "))
      : item.questionnaire?.title || "";

  return isPrintPreview ? (
    <Card className="shadow-none rounded-xl border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponseCardContent item={item} />
      </CardContent>
    </Card>
  ) : (
    <EncounterAccordionLayout
      title={isStructured && structuredType ? structuredType : title}
      actionButton={<PrintButton item={item} />}
    >
      <ResponseCardContent item={item} />
    </EncounterAccordionLayout>
  );
}

export default function QuestionnaireResponsesList({
  encounter,
  patientId,
  isPrintPreview = false,
  onlyUnstructured,
  canAccess = true,
}: Props) {
  const { t } = useTranslation();
  const [qParams, setQueryParams] = useQueryParams<{ page?: number }>();

  const { data: questionnarieResponses, isLoading } = useQuery({
    queryKey: ["questionnaireResponses", patientId, qParams],
    queryFn: query.paginated(routes.getQuestionnaireResponses, {
      pathParams: { patientId },
      queryParams: {
        ...(!isPrintPreview && {
          limit: RESULTS_PER_PAGE_LIMIT,
          offset: ((qParams.page ?? 1) - 1) * RESULTS_PER_PAGE_LIMIT,
        }),
        encounter: encounter?.id,
        only_unstructured: onlyUnstructured,
        subject_type: encounter ? "encounter" : "patient",
      },
      maxPages: isPrintPreview ? undefined : 1,
      pageSize: isPrintPreview ? 100 : RESULTS_PER_PAGE_LIMIT,
    }),
    enabled: canAccess,
  });
  return (
    <div className="gap-4">
      <div className="max-w-full">
        {isLoading ? (
          <div className="grid gap-5">
            <CardListSkeleton count={RESULTS_PER_PAGE_LIMIT} />
          </div>
        ) : (
          <div>
            {questionnarieResponses?.results?.length === 0 ? (
              <Card
                className={cn(
                  "p-6",
                  isPrintPreview && "shadow-none border-gray-200",
                )}
              >
                <div className="text-lg font-medium text-gray-500">
                  {t("no_questionnaire_responses")}
                </div>
              </Card>
            ) : (
              <ul className="grid gap-4">
                {questionnarieResponses?.results?.map(
                  (item: QuestionnaireResponse) => (
                    <li key={item.id} className="w-full">
                      <ResponseCard
                        key={item.id}
                        item={item}
                        isPrintPreview={isPrintPreview}
                      />
                    </li>
                  ),
                )}
                {!isPrintPreview && (
                  <div className="flex w-full items-center justify-center mt-4">
                    <div
                      className={cn(
                        "flex w-full justify-center",
                        (questionnarieResponses?.count ?? 0) >
                          RESULTS_PER_PAGE_LIMIT
                          ? "visible"
                          : "invisible",
                      )}
                    >
                      <PaginationComponent
                        cPage={qParams.page ?? 1}
                        defaultPerPage={RESULTS_PER_PAGE_LIMIT}
                        data={{
                          totalCount: questionnarieResponses?.count ?? 0,
                        }}
                        onChange={(page) => setQueryParams({ page })}
                      />
                    </div>
                  </div>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
