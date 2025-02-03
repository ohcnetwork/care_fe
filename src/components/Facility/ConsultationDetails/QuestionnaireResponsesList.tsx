import { t } from "i18next";
import { useTranslation } from "react-i18next";

import PaginatedList from "@/CAREUI/misc/PaginatedList";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import routes from "@/Utils/request/api";
import { formatDateTime, properCase } from "@/Utils/utils";
import { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import { Encounter } from "@/types/emr/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import { SymptomRequest } from "@/types/emr/symptom/symptom";
import { Question } from "@/types/questionnaire/question";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

interface Props {
  encounter?: Encounter;
  patientId: string;
}

type ResponseValueType = {
  value?:
    | string
    | number
    | boolean
    | Date
    | Encounter
    | AllergyIntoleranceRequest[]
    | MedicationRequest[]
    | MedicationStatementRequest[]
    | SymptomRequest[]
    | DiagnosisRequest[]
    | CreateAppointmentQuestion;
  value_quantity?: {
    value: number;
  };
};

interface QuestionResponseProps {
  question: Question;
  response?: {
    values: ResponseValueType[];
    note?: string;
    question_id: string;
  };
}

export function formatValue(
  value: ResponseValueType["value"],
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

  const value =
    response.values[0]?.value || response.values[0]?.value_quantity?.value;

  if (!value) return null;

  return (
    <div>
      <div className="text-xs text-gray-500">{question.text}</div>
      <div className="text-sm font-medium whitespace-pre-wrap">
        {formatValue(value, question.type)}
        {question.unit?.code && (
          <span className="ml-1 text-xs">{question.unit.code}</span>
        )}
        {response.note && (
          <span className="ml-2 text-xs text-gray-500">({response.note})</span>
        )}
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
    values: ResponseValueType[];
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

function ResponseCard({ item }: { item: QuestionnaireResponse }) {
  const isStructured = !item.questionnaire;
  const structuredType = Object.keys(item.structured_responses || {})[0];

  return (
    <Card className="flex flex-col py-3 px-4 transition-colors hover:bg-muted/50">
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
                <h3 className="text-sm font-medium">
                  {item.questionnaire?.title} {t("filed")}
                </h3>
              )}
            </div>
            <span>{t("at")}</span>
            <span>{formatDateTime(item.created_date)}</span>
            <span>{t("by")}</span>
            <div>
              {item.created_by?.first_name || ""}{" "}
              {item.created_by?.last_name || ""}
              {item.created_by?.user_type && ` (${item.created_by?.user_type})`}
            </div>
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
  encounter,
  patientId,
}: Props) {
  const { t } = useTranslation();

  return (
    <PaginatedList
      route={routes.getQuestionnaireResponses}
      pathParams={{
        patientId: patientId,
      }}
      query={{
        ...(encounter && { encounter: encounter.id }),
      }}
    >
      {() => (
        <div className="mt-4 flex w-full flex-col gap-4">
          <div>
            <PaginatedList.WhenEmpty>
              <Card className="p-6">
                <div className="text-lg font-medium text-gray-500">
                  {t("no_questionnaire_responses")}
                </div>
              </Card>
            </PaginatedList.WhenEmpty>

            <PaginatedList.WhenLoading>
              <div className="grid gap-5">
                <CardListSkeleton count={3} />
              </div>
            </PaginatedList.WhenLoading>

            <PaginatedList.Items<QuestionnaireResponse> className="grid gap-4">
              {(item) => <ResponseCard key={item.id} item={item} />}
            </PaginatedList.Items>

            <div className="flex w-full items-center justify-center mt-4">
              <PaginatedList.Paginator hideIfSinglePage />
            </div>
          </div>
        </div>
      )}
    </PaginatedList>
  );
}
