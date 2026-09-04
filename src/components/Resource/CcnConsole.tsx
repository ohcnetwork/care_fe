import { useQuery } from "@tanstack/react-query";
import { Link, navigate, useQueryParams } from "raviger";
import { ComponentProps, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import AppointmentWizard from "@/components/Resource/beckn/AppointmentWizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import query from "@/Utils/request/query";
import { relativeTime } from "@/Utils/utils";
import { becknPatientFrom } from "@/types/beckn/becknModels";
import {
  getResourceRequestCategoryEnum,
  ResourceRequestListRead,
  ResourceRequestRead,
  ResourceRequestStatus,
} from "@/types/resourceRequest/resourceRequest";
import resourceRequestApi from "@/types/resourceRequest/resourceRequestApi";

interface CcnConsoleProps {
  facilityId: string;
  resourceId?: string;
}

/** Which side of the referral this facility is on. */
type CcnTab = "incoming" | "outgoing";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const STATUS_BADGE_VARIANTS: Record<ResourceRequestStatus, BadgeVariant> = {
  [ResourceRequestStatus.PENDING]: "yellow",
  [ResourceRequestStatus.APPROVED]: "blue",
  [ResourceRequestStatus.REJECTED]: "destructive",
  [ResourceRequestStatus.CANCELLED]: "destructive",
  [ResourceRequestStatus.TRANSPORTATION_TO_BE_ARRANGED]: "orange",
  [ResourceRequestStatus.TRANSFER_IN_PROGRESS]: "sky",
  [ResourceRequestStatus.COMPLETED]: "green",
};

/**
 * A request is Incoming when its origin facility is also its assigned facility.
 * Everything else in the result set is Outgoing.
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
 * A single fetch (`origin_facility=self`) returns every request raised by this
 * facility; the two tabs are then split client-side, avoiding a second query
 * for a filter the coordinator can derive itself. **Incoming** is the working
 * tab — requests whose origin facility is also the assigned facility, i.e.
 * raised and fulfilled here; the origin facility places and confirms the
 * referral itself (it is the BAP consumer), so requests reach this console
 * already `approved` and the desk can run the Beckn appointment-booking flow.
 * **Outgoing** is every other request (routed elsewhere) and is read-only,
 * since booking is the receiving desk's job. The FE never speaks Beckn
 * directly — it calls Care BE's BAP REST endpoints (see AppointmentWizard /
 * the hook).
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

  // One fetch for both tabs — everything raised by this facility.
  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ["ccn-resource-list", facilityId],
    queryFn: query(resourceRequestApi.list, {
      queryParams: { limit: 100, origin_facility: facilityId },
    }),
  });

  // Incoming = origin facility is the assigned facility; Outgoing = the rest.
  const results = list?.results ?? [];
  const incoming = results.filter(isIncomingRequest);
  const outgoing = results.filter((item) => !isIncomingRequest(item));
  const requests = isOutgoing ? outgoing : incoming;

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
                  className="w-full gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  onClick={() => selectTab("incoming")}
                >
                  {t("incoming")}
                  {!listLoading && (
                    <span className="rounded-full bg-gray-200 px-1.5 text-[10px] tabular-nums">
                      {incoming.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="outgoing"
                  className="w-full gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  onClick={() => selectTab("outgoing")}
                >
                  {t("outgoing")}
                  {!listLoading && (
                    <span className="rounded-full bg-gray-200 px-1.5 text-[10px] tabular-nums">
                      {outgoing.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                className="m-3 bg-transparent"
                icon={
                  <CareIcon
                    icon={isOutgoing ? "l-hospital" : "l-inbox"}
                    className="size-6 text-primary"
                  />
                }
                title={
                  isOutgoing
                    ? t("ccn_empty_outgoing_title")
                    : t("ccn_empty_incoming_title")
                }
                description={
                  isOutgoing
                    ? t("ccn_empty_outgoing_description")
                    : t("ccn_empty_incoming_description")
                }
              />
            ) : (
              <ul className="divide-y">
                {requests.map((item) => (
                  <RequestListItem
                    key={item.id}
                    item={item}
                    facilityId={facilityId}
                    isOutgoing={isOutgoing}
                    active={item.id === resourceId}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          {resourceId ? (
            // Keyed so per-request state (the booked banner, wizard progress)
            // can never leak across selections via a cached detail query.
            <ResourceDetail
              key={resourceId}
              facilityId={facilityId}
              resourceId={resourceId}
              readOnly={isOutgoing}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                className="border-none shadow-none"
                icon={
                  <CareIcon
                    icon="l-file-medical"
                    className="size-6 text-primary"
                  />
                }
                title={t("ccn_select_request_title")}
                description={t("ccn_select_request_to_begin")}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function RequestListItem({
  item,
  facilityId,
  isOutgoing,
  active,
}: {
  item: ResourceRequestListRead;
  facilityId: string;
  isOutgoing: boolean;
  active: boolean;
}) {
  const { t } = useTranslation();
  const readyToBook =
    !isOutgoing && item.status === ResourceRequestStatus.APPROVED;

  return (
    <li>
      <Link
        href={`/facility/${facilityId}/ccn/${item.id}${
          isOutgoing ? "?tab=outgoing" : ""
        }`}
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
            variant={STATUS_BADGE_VARIANTS[item.status] ?? "secondary"}
            className="shrink-0 text-[10px]"
          >
            {t(`resource_request_status__${item.status}`)}
          </Badge>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500">
          <span className="truncate">{item.origin_facility?.name ?? ""}</span>
          <span className="shrink-0">{relativeTime(item.modified_date)}</span>
        </div>
        {readyToBook ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary-700">
            <CareIcon icon="l-calender" className="size-3" />
            {t("ccn_ready_to_book")}
          </p>
        ) : null}
      </Link>
    </li>
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
            <Badge
              variant={STATUS_BADGE_VARIANTS[resource.status] ?? "secondary"}
            >
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
        <BookingLauncher facilityId={facilityId} resource={resource} />
      ) : (
        <p className="text-sm text-gray-500">
          {t("ccn_booking_available_once_approved")}
        </p>
      )}
    </div>
  );
}

/**
 * Entry point to the appointment flow for an approved request: a CTA card that
 * opens the full-screen wizard, and — once the wizard confirms — a booked
 * banner in its place.
 */
function BookingLauncher({
  facilityId,
  resource,
}: {
  facilityId: string;
  resource: ResourceRequestRead;
}) {
  const { t } = useTranslation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [booked, setBooked] = useState(false);

  return (
    <>
      {booked ? (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CareIcon icon="l-check-circle" className="size-5 shrink-0" />
          <p className="font-medium">{t("ccn_booked_banner")}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div className="min-w-0">
              <p className="font-medium">{t("book_appointment")}</p>
              <p className="mt-0.5 text-sm text-gray-500">
                {t("ccn_booking_cta_description")}
              </p>
            </div>
            <Button variant="primary" onClick={() => setWizardOpen(true)}>
              <CareIcon icon="l-calender" className="size-4" />
              {t("book_appointment")}
            </Button>
          </CardContent>
        </Card>
      )}

      <AppointmentWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        facilityId={facilityId}
        patient={becknPatientFrom(resource.related_patient)}
        // coordinationRef links the booking to the originating referral. The RR
        // record does not currently expose the Beckn coordinationId; wire it
        // here once the BE surfaces it.
        coordinationRef={undefined}
        onBooked={() => setBooked(true)}
      />
    </>
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
