import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import { Card } from "@/components/ui/card";

import routes from "@/Utils/request/api";
import { formatDateTime, properCase } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";
import { Question } from "@/types/questionnaire/question";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";

interface Props {
  encounter: Encounter;
}

function formatValue(value: string, type: string): string {
  switch (type) {
    case "dateTime":
      return formatDateTime(value);
    case "choice":
      return properCase(value);
    default:
      return value;
  }
}

function QuestionResponseValue({
  question,
  response,
}: {
  question: Question;
  response: any;
}) {
  const value =
    response.values[0]?.value || response.values[0]?.value_quantity?.value;

  if (!value) return null;

  return (
    <div className="flex flex-col space-y-0.5">
      <div className="text-xs text-muted-foreground">
        {question.text}
        {question.code && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({question.code.display})
          </span>
        )}
      </div>
      <div className="text-sm">
        {formatValue(String(value), question.type)}
        {response.note && (
          <span className="ml-2 text-xs text-muted-foreground">
            ({response.note})
          </span>
        )}
      </div>
    </div>
  );
}

function QuestionGroup({
  group,
  responses,
}: {
  group: Question;
  responses: any[];
}) {
  // If this is a nested group (like BP with systolic/diastolic)
  if (group.questions?.some((q) => q.questions)) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-secondary-700">
          {group.text}
          {group.code && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({group.code.display})
            </span>
          )}
        </h4>
        <div className="space-y-2 pl-3">
          {group.questions?.map((subGroup) => (
            <QuestionGroup
              key={subGroup.id}
              group={subGroup}
              responses={responses}
            />
          ))}
        </div>
      </div>
    );
  }

  // Regular group with questions
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-secondary-700">
        {group.text}
        {group.code && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({group.code.display})
          </span>
        )}
      </h4>
      <div
        className={`space-y-2 pl-3 ${group.styling_metadata?.classes || ""}`}
      >
        {group.questions?.map((question) => {
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

export default function QuestionnaireResponsesList({ encounter }: Props) {
  const { t } = useTranslation();

  return (
    <PaginatedList
      route={routes.getQuestionnaireResponses}
      pathParams={{
        patientId: encounter.patient.id,
      }}
      query={{
        encounter: encounter.id,
      }}
    >
      {() => (
        <div className="mt-4 flex w-full flex-col gap-4">
          <div>
            <PaginatedList.WhenEmpty>
              <Card className="p-6">
                <div className="text-lg font-medium text-muted-foreground">
                  {t("no_questionnaire_responses")}
                </div>
              </Card>
            </PaginatedList.WhenEmpty>

            <PaginatedList.WhenLoading>
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </PaginatedList.WhenLoading>

            <PaginatedList.Items<QuestionnaireResponse> className="grid gap-4">
              {(item) => (
                <Card
                  key={item.id}
                  className="flex flex-col py-2 px-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div>
                        <h3 className="text-sm font-medium">
                          {item.questionnaire?.title ||
                            Object.keys(item.structured_responses || {}).map(
                              (key) => properCase(key),
                            )}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <CareIcon icon="l-clock" className="h-3 w-3" />
                          <span>{formatDateTime(item.created_date)}</span>
                          <span className="mt-0.5 text-xs text-muted-foreground">
                            {!item.questionnaire && (
                              <>
                                {Object.values(
                                  item.structured_responses ?? {},
                                )[0]?.submit_type === "CREATE"
                                  ? "Created"
                                  : "Updated"}{" "}
                              </>
                            )}
                            {
                              <>
                                by {item.created_by?.first_name || ""}{" "}
                                {item.created_by?.last_name || ""}
                                {item.created_by?.user_type &&
                                  ` (${item.created_by?.user_type})`}
                              </>
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.questionnaire && (
                    <div className="mt-3 border-t pt-3">
                      <div className="space-y-4">
                        {item.questionnaire?.questions.map(
                          (question: Question) => {
                            // Skip structured questions for now as they need special handling
                            if (question.type === "structured") return null;

                            const response = item.responses.find(
                              (r) => r.question_id === question.id,
                            );

                            if (question.type === "group") {
                              return (
                                <QuestionGroup
                                  key={question.id}
                                  group={question}
                                  responses={item.responses}
                                />
                              );
                            }

                            if (!response) return null;

                            return (
                              <QuestionResponseValue
                                key={question.id}
                                question={question}
                                response={response}
                              />
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </PaginatedList.Items>

            <div className="flex w-full items-center justify-center">
              <PaginatedList.Paginator hideIfSinglePage />
            </div>
          </div>
        </div>
      )}
    </PaginatedList>
  );
}
