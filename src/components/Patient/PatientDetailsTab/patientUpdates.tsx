import { useQuery } from "@tanstack/react-query";
import { Link, navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import PaginationComponent from "@/components/Common/Pagination";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, properCase } from "@/Utils/utils";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";

import { PatientProps } from ".";

export const Updates = (props: PatientProps) => {
  const { facilityId, patientId } = props;
  const { t } = useTranslation();

  const [qParams, setQueryParams] = useQueryParams<{ page?: number }>();

  const { data: patientUpdatesData, isLoading } = useQuery({
    queryKey: ["patientUpdates", patientId, qParams],
    queryFn: query(routes.getQuestionnaireResponses, {
      queryParams: {
        limit: RESULTS_PER_PAGE_LIMIT,
        offset: ((qParams.page ?? 1) - 1) * RESULTS_PER_PAGE_LIMIT,
      },
      pathParams: { patientId },
    }),
  });

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
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="grid gap-4">
              <CardListSkeleton count={RESULTS_PER_PAGE_LIMIT} />
            </div>
          ) : (
            <div>
              {patientUpdatesData?.results?.length === 0 ? (
                <Card className="p-6">
                  <div className="text-lg font-medium text-gray-500">
                    {t("no_update_available")}
                  </div>
                </Card>
              ) : (
                <ul className="grid gap-4">
                  {patientUpdatesData?.results?.map((update) => (
                    <li key={update.id} className="w-full">
                      <Card
                        key={update.id}
                        className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start gap-4">
                          <CareIcon
                            icon="l-file-alt"
                            className="mt-1 h-5 w-5 text-gray-500"
                          />
                          <div>
                            <h3 className="text-lg font-medium">
                              {update.questionnaire?.title ||
                                structuredResponsesPreview(
                                  update.structured_responses,
                                )}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                              <CareIcon icon="l-calender" className="h-4 w-4" />
                              <span>{formatDateTime(update.created_date)}</span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              by {update.created_by?.first_name || ""}{" "}
                              {update.created_by?.last_name || ""}
                              {` (${update.created_by?.user_type})`}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigate(
                              `/facility/${facilityId}/patient/${patientId}/encounter/${update.encounter}/questionnaire_response/${update.id}`,
                            );
                          }}
                        >
                          {t("view")}
                        </Button>
                      </Card>
                    </li>
                  ))}
                  <div className="flex w-full items-center justify-center">
                    <div
                      className={cn(
                        "flex w-full justify-center",
                        (patientUpdatesData?.count ?? 0) >
                          RESULTS_PER_PAGE_LIMIT
                          ? "visible"
                          : "invisible",
                      )}
                    >
                      <PaginationComponent
                        cPage={qParams.page ?? 1}
                        defaultPerPage={RESULTS_PER_PAGE_LIMIT}
                        data={{ totalCount: patientUpdatesData?.count ?? 0 }}
                        onChange={(page) => setQueryParams({ page })}
                      />
                    </div>
                  </div>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function structuredResponsesPreview(
  structured_responses?: QuestionnaireResponse["structured_responses"],
) {
  return Object.keys(structured_responses || {}).map((key) => properCase(key));
}
