import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { Card } from "@/components/ui/card";

import { formatValue } from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";

import query from "@/Utils/request/query";
import { HTTPError, PaginatedResponse } from "@/Utils/request/types";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { Observation } from "@/types/emr/observation";
import patientApi from "@/types/emr/patient/patientApi";

interface GroupedObservations {
  [key: string]: Observation[];
}

function getDateKey(date: string) {
  return format(new Date(date), "yyyy-MM-dd");
}

function formatDisplayDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time parts for accurate date comparison
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (date.getTime() === today.getTime()) {
    return `Today (${formattedDate})`;
  } else if (date.getTime() === yesterday.getTime()) {
    return `Yesterday (${formattedDate})`;
  }
  return formattedDate;
}

function formatDisplayTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupObservationsByDate(
  observations: Observation[],
): GroupedObservations {
  return observations.reduce((groups: GroupedObservations, observation) => {
    const dateKey = getDateKey(observation.effective_datetime);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(observation);
    return groups;
  }, {});
}

export const EncounterObservationsTab = () => {
  const { t } = useTranslation();
  const {
    selectedEncounterId: encounterId,
    patientId,
    selectedEncounterPermissions: { canViewEncounter, canViewClinicalData },
  } = useEncounter();
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useInfiniteQuery<PaginatedResponse<Observation>, HTTPError>({
      queryKey: ["infinite-observations", patientId, encounterId],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await query(patientApi.listObservations, {
          pathParams: { patientId },
          queryParams: {
            encounter: encounterId,
            ignore_group: true,
            limit: 20,
            offset: String(pageParam),
          },
        })({ signal: new AbortController().signal });
        return response as PaginatedResponse<Observation>;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * 20;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
      enabled: canViewClinicalData || canViewEncounter,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-lg font-medium text-gray-500">{t("loading")}</div>
      </Card>
    );
  }

  const observations = data?.pages.flatMap((page) => page.results) ?? [];

  if (observations.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-lg font-medium text-gray-500">
          {t("no_observations")}
        </div>
      </Card>
    );
  }

  const groupedObservations = groupObservationsByDate(observations);
  const dates = Object.keys(groupedObservations).sort().reverse();

  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
        {dates.map((date, index) => (
          <div key={date}>
            <div className="mb-3 text-base font-semibold text-gray-700">
              {formatDisplayDate(date)}
            </div>
            <div className="flex flex-col gap-3">
              {groupedObservations[date]
                .sort(
                  (a, b) =>
                    new Date(b.effective_datetime).getTime() -
                    new Date(a.effective_datetime).getTime(),
                )
                .map((item: Observation) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="p-1 h-fit text-sm text-gray-700 bg-gray-100 rounded-md font-medium">
                      {formatDisplayTime(item.effective_datetime)}:
                    </div>
                    <Card className="flex-1 p-3 border-gray-100 shadow-none bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2">
                          {item.value.value && (
                            <div className="mt-1 font-semibold whitespace-pre-wrap text-lg text-gray-950">
                              {formatValue(item.value.value, item.value_type)}
                            </div>
                          )}
                          {item.value.value_quantity && (
                            <div className="mt-1 font-medium">
                              {item.value.value_quantity.value}{" "}
                              <div className="text-xs text-gray-600">
                                {item.value.value_quantity.code.display}
                              </div>
                            </div>
                          )}
                        </div>
                        {item.note && (
                          <div className="mt-1 text-sm text-gray-500">
                            {item.note}
                          </div>
                        )}
                        <div className="font-medium text-sm text-gray-600">
                          {item.main_code.display || item.main_code.code}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
            </div>
            {index < dates.length - 1 && (
              <div className="my-4 border-b border-dashed border-gray-200" />
            )}
          </div>
        ))}
        {hasNextPage && (
          <div ref={ref} className="flex justify-center p-4">
            <div className="text-sm text-gray-500">
              {isFetchingNextPage ? t("loading") : t("load_more")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
