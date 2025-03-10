import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import PaginationComponent from "@/components/Common/Pagination";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import CreateEncounterForm from "@/components/Encounter/CreateEncounterForm";
import { EncounterCard } from "@/components/Facility/EncounterCard";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

const EncounterHistory = (props: PatientProps) => {
  const { patientId, facilityId, patientData } = props;

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
              facilityId ? (
                <div className="p-2">
                  <div className="h-full flex w-full items-center justify-center">
                    <CreateEncounterForm
                      facilityId={facilityId}
                      patientId={patientId}
                      patientName={patientData.name}
                      trigger={
                        <Button
                          variant="outline"
                          data-cy="create-encounter-button"
                          className="group relative w-full h-[100px] md:h-[200px] overflow-hidden border-0 p-0 shadow-md hover:shadow-xl transition-all duration-300 justify-center"
                        >
                          <div className="p-4 md:p-6 w-full">
                            <div className="flex w-full items-center gap-3 md:gap-4">
                              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl">
                                <CareIcon
                                  icon="l-stethoscope"
                                  className="size-5 md:size-6 text-primary"
                                />
                              </div>
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="text-base md:text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
                                  {t("create_encounter")}
                                </span>
                                <span className="text-xs md:text-sm text-gray-500 line-clamp-1">
                                  {t("start_a_new_clinical_encounter")}
                                </span>
                              </div>
                              <CareIcon
                                icon="l-arrow-right"
                                className="ml-auto size-4 md:size-5 text-gray-400 transform translate-x-0 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                              />
                            </div>
                          </div>
                        </Button>
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  <div className="h-full space-y-2 rounded-lg bg-white px-7 py-12 border border-secondary-300">
                    <div className="flex w-full items-center justify-center text-lg text-secondary-600">
                      <div className="h-full flex w-full items-center justify-center">
                        <span className="text-sm text-gray-500">
                          {t("no_encounters_found")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <ul className="grid gap-4">
                {encounterData?.results?.map((encounter) => (
                  <li key={encounter.id} className="w-full">
                    <EncounterCard
                      key={encounter.id}
                      encounter={encounter}
                      facilityId={facilityId}
                    />
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
