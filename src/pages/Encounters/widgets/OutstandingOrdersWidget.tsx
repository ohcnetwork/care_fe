import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import { useInfiniteList } from "@/hooks/useInfiniteList";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  SERVICE_REQUEST_STATUS_COLORS,
  type ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { outstandingOrdersConfigSchema } from "@/types/workspace/widgetConfigSchemas";
import query from "@/Utils/request/query";
import { formatDateTime, relativeTime } from "@/Utils/utils";

interface OutstandingOrdersWidgetProps {
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

// Bounds the automatic follow-up requests when nearly everything is excluded;
// past this the author can keep paging with "Load more".
const MAX_PAGES = 5;
// Exclusions are applied client-side, so fetch more than a tiny display limit
// per request to avoid exhausting MAX_PAGES on a handful of drafts.
const MIN_PAGE_SIZE = 20;

const EXCLUDED_STATUSES: readonly Status[] = [
  Status.draft,
  Status.entered_in_error,
  Status.revoked,
];

// The list endpoint does not serialize diagnostic reports. Keep this widget's
// data contract limited to the fields available on each listed order.
type ListedOrder = Pick<
  ServiceRequestReadSpec,
  "id" | "title" | "status" | "category" | "code" | "created_date"
>;

export function OutstandingOrdersWidget({
  title,
  showEmpty = false,
  config = {},
}: OutstandingOrdersWidgetProps) {
  const { t } = useTranslation();
  const {
    selectedEncounter,
    selectedEncounterId,
    patientId,
    facilityId: routeFacilityId,
    canReadClinicalData,
  } = useEncounter();
  const facilityId = selectedEncounter?.facility.id;
  const parsedConfig = outstandingOrdersConfigSchema.safeParse(config);
  const {
    category,
    include_completed: includeCompleted = true,
    include_on_hold: includeOnHold = true,
    limit = 10,
  } = parsedConfig.data ?? {};
  const canRead =
    canReadClinicalData &&
    !!facilityId &&
    selectedEncounter?.id === selectedEncounterId &&
    selectedEncounter?.patient.id === patientId;
  const isEligible = (request: ListedOrder) =>
    !EXCLUDED_STATUSES.includes(request.status) &&
    (includeCompleted || request.status !== Status.completed) &&
    (includeOnHold || request.status !== Status.on_hold);
  // The API filters one status at a time, so exclusions happen here. Keep
  // paging until enough eligible orders are in hand or the list runs out.
  const {
    data,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteList({
    queryKey: [
      "serviceRequests",
      facilityId,
      "outstanding-orders",
      selectedEncounterId,
      { category, limit },
    ],
    ...query.infinite(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId: facilityId ?? "" },
      queryParams: {
        encounter: selectedEncounterId,
        category,
        ordering: "-created_date",
      },
      pageSize: Math.max(limit, MIN_PAGE_SIZE),
      silent: true,
    }),
    select: (infiniteData) => ({
      results: infiniteData.pages.flatMap((page) => page.results),
      pagesLoaded: infiniteData.pages.length,
    }),
    enabled: canRead && parsedConfig.success,
  });
  const fetched: ListedOrder[] = data?.results ?? [];
  const eligible = fetched.filter(isEligible);
  const pagesLoaded = data?.pagesLoaded ?? 0;
  const needsMore =
    eligible.length < limit &&
    !!hasNextPage &&
    pagesLoaded < MAX_PAGES &&
    !isError;
  // The automatic search stopped at MAX_PAGES but the server has more orders,
  // so an empty or short list is not the whole picture.
  const capped =
    eligible.length < limit &&
    !!hasNextPage &&
    pagesLoaded >= MAX_PAGES &&
    !isError;
  useEffect(() => {
    if (canRead && parsedConfig.success && needsMore && !isFetching)
      fetchNextPage();
  }, [canRead, parsedConfig.success, needsMore, isFetching, fetchNextPage]);

  if (!canRead || !facilityId) return null;
  const heading = title ?? t("workspace_outstanding_orders");
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

  const orders = eligible.slice(0, limit);
  const settling = isLoading || needsMore;
  if (!settling && !isError && !orders.length && !showEmpty && !capped)
    return null;
  const sameFacility = routeFacilityId === facilityId;

  return (
    <section aria-label={heading} className="min-w-0">
      <EncounterAccordionLayout
        title={heading}
        readOnly
        presentation="panel"
        className="min-w-0 overflow-hidden"
      >
        {settling ? (
          <div role="status" aria-label={t("loading")}>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError ? (
          <ClinicalListError isFetching={isFetching} onRetry={refetch} />
        ) : !orders.length ? (
          <p className="px-2 py-5 text-sm text-soft-foreground">
            {t(
              capped
                ? "workspace_orders_none_in_recent"
                : "no_service_requests_found",
            )}
          </p>
        ) : (
          <div className="@container space-y-2">
            <ul className="divide-y divide-soft-border">
              {orders.map((order) => {
                return (
                  <li
                    key={order.id}
                    className="flex flex-col gap-1.5 py-2.5 @md:flex-row @md:items-center @md:gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {order.title || order.code?.display}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-soft-foreground">
                        <Badge
                          variant={
                            order.category === "imaging" ? "indigo" : "sky"
                          }
                          size="xs"
                          className="rounded-sm px-1.5 py-0"
                        >
                          {t(order.category)}
                        </Badge>
                        <time
                          dateTime={order.created_date}
                          title={formatDateTime(order.created_date)}
                        >
                          {t("workspace_orders_raised", {
                            time: relativeTime(order.created_date),
                          })}
                        </time>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 @md:justify-end">
                      <Badge
                        variant={SERVICE_REQUEST_STATUS_COLORS[order.status]}
                        size="xs"
                      >
                        {t(order.status)}
                      </Badge>
                      {sameFacility ? (
                        <Link
                          to="/facility/$facilityId/service_requests/$serviceRequestId"
                          params={{ facilityId, serviceRequestId: order.id }}
                          className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
                        >
                          {t("check_status")}
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {capped && !settling && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {t("load_more")}
          </Button>
        )}
      </EncounterAccordionLayout>
    </section>
  );
}
