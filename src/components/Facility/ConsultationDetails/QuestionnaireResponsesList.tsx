import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Link, useQueryParams } from "raviger";
import { Trans, useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import PaginationComponent from "@/components/Common/Pagination";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, properCase } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";
import { ResponseValue } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";

interface Props {
  encounter?: Encounter;
  patientId: string;
  facilityId?: string;
  isPrintPreview?: boolean;
  onlyUnstructured?: boolean;
}

interface QuestionResponseProps {
  question: Question;
  response?: {
    values: ResponseValue[];
    note?: string;
    question_id: string;
  };
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
    default:
      return value.toString();
  }
}

function QuestionResponseValue({ question, response }: QuestionResponseProps) {
  if (!response) return null;

  return (
    <div>
      <div className="text-xs text-gray-500">{question.text}</div>
      <div className="space-y-1">
        {response.values.map((valueObj, index) => {
          const value = valueObj.value || valueObj.value_quantity?.value;
          if (!value) return null;

          return (
            <div
              key={index}
              className="text-sm font-medium whitespace-pre-wrap"
            >
              {formatValue(value, question.type)}
              {question.unit?.code && (
                <span className="ml-1 text-xs">{question.unit.code}</span>
              )}
              {index === response.values.length - 1 && response.note && (
                <span className="ml-2 text-xs text-gray-500">
                  ({response.note})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionGroup({
  group,
  responses,
  level = 0,
}: {
  group: Question;
  responses: {
    values: ResponseValue[];
    note?: string;
    question_id: string;
  }[];
  level?: number;
}) {
  const hasResponses = responses.some((r) =>
    group.questions?.some((q) => q.id === r.question_id),
  );

  if (!hasResponses) return null;

  const containerClass = group.styling_metadata?.containerClasses || "";
  const classes = group.styling_metadata?.classes || "";

  return (
    <div className={`space-y-2 ${classes}`}>
      {group.text && (
        <div className="flex flex-col space-y-1">
          <h4 className="text-sm font-medium text-secondary-700">
            {group.text}
            {group.code && (
              <span className="ml-1 text-xs text-gray-500">
                ({group.code.display})
              </span>
            )}
          </h4>
          {level === 0 && <Separator className="my-2" />}
        </div>
      )}
      <div className={`${containerClass}`}>
        {group.questions?.map((question) => {
          if (question.type === "group") {
            return (
              <QuestionGroup
                key={question.id}
                group={question}
                responses={responses}
                level={level + 1}
              />
            );
          }

          if (question.type === "structured") return null;

          const response = responses.find((r) => r.question_id === question.id);
          if (!response) return null;

          return (
            <QuestionResponseValue
              key={question.id}
              question={question}
              response={response}
            />
          );
        })}
      </div>
    </div>
  );
}

function StructuredResponseBadge({
  type,
  submitType,
}: {
  type: string;
  submitType: string;
}) {
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

function ResponseCard({
  item,
  isPrintPreview,
}: {
  item: QuestionnaireResponse;
  isPrintPreview?: boolean;
}) {
  const isStructured = !item.questionnaire;
  const structuredType = Object.keys(item.structured_responses || {})[0];

  return (
    <Card
      className={cn(
        "flex flex-col py-3 px-4 transition-colors hover:bg-muted/50",
        isPrintPreview && "shadow-none",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              {isStructured && structuredType ? (
                <StructuredResponseBadge
                  type={structuredType}
                  submitType={
                    Object.values(item.structured_responses || {})[0]
                      ?.submit_type
                  }
                />
              ) : (
                <Trans
                  i18nKey="filed"
                  values={{ title: item.questionnaire?.title }}
                  components={{ strong: <strong /> }}
                />
              )}
            </div>
            <span>
              <Trans
                i18nKey="at_time"
                values={{ time: formatDateTime(item.created_date) }}
                components={{ strong: <strong /> }}
              />
            </span>
            <span>
              <Trans
                i18nKey="by_name"
                values={{
                  by: `${item.created_by?.first_name || ""} ${item.created_by?.last_name || ""}${
                    item.created_by?.user_type
                      ? ` (${item.created_by.user_type})`
                      : ""
                  }`,
                }}
                components={{ strong: <strong /> }}
              />
            </span>
          </div>
        </div>
      </div>

      {item.questionnaire && (
        <div className="mt-4 space-y-4">
          {item.questionnaire?.questions.map((question: Question) => {
            if (question.type === "structured") return null;

            if (question.type === "group") {
              return (
                <QuestionGroup
                  key={question.id}
                  group={question}
                  responses={item.responses}
                />
              );
            }

            const response = item.responses.find(
              (r) => r.question_id === question.id,
            );
            if (!response) return null;

            return (
              <QuestionResponseValue
                key={question.id}
                question={question}
                response={response}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function QuestionnaireResponsesList({
  patientId,
  facilityId,
  isPrintPreview = false,
  onlyUnstructured,
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
        only_unstructured: onlyUnstructured,
        subject_type: "patient",
      },
      maxPages: isPrintPreview ? undefined : 1,
      pageSize: isPrintPreview ? 100 : RESULTS_PER_PAGE_LIMIT,
    }),
  });

  return (
    <div className="mt-4 gap-4">
      <div className="max-w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="mr-4 text-xl font-bold text-secondary-900">
            {t("updates")}
          </div>
          <Button asChild variant="outline_primary">
            <Link
              href={
                facilityId
                  ? `/facility/${facilityId}/patient/${patientId}/questionnaire`
                  : `/patient/${patientId}/questionnaire`
              }
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_patient_updates")}
            </Link>
          </Button>
        </div>
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
                  isPrintPreview && "shadow-none border-gray",
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
