import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import routes from "@/Utils/request/api";
import { formatDateTime, properCase } from "@/Utils/utils";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";

import { PatientProps } from ".";

export const Updates = (props: PatientProps) => {
  const { facilityId, id: patientId } = props;
  const { t } = useTranslation();

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold leading-tight">{t("updates")}</h2>
        <Button asChild variant="outline_primary">
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/questionnaire`}
          >
            <CareIcon icon="l-plus" className="mr-2" />
            {t("add_patient_updates")}
          </Link>
        </Button>
      </div>

      <PaginatedList
        route={routes.getQuestionnaireResponses}
        pathParams={{ patientId }}
      >
        {() => (
          <div className="flex w-full flex-col gap-4">
            <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden">
              <PaginatedList.WhenEmpty>
                <Card className="p-6">
                  <div className="text-lg font-medium text-muted-foreground">
                    {t("no_updates_found")}
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
                    className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-4">
                      <CareIcon
                        icon="l-file-alt"
                        className="mt-1 h-5 w-5 text-muted-foreground"
                      />
                      <div>
                        <h3 className="text-lg font-medium">
                          {item.questionnaire?.title ||
                            structuredResponsesPreview(
                              item.structured_responses,
                            )}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <CareIcon icon="l-calender" className="h-4 w-4" />
                          <span>{formatDateTime(item.created_date)}</span>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          by {item.created_by?.first_name || ""}{" "}
                          {item.created_by?.last_name || ""}
                          {` (${item.created_by?.user_type})`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate(
                          `/facility/${facilityId}/patient/${patientId}/encounter/${item.encounter}/questionnaire_response/${item.id}`,
                        );
                      }}
                    >
                      {t("view")}
                    </Button>
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
    </div>
  );
};

function structuredResponsesPreview(
  structured_responses?: QuestionnaireResponse["structured_responses"],
) {
  return Object.keys(structured_responses || {}).map((key) => properCase(key));
}
