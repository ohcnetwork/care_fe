import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import BecknFlow from "@/components/Resource/beckn/BecknFlow";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import query from "@/Utils/request/query";
import {
  getResourceRequestCategoryEnum,
  ResourceRequestRead,
  ResourceRequestStatus,
} from "@/types/resourceRequest/resourceRequest";
import resourceRequestApi from "@/types/resourceRequest/resourceRequestApi";

// Health service types the coordinator can book an appointment for.
const HEALTH_SERVICE_TYPES = [
  {
    value: "PHYSICAL_CONSULTATION",
    labelKey: "ccn_service_type__physical_consultation",
  },
  { value: "LAB_TEST", labelKey: "ccn_service_type__lab_test" },
] as const;

interface CcnConsoleProps {
  facilityId: string;
  resourceId?: string;
}

/**
 * Care-Coordinator console: incoming (receiving) ResourceRequests on the left,
 * and on selection the request detail on the right. The origin facility places
 * and confirms the referral itself (it is the BAP consumer), so requests reach
 * this console already `approved` — the desk's acceptance *is* the `on_confirm`
 * response. Once approved, the Beckn appointment-booking flow is enabled. The FE
 * never speaks Beckn directly — it calls Care BE's BAP REST endpoints (see
 * BecknFlow / the hook).
 */
export default function CcnConsole({
  facilityId,
  resourceId,
}: CcnConsoleProps) {
  const { t } = useTranslation();
  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ["ccn-resource-list", facilityId],
    queryFn: query(resourceRequestApi.list, {
      // Only requests this facility is receiving (assigned to).
      queryParams: { limit: 100, assigned_facility: facilityId },
    }),
  });

  const requests = list?.results ?? [];

  return (
    <div className="p-4">
      <PageTitle title={t("cc_console")} />
      <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-lg border">
        <aside className="w-80 shrink-0 overflow-y-auto border-r bg-gray-50">
          {listLoading ? (
            <div className="p-4 text-sm text-gray-500">{t("loading")}</div>
          ) : requests.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              {t("ccn_no_incoming_requests")}
            </div>
          ) : (
            <ul className="divide-y">
              {requests.map((item) => {
                const active = item.id === resourceId;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/facility/${facilityId}/ccn/${item.id}`}
                      className={[
                        "block px-4 py-3 hover:bg-white",
                        active ? "border-l-2 border-primary-600 bg-white" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {item.title || t("ccn_untitled_request")}
                        </span>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {item.origin_facility?.name ?? ""}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          {resourceId ? (
            <ResourceDetail facilityId={facilityId} resourceId={resourceId} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              {t("ccn_select_request_to_begin")}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ResourceDetail({
  facilityId,
  resourceId,
}: {
  facilityId: string;
  resourceId: string;
}) {
  const { t } = useTranslation();
  const { data: resource, isLoading } = useQuery({
    queryKey: ["ccn-resource", resourceId],
    queryFn: query(resourceRequestApi.get, {
      pathParams: { resourceRequestId: resourceId },
    }),
  });

  if (isLoading || !resource) {
    return <Loading />;
  }

  const isApproved = resource.status === ResourceRequestStatus.APPROVED;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>{resource.title || t("ccn_untitled_request")}</span>
            <Badge variant="secondary">
              {t(`resource_request_status__${resource.status}`)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <DetailRow
            label={t("patient")}
            value={resource.related_patient?.name ?? "—"}
          />
          <DetailRow
            label={t("category")}
            value={t(
              `resource_request_category__${getResourceRequestCategoryEnum(
                resource.category,
              )}`,
            )}
          />
          <DetailRow
            label={t("origin_facility")}
            value={resource.origin_facility?.name ?? "—"}
          />
          {resource.reason ? (
            <DetailRow label={t("reason")} value={resource.reason} />
          ) : null}
        </CardContent>
      </Card>

      {isApproved ? (
        <AppointmentBooking facilityId={facilityId} resource={resource} />
      ) : (
        <p className="text-sm text-gray-500">
          {t("ccn_booking_available_once_approved")}
        </p>
      )}
    </div>
  );
}

/**
 * Appointment booking for an approved request: the coordinator picks a health
 * service type, then runs the Beckn appointment flow (discover → select → slot
 * → confirm).
 */
function AppointmentBooking({
  facilityId,
  resource,
}: {
  facilityId: string;
  resource: ResourceRequestRead;
}) {
  const { t } = useTranslation();
  const [healthServiceType, setHealthServiceType] = useState<string>(
    HEALTH_SERVICE_TYPES[0].value,
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{t("ccn_service_type")}</p>
        <Select value={healthServiceType} onValueChange={setHealthServiceType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("ccn_select_service_type")} />
          </SelectTrigger>
          <SelectContent>
            {HEALTH_SERVICE_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <BecknFlow
        serviceType="appointment"
        facilityId={facilityId}
        patient={{ name: resource.related_patient?.name ?? undefined }}
        discover={{ healthServiceType }}
        // coordinationRef links the booking to the originating referral. The RR
        // record does not currently expose the Beckn coordinationId; wire it
        // here once the BE surfaces it.
        coordinationRef={undefined}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
