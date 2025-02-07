import { useQuery } from "@tanstack/react-query";
import { Link, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import PaginationComponent from "@/components/Common/Pagination";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { EncounterCard } from "@/components/Facility/EncounterCard";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

const EncounterHistory = (props: PatientProps) => {
  const { patientId, facilityId } = props;

  const { t } = useTranslation();

  const [qParams, setQueryParams] = useQueryParams<{ page?: number }>();

  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounterHistory", patientId, qParams],
    queryFn: query(routes.encounter.list, {
      queryParams: {
        patient: patientId,
        limit: 5,
        offset: ((qParams.page ?? 1) - 1) * 5,
      },
    }),
  });

  return (
    <div className="mt-8">
      <div>
        {isLoading ? (
          <div>
            <div className="grid gap-5">
              <CardListSkeleton count={5} />
            </div>
          </div>
        ) : (
          <div>
            {encounterData?.results?.length === 0 ? (
              <div className="p-2">
                <div className="h-full space-y-2 rounded-lg bg-white px-7 py-12 border border-secondary-300">
                  <div className="flex w-full items-center justify-center text-lg text-secondary-600">
                    {t("no_consultation_history")}
                  </div>
                  <div className="flex w-full items-center justify-center pt-4">
                    <Button variant="outline_primary" asChild>
                      <Link
                        href={`/facility/${facilityId}/patient/${patientId}/consultation`}
                      >
                        <span className="flex w-full items-center justify-start gap-2">
                          <CareIcon
                            icon="l-chat-bubble-user"
                            className="text-xl"
                          />
                          {t("add_consultation")}
                        </span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ul className="grid gap-4">
                {encounterData?.results?.map((encounter) => (
                  <li key={encounter.id} className="w-full">
                    <EncounterCard key={encounter.id} encounter={encounter} />
                  </li>
                ))}
                <div className="flex w-full items-center justify-center">
                  <div
                    className={cn(
                      "flex w-full justify-center",
                      (encounterData?.count ?? 0) > 5 ? "visible" : "invisible",
                    )}
                  >
                    <PaginationComponent
                      cPage={qParams.page ?? 1}
                      defaultPerPage={5}
                      data={{ totalCount: encounterData?.count ?? 0 }}
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
  );
};

export default EncounterHistory;
