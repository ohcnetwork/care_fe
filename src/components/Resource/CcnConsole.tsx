import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "raviger";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import BecknFlow from "@/components/Resource/beckn/BecknFlow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import query from "@/Utils/request/query";
import { useBecknTransaction } from "@/hooks/useBecknTransaction";
import { buildReferralConfirmFromExtension } from "@/types/beckn/becknModels";
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
 * and on selection the request detail on the right. A `pending` request is
 * confirmed here (Beckn `confirm` → status becomes `approved`); once approved,
 * the Beckn appointment-booking flow is enabled. The FE never speaks Beckn
 * directly — it calls Care BE's BAP REST endpoints (see BecknFlow / the hook).
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
  const qc = useQueryClient();
  const { data: resource, isLoading } = useQuery({
    queryKey: ["ccn-resource", resourceId],
    queryFn: query(resourceRequestApi.get, {
      pathParams: { resourceRequestId: resourceId },
    }),
  });

  if (isLoading || !resource) {
    return <Loading />;
  }

  const isPending = resource.status === ResourceRequestStatus.PENDING;
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

      {isPending ? (
        <ReferralConfirm
          resource={resource}
          onApproved={() =>
            qc.invalidateQueries({ queryKey: ["ccn-resource", resourceId] })
          }
        />
      ) : null}

      {isApproved ? (
        <AppointmentBooking facilityId={facilityId} resource={resource} />
      ) : null}

      {!isPending && !isApproved ? (
        <p className="text-sm text-gray-500">
          {t("ccn_booking_available_once_approved")}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Confirm an incoming referral: resumes the Beckn transaction persisted on the
 * request (`extensions.beckn`) and fires `confirm`. On ON_CONFIRM the BE moves
 * the request to `approved`, so we refetch it to reveal the appointment flow.
 */
function ReferralConfirm({
  resource,
  onApproved,
}: {
  resource: ResourceRequestRead;
  onApproved: () => void;
}) {
  const { t } = useTranslation();
  const flow = useBecknTransaction();
  const ext = resource.extensions?.beckn;
  const transactionId = ext?.transactionId;

  const confirm = () => {
    const body = buildReferralConfirmFromExtension(ext, resource.id);
    if (!body || !transactionId) return;
    flow.resume(transactionId);
    void flow.act("confirm", body);
  };

  const approvedRef = useRef(false);
  useEffect(() => {
    if (flow.phase === "confirmed" && !approvedRef.current) {
      approvedRef.current = true;
      onApproved();
    }
  }, [flow.phase, onApproved]);

  // Busy from firing confirm until its `on_confirm` callback arrives (or fails).
  const busy = flow.acting || !!flow.awaiting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("ccn_confirm_referral")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {flow.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {flow.error}
          </div>
        ) : null}
        {!transactionId ? (
          <p className="text-sm text-gray-500">{t("ccn_no_linked_referral")}</p>
        ) : flow.phase === "confirmed" ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {t("ccn_referral_confirmed")}
          </div>
        ) : busy ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CareIcon icon="l-spinner" className="size-4 animate-spin" />
            {t("ccn_confirming_referral")}
          </div>
        ) : (
          <Button variant="primary" onClick={confirm}>
            {t("ccn_confirm_and_approve")}
          </Button>
        )}
      </CardContent>
    </Card>
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
