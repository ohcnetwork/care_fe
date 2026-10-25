import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2 } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/careui/badge";
import { Button, buttonVariants } from "@/components/careui/button";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import { ReferralResource } from "@/types/emr/referral/referralResource";
import referralResourceApi from "@/types/emr/referral/referralResourceApi";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

import { ReferralAppointmentAction } from "./ReferralAppointmentAction";
import { ReferralResourceContent } from "./ReferralResourceContent";
import { useReferralResourceLink } from "./useReferralResourceLink";
import {
  ResolvedReferralResourceState,
  useResolvedReferralResources,
} from "./useResolvedReferralResources";

function AppointmentSummary({
  attachment,
  patientId,
  resolved,
}: {
  attachment: ReferralResource;
  patientId: string;
  resolved: ResolvedReferralResourceState;
}) {
  const { t } = useTranslation();
  const link = useReferralResourceLink(attachment, patientId);
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
  canWrite,
}: {
  referral: ReferralRetrieve;
  canWrite: boolean;
}) {
  const { t } = useTranslation();
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
  if (records.isSuccess && !attachments.length && !canWrite) return null;
  return (
    <section
      aria-label={t("referral_appointment_visit")}
      className="space-y-3 border-b border-cui-border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          {t("referral_appointment_visit")}
        </h2>
        {canWrite && <ReferralAppointmentAction referral={referral} />}
      </div>
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
            patientId={referral.patient}
            resolved={resolved.get(attachment.id)!}
          />
        ))
      ) : null}
    </section>
  );
}
