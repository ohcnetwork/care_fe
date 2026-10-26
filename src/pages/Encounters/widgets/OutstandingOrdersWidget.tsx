import { useQuery } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, CirclePause } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import query from "@/Utils/request/query";
import { formatDateTime, relativeTime } from "@/Utils/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import {
  type ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { outstandingOrdersConfigSchema } from "@/types/workspace/widgetConfigSchemas";

interface OutstandingOrdersWidgetProps {
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

const EXCLUDED_STATUSES: readonly Status[] = [
  Status.draft,
  Status.entered_in_error,
  Status.revoked,
];

type OrderOutcome = "ready" | "awaiting" | "on_hold";

function orderOutcome(request: ServiceRequestReadSpec): OrderOutcome {
  if (
    request.diagnostic_reports.some(
      (report) => report.status !== DiagnosticReportStatus.registered,
    )
  )
    return "ready";
  return request.status === Status.on_hold ? "on_hold" : "awaiting";
}

function latestReport(request: ServiceRequestReadSpec) {
  return [...request.diagnostic_reports]
    .filter((report) => report.status !== DiagnosticReportStatus.registered)
    .sort(
      (a, b) => Date.parse(b.modified_date) - Date.parse(a.modified_date),
    )[0];
}

const OUTCOME_STYLES: Record<
  OrderOutcome,
  { icon: typeof CircleCheck; className: string; labelKey: string }
> = {
  ready: {
    icon: CircleCheck,
    className: "text-green-700",
    labelKey: "workspace_orders_result_ready",
  },
  awaiting: {
    icon: CircleAlert,
    className: "text-amber-700",
    labelKey: "workspace_orders_no_result_yet",
  },
  on_hold: {
    icon: CirclePause,
    className: "text-gray-600",
    labelKey: "on_hold",
  },
};

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
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [
      "serviceRequests",
      facilityId,
      "outstanding-orders",
      selectedEncounterId,
      { category, limit },
    ],
    queryFn: query(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId: facilityId ?? "" },
      queryParams: {
        encounter: selectedEncounterId,
        category,
        limit,
        ordering: "-created_date",
      },
      silent: true,
    }),
    enabled: canRead && parsedConfig.success,
  });

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

  const orders = (data?.results ?? []).filter(
    (request) =>
      !EXCLUDED_STATUSES.includes(request.status) &&
      (includeCompleted || request.status !== Status.completed) &&
      (includeOnHold || request.status !== Status.on_hold),
  );
  if (!isLoading && !isError && !orders.length && !showEmpty) return null;
  const ready = orders.filter((order) => orderOutcome(order) === "ready");
  const sameFacility = routeFacilityId === facilityId;
  const reportBase = sameFacility
    ? `/facility/${facilityId}/patient/${patientId}/diagnostic_reports`
    : `/organization/organizationId/patient/${patientId}/diagnostic_reports`;

  return (
    <section aria-label={heading} className="min-w-0">
      <EncounterAccordionLayout
        title={heading}
        readOnly
        presentation="panel"
        className="min-w-0 overflow-hidden"
      >
        {isLoading ? (
          <div role="status" aria-label={t("loading")}>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError ? (
          <ClinicalListError isFetching={isFetching} onRetry={refetch} />
        ) : !orders.length ? (
          <p className="px-2 py-5 text-sm text-gray-500">
            {t("no_service_requests_found")}
          </p>
        ) : (
          <div className="@container space-y-2">
            <p className="text-xs text-gray-500">
              {t("workspace_orders_summary", {
                ready: ready.length,
                awaiting: orders.length - ready.length,
              })}
            </p>
            <ul className="divide-y divide-gray-100">
              {orders.map((order) => {
                const outcome = orderOutcome(order);
                const style = OUTCOME_STYLES[outcome];
                const OutcomeIcon = style.icon;
                const report = latestReport(order);
                return (
                  <li
                    key={order.id}
                    className="flex flex-col gap-1.5 py-2.5 @md:flex-row @md:items-center @md:gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {order.title || order.code?.display}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
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
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${style.className}`}
                      >
                        <OutcomeIcon className="size-3.5" aria-hidden="true" />
                        {t(style.labelKey)}
                      </span>
                      {report ? (
                        <Link
                          href={`${reportBase}/${report.id}`}
                          className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
                        >
                          {t("view_report")}
                        </Link>
                      ) : sameFacility ? (
                        <Link
                          href={`/facility/${facilityId}/service_requests/${order.id}`}
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
      </EncounterAccordionLayout>
    </section>
  );
}
