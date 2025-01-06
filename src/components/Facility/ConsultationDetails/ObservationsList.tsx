import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Card } from "@/components/ui/card";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";
import { Observation } from "@/types/emr/observation";

const LIMIT = 20;

interface Props {
  encounter: Encounter;
}

export default function ObservationsList(props: Props) {
  const { t } = useTranslation();
  const patientId = props.encounter.patient.id;
  const encounterId = props.encounter.id;
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useInfiniteQuery<PaginatedResponse<Observation>, HTTPError>({
      queryKey: ["observations", patientId, encounterId],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await query(routes.listObservations, {
          pathParams: { patientId },
          queryParams: {
            encounter: encounterId,
            ignore_group: true,
            limit: String(LIMIT),
            offset: String(pageParam),
          },
        })({ signal: new AbortController().signal });
        return response as PaginatedResponse<Observation>;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * LIMIT;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-lg font-medium text-muted-foreground">
          {t("loading")}
        </div>
      </Card>
    );
  }

  const observations = data?.pages.flatMap((page) => page.results) ?? [];

  if (observations.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-lg font-medium text-muted-foreground">
          {t("no_observations")}
        </div>
      </Card>
    );
  }

  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
        {observations.map((item: Observation) => (
          <Card key={item.id} className="flex items-center justify-between p-4">
            <div>
              <div className="text-xs flex items-center gap-1 text-muted-foreground">
                <CareIcon icon="l-calender" />
                <span>{formatDateTime(item.effective_datetime)}</span>
              </div>
              <div className="font-medium">
                {item.main_code.display || item.main_code.code}
              </div>
              {item.value.value_quantity && (
                <div className="mt-1 font-medium">
                  {item.value.value_quantity.value}{" "}
                  {item.value.value_quantity.code.display}
                </div>
              )}
              {item.value.value && (
                <div className="mt-1 font-medium">{item.value.value}</div>
              )}
              {item.note && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {item.note}
                </div>
              )}
            </div>
          </Card>
        ))}
        {hasNextPage && (
          <div ref={ref} className="flex justify-center p-4">
            <div className="text-sm text-muted-foreground">
              {isFetchingNextPage ? t("loading_more") : t("load_more")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
