import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CalendarPlus, Loader2 } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { getPermissions } from "@/common/Permissions";
import { Badge } from "@/components/careui/badge";
import { Button, buttonVariants } from "@/components/careui/button";
import { usePermissions } from "@/context/PermissionContext";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import { ReferralResource } from "@/types/emr/referral/referralResource";
import referralResourceApi from "@/types/emr/referral/referralResourceApi";
import { CancelledAppointmentStatuses } from "@/types/scheduling/schedule";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

import { getReferralResponseUrl } from "./referralNavigation";
import { ReferralResourceContent } from "./ReferralResourceContent";
import { useReferralPermissions } from "./useReferralPermissions";
import { useReferralReceivingEncounter } from "./useReferralReceivingEncounter";
import { useReferralResourceLink } from "./useReferralResourceLink";
import {
  ResolvedReferralResourceState,
  useResolvedReferralResources,
} from "./useResolvedReferralResources";

function AppointmentSummary({
  attachment,
  referral,
  destinationFacilityId,
  resolved,
}: {
  attachment: ReferralResource;
  referral: ReferralRetrieve;
  destinationFacilityId?: string;
  resolved: ResolvedReferralResourceState;
}) {
  const { t } = useTranslation();
  const [{ sourceUrl }] = useQueryParams<{ sourceUrl?: string }>();
  const link = useReferralResourceLink(attachment, referral.patient);
  const facilityId = attachment.metadata?.facility_id ?? destinationFacilityId;
  const visit = useReferralReceivingEncounter({
    referralId:
      attachment.attachment_type === "response" ? referral.id : undefined,
    appointmentId: attachment.resource_id,
    facilityId,
    patientId: referral.patient,
  });
  const { canWrite } = useReferralPermissions(referral);
  const encounterUrl =
    visit.encounter && visit.appointment
      ? `/facility/${visit.encounter.facility.id}/patient/${referral.patient}/encounter/${visit.encounter.id}/updates?${new URLSearchParams(
          {
            referralId: referral.id,
            referralAppointmentId: visit.appointment.id,
            ...(typeof sourceUrl === "string"
              ? { referralSourceUrl: sourceUrl }
              : {}),
          },
        )}`
      : undefined;
  const appointment =
    !resolved.isError && resolved.data?.resource_type === "appointment"
      ? resolved.data.resource
      : undefined;
  return (
    <div className="rounded-lg border border-cui-border bg-cui-muted/30">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="min-w-0 space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <CalendarDays className="size-4 text-cui-primary" />
            {appointment
              ? formatDateTime(appointment.token_slot.start_datetime)
              : t("appointment")}
            {appointment && (
              <Badge
                variant={
                  appointment.status === "fulfilled"
                    ? "success"
                    : ["cancelled", "entered_in_error", "noshow"].includes(
                          appointment.status,
                        )
                      ? "neutral"
                      : "info"
                }
                size="xs"
              >
                {t(appointment.status)}
              </Badge>
            )}
          </div>
          <p className="break-words text-xs text-cui-muted-foreground">
            <span className="mr-2">
              {t(`referral_records_${attachment.attachment_type}`)}
            </span>
            {appointment?.token_slot.availability.name}
            {attachment.metadata?.facility_name &&
              ` · ${attachment.metadata.facility_name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {encounterUrl && (
            <Link
              href={encounterUrl}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("view_encounter")}
            </Link>
          )}
          {visit.encounter &&
            canWrite &&
            ["pending", "in_progress"].includes(referral.status) && (
              <Link
                href={getReferralResponseUrl(referral.id, sourceUrl, {
                  appointmentId: attachment.resource_id,
                  facilityId,
                })}
                className={buttonVariants({ size: "sm" })}
              >
                {t("referral_respond")}
              </Link>
            )}
          {link.data && !link.isError && (
            <Link
              href={link.data}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("referral_manage_appointment")}
            </Link>
          )}
        </div>
      </div>
      {visit.encounter && (
        <p className="px-3 pb-3 text-sm text-cui-muted-foreground">
          {t("referral_receiving_encounter_summary", {
            facility: visit.encounter.facility.name,
            status: t(`encounter_status__${visit.encounter.status}`),
          })}
        </p>
      )}
      <div className="border-t border-cui-border p-3">
        {resolved.isLoading ? (
          <p role="status" className="flex items-center gap-2 text-sm">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            {t("loading")}
          </p>
        ) : resolved.isError ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-cui-muted-foreground">
              {t("referral_record_unavailable")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void resolved.refetch()}
            >
              {t("retry")}
            </Button>
          </div>
        ) : (
          resolved.data && <ReferralResourceContent data={resolved.data} />
        )}
      </div>
    </div>
  );
}

export function ReferralAppointments({
  referral,
}: {
  referral: ReferralRetrieve;
}) {
  const { t } = useTranslation();
  const [{ sourceUrl }] = useQueryParams<{ sourceUrl?: string }>();
  const { canWriteAtDestination, destinationFacility, sourceFacilityId } =
    useReferralPermissions(referral);
  const { hasPermission } = usePermissions();
  const { canWriteAppointment } = getPermissions(
    hasPermission,
    destinationFacility?.permissions ?? [],
  );
  const canBook =
    ["pending", "in_progress"].includes(referral.status) &&
    canWriteAtDestination &&
    canWriteAppointment &&
    !!destinationFacility &&
    sourceFacilityId !== destinationFacility.id;
  const bookingParams = new URLSearchParams({
    open_schedule: "true",
    referralId: referral.id,
  });
  if (typeof sourceUrl === "string")
    bookingParams.set("referralSourceUrl", sourceUrl);
  const records = useQuery({
    queryKey: ["referrals", referral.id, "appointments"],
    queryFn: query.paginated(referralResourceApi.list, {
      pathParams: { referralId: referral.id },
      queryParams: { resource_type: "appointment" },
      silent: true,
    }),
    retry: false,
  });
  const attachments = records.data?.results ?? [];
  const resolved = useResolvedReferralResources(attachments);
  const hasCurrentAppointment = attachments.some((attachment) => {
    if (attachment.attachment_type !== "response") return false;
    // An originating visit or a visit at another facility must not suppress
    // booking at this referral's destination. Unknown response links stay closed.
    if (
      attachment.metadata?.facility_id &&
      attachment.metadata.facility_id !== destinationFacility?.id
    )
      return false;
    const state = resolved.get(attachment.id);
    const appointment =
      state?.data?.resource_type === "appointment"
        ? state.data.resource
        : undefined;
    return (
      !appointment || !CancelledAppointmentStatuses.includes(appointment.status)
    );
  });
  if (records.isSuccess && !attachments.length && !canBook) return null;
  return (
    <section
      aria-label={t("referral_appointment_visit")}
      className="space-y-3 border-b border-cui-border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          {t("referral_appointment_visit")}
        </h2>
        {records.isSuccess && canBook && !hasCurrentAppointment && (
          <Link
            href={`/facility/${destinationFacility.id}/patient/${referral.patient}/appointments?${bookingParams}`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <CalendarPlus aria-hidden="true" className="size-4" />
            {t("referral_book_appointment")}
          </Link>
        )}
      </div>
      {records.isSuccess && !attachments.length && canBook && (
        <p className="text-sm text-cui-muted-foreground">
          {t("referral_receiving_visit_help", {
            facility: destinationFacility.name,
          })}
        </p>
      )}
      {records.isPending ? (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-cui-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" />
          {t("loading")}
        </p>
      ) : records.isError ? (
        <div role="alert" className="flex items-center gap-3 text-sm">
          <p>{t("referral_records_load_error")}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void records.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      ) : attachments.length ? (
        attachments.map((attachment) => (
          <AppointmentSummary
            key={attachment.id}
            attachment={attachment}
            referral={referral}
            destinationFacilityId={destinationFacility?.id}
            resolved={resolved.get(attachment.id)!}
          />
        ))
      ) : null}
    </section>
  );
}
