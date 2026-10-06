import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";
import ServiceRequestTable from "@/components/ServiceRequest/ServiceRequestTable";

import query from "@/Utils/request/query";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { serviceRequestsConfigSchema } from "@/types/workspace/widgetConfigSchemas";

interface EncounterServiceRequestsWidgetProps {
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

export function EncounterServiceRequestsWidget({
  title,
  showEmpty = false,
  config = {},
}: EncounterServiceRequestsWidgetProps) {
  const { t } = useTranslation();
  const instanceId = useId();
  const {
    selectedEncounter,
    selectedEncounterId,
    patientId,
    facilityId: routeFacilityId,
    canReadClinicalData,
    canWriteClinicalData,
  } = useEncounter();
  const facilityId = selectedEncounter?.facility.id;
  const parsedConfig = serviceRequestsConfigSchema.safeParse(config);
  const { status, limit } = parsedConfig.data ?? {};
  const canRead =
    canReadClinicalData &&
    !!facilityId &&
    selectedEncounter?.id === selectedEncounterId &&
    selectedEncounter?.patient.id === patientId;
  const readOnly = !canWriteClinicalData || routeFacilityId !== facilityId;
  const {
    data,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "serviceRequests",
      facilityId,
      "encounter-widget",
      selectedEncounterId,
      { status, limit },
      // Identical widgets share invalidation, but keep Load More independent.
      instanceId,
    ],
    queryFn: ({ pageParam, signal }) =>
      query(serviceRequestApi.listServiceRequest, {
        pathParams: { facilityId: facilityId ?? "" },
        queryParams: {
          encounter: selectedEncounterId,
          status,
          limit: limit === undefined ? 10 : limit - pageParam,
          offset: pageParam,
          ordering: "-created_date",
        },
        silent: true,
      })({ signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const offset = allPages.reduce(
        (count, page) => count + page.results.length,
        0,
      );
      const total =
        limit === undefined ? lastPage.count : Math.min(lastPage.count, limit);
      return lastPage.results.length > 0 && offset < total ? offset : undefined;
    },
    enabled: canRead && parsedConfig.success,
  });

  useEffect(() => {
    if (
      canRead &&
      parsedConfig.success &&
      limit !== undefined &&
      hasNextPage &&
      !isFetching &&
      !isError
    )
      fetchNextPage();
  }, [
    canRead,
    parsedConfig.success,
    limit,
    hasNextPage,
    isFetching,
    isError,
    fetchNextPage,
  ]);

  if (!canRead || !facilityId) return null;
  const heading = title ?? t("service_requests");

  if (!parsedConfig.success) {
    return (
      <section aria-label={heading}>
        <Alert variant="destructive">
          <AlertDescription>
            {t("encounter_widget_config_invalid")}
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const requests = (data?.pages.flatMap((page) => page.results) ?? []).slice(
    0,
    limit,
  );
  if (!isLoading && !isError && !requests.length && !showEmpty) return null;

  return (
    <section aria-label={heading} className="min-w-0">
      <EncounterAccordionLayout
        title={heading}
        readOnly={readOnly}
        presentation="panel"
        className="min-w-0 overflow-hidden"
      >
        {isLoading ? (
          <div role="status" aria-label={t("loading")}>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {isError && (
              <ClinicalListError isFetching={isFetching} onRetry={refetch} />
            )}
            {requests.length > 0 ? (
              <ServiceRequestTable
                requests={requests}
                facilityId={facilityId}
                showPatientInfo={false}
                readOnly={readOnly}
              />
            ) : (
              !isError && (
                <p className="px-2 py-5 text-sm text-gray-500">
                  {t("no_service_requests_found")}
                </p>
              )
            )}
            {limit !== undefined && isFetchingNextPage && (
              <div role="status" aria-label={t("loading")}>
                <Skeleton className="h-14 w-full" />
              </div>
            )}
            {limit === undefined && hasNextPage && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isFetching}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? t("loading") : t("load_more")}
                </Button>
              </div>
            )}
          </div>
        )}
      </EncounterAccordionLayout>
    </section>
  );
}
