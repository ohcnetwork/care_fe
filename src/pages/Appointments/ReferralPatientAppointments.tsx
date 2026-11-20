import { CalendarDays } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { getPermissions } from "@/common/Permissions";
import Page from "@/components/Common/Page";
import { useAppointmentReferral } from "@/components/Referral/useAppointmentReferral";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

import BookAppointmentSheet from "./BookAppointment/BookAppointmentSheet";
import { BookingsList } from "./BookAppointment/BookingsList";

// The appointment APIs authorize facility scheduling independently of chart
// access. A referral supplies only the patient's identity, never PatientRead
// or permission to open the source encounter.
export function ReferralPatientAppointments({
  patientId,
}: {
  patientId: string;
}) {
  const { t } = useTranslation();
  const context = useAppointmentReferral(patientId);
  const { facility, facilityId, isFacilityLoading } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const { canWriteAppointment, canViewAppointments } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );
  const loading = context.isLoading || isFacilityLoading;
  return (
    <Page title={t("appointments")}>
      <div className="space-y-5">
        {context.returnUrl && (
          <Link
            href={context.returnUrl}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("referral_return_to_referral")}
          </Link>
        )}
        {loading ? (
          <p role="status">{t("loading")}</p>
        ) : context.error || !context.referral ? (
          <div role="alert" className="space-y-3">
            <p>
              {context.error ?? t("referral_appointment_context_unavailable")}
            </p>
            {context.canRetry && (
              <Button variant="outline" onClick={() => void context.refetch()}>
                {t("retry")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("patient")}</p>
                <h2 className="text-lg font-semibold">
                  {context.referral.patient_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("referral_booking_for", { title: context.referral.title })}
                </p>
              </div>
              {canWriteAppointment && (
                <BookAppointmentSheet
                  patientId={patientId}
                  facilityId={facilityId}
                  trigger={
                    <Button>
                      <CalendarDays className="size-4" />
                      {t("schedule_appointment")}
                    </Button>
                  }
                />
              )}
            </header>
            {!canWriteAppointment && (
              <p role="status" className="text-sm text-muted-foreground">
                {t("referral_booking_receiver_help", {
                  facility: facility?.name ?? t("facility"),
                })}
              </p>
            )}
            {canViewAppointments && (
              <BookingsList
                patientId={patientId}
                facilityId={facilityId}
                appointmentQueryParams={context.successQueryParams}
              />
            )}
          </>
        )}
      </div>
    </Page>
  );
}
