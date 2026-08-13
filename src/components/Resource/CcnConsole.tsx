import { useQuery } from "@tanstack/react-query";
import { Link, navigate, useQueryParams } from "raviger";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import query from "@/Utils/request/query";
import {
  becknPatientFrom,
  HEALTH_SERVICE_TYPES,
} from "@/types/beckn/becknModels";
import {
  getResourceRequestCategoryEnum,
  ResourceRequestListRead,
  ResourceRequestRead,
  ResourceRequestStatus,
} from "@/types/resourceRequest/resourceRequest";
import resourceRequestApi from "@/types/resourceRequest/resourceRequestApi";

// Health service types the coordinator can book an appointment for.

interface CcnConsoleProps {
  facilityId: string;
  resourceId?: string;
}

/** Which side of the referral this facility is on. */
type CcnTab = "incoming" | "outgoing";

/**
 * A request is Incoming when its origin facility is also its assigned facility.
 * Everything else in the assigned-to-self result set is Outgoing.
 */
function isIncomingRequest(request: ResourceRequestListRead): boolean {
  return (
    !!request.origin_facility?.id &&
    request.origin_facility.id === request.assigned_facility?.id
  );
}

/**
 * Care-Coordinator console: ResourceRequests on the left, and on selection the
 * request detail on the right.
 *
 * A single fetch (`assigned_facility=self`) returns every request routed to this
 * facility; the two tabs are then split client-side, avoiding a second query for
 * a filter the coordinator can derive itself. **Incoming** is the working tab —
 * requests whose origin facility is also the assigned facility, i.e. raised and
 * fulfilled here; the origin facility places and confirms the referral itself
 * (it is the BAP consumer), so requests reach this console already `approved` and
 * the desk can run the Beckn appointment-booking flow. **Outgoing** is every
 * other request (raised elsewhere, routed here) and is read-only, since booking
 * is the originating desk's job. The FE never speaks Beckn directly — it calls
 * Care BE's BAP REST endpoints (see BecknFlow / the hook).
 */
export default function CcnConsole({
  facilityId,
  resourceId,
}: CcnConsoleProps) {
  const { t } = useTranslation();
  // Kept in the URL so the tab survives selecting a request (which navigates)
  // and stays shareable. Anything unrecognised falls back to incoming.
  const [{ tab }] = useQueryParams<{ tab?: string }>();
  const activeTab: CcnTab = tab === "outgoing" ? "outgoing" : "incoming";
  const isOutgoing = activeTab === "outgoing";

  // One fetch for both tabs — everything assigned to this facility.
  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ["ccn-resource-list", facilityId],
    queryFn: query(resourceRequestApi.list, {
      queryParams: { limit: 100, origin_facility: facilityId },
    }),
  });

  // Incoming = origin facility is the assigned facility; Outgoing = the rest.
  const requests = (list?.results ?? []).filter((item) =>
    isOutgoing ? !isIncomingRequest(item) : isIncomingRequest(item),
  );

  // A request only exists in one of the two lists, so switching tabs drops the
  // current selection rather than leaving the detail pane out of step.
  const selectTab = (next: CcnTab) =>
    navigate(
      `/facility/${facilityId}/ccn${next === "outgoing" ? "?tab=outgoing" : ""}`,
    );

  return (
    <div className="p-4">
      <PageTitle title={t("cc_console")} />
      <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-lg border">
        <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-r bg-gray-50">
          <div className="shrink-0 border-b p-2">
            <Tabs value={activeTab}>
              <TabsList className="inline-flex h-8 w-full bg-transparent p-0">
                <TabsTrigger
                  value="incoming"
                  className="w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  onClick={() => selectTab("incoming")}
                >
                  {t("incoming")}
                </TabsTrigger>
                <TabsTrigger
                  value="outgoing"
                  className="w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  onClick={() => selectTab("outgoing")}
                >
                  {t("outgoing")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="p-4 text-sm text-gray-500">{t("loading")}</div>
            ) : requests.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                {isOutgoing
                  ? t("ccn_no_outgoing_requests")
                  : t("ccn_no_incoming_requests")}
              </div>
            ) : (
              <ul className="divide-y">
                {requests.map((item) => {
                  const active = item.id === resourceId;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/facility/${facilityId}/ccn/${item.id}${
                          isOutgoing ? "?tab=outgoing" : ""
                        }`}
                        className={[
                          "block px-4 py-3 hover:bg-white",
                          active
                            ? "border-l-2 border-primary-600 bg-white"
                            : "",
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
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          {resourceId ? (
            <ResourceDetail
              facilityId={facilityId}
              resourceId={resourceId}
              readOnly={isOutgoing}
            />
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
  readOnly,
}: {
  facilityId: string;
  resourceId: string;
  readOnly: boolean;
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

      {readOnly ? (
        <p className="text-sm text-gray-500">{t("ccn_outgoing_read_only")}</p>
      ) : isApproved ? (
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
        patient={becknPatientFrom(resource.related_patient)}
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
