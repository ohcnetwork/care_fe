import dayjs from "dayjs";
import { Activity, ChevronRight, FileText } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { Avatar } from "@/components/Common/Avatar";
import { AppointmentTokenPass } from "@/components/Patient/AppointmentTokenPass";
import {
  CancelAppointmentButton,
  isAppointmentCancellable,
} from "@/components/Patient/CancelAppointmentButton";
import { PatientAppShell } from "@/components/Patient/PatientAppShell";
import { PatientBadge } from "@/components/Patient/PatientBadge";

import {
  usePatientAppointments,
  usePatientEncounterRecords,
} from "@/hooks/usePatientPortalData";

import { formatName } from "@/Utils/utils";
import {
  SchedulableResourceType,
  UpcomingAppointmentStatuses,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";

import { VISIT_STATUS_TONES } from "./PatientVisits";
import { reportTitle } from "./records/reportUtils";

/** primary-100 / primary-800 — the portal's own circle, not a random pastel. */
const CLINICIAN_AVATAR_COLORS: [string, string] = ["#def7ec", "#03543f"];

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function VisitSummary({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const { t } = useTranslation();
  const { appointments, isLoading } = usePatientAppointments();

  const appointment = appointments.find((entry) => entry.id === appointmentId);

  const visitDate = appointment
    ? dayjs(appointment.token_slot.start_datetime)
    : undefined;

  // Present only once the patient has actually been seen — until then the
  // endpoint sends `{}` rather than omitting the key.
  const encounterId = appointment?.associated_encounter?.id;

  const {
    prescriptions: visitPrescriptions,
    reports: visitReports,
    isLoading: isLoadingRecords,
  } = usePatientEncounterRecords(encounterId);

  const isPractitionerVisit =
    appointment?.resource_type === SchedulableResourceType.Practitioner;

  // "Upcoming" here means the visit has not been closed out — the pass is still
  // the thing the patient needs at the counter, right through check-in.
  const isUpcoming =
    !!appointment && UpcomingAppointmentStatuses.includes(appointment.status);

  const isPassVisible = isUpcoming;
  const canReschedule = isPractitionerVisit && isUpcoming;
  const canRebook = isPractitionerVisit;

  return (
    <PatientAppShell
      title={t("patient_visits__summary")}
      backTo="/patient/visits"
      hideTabs
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : !appointment ? (
          <p className="py-10 text-center text-sm text-gray-600">
            {t("patient_visits__not_found")}
          </p>
        ) : (
          <>
            {/* Until the visit is done with, this screen *is* the booking
                confirmation — the success page is unreachable once you have
                navigated away from it, so the pass it showed lives here. */}
            {isPassVisible && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-gray-500">
                    {t("patient_visits__show_at_counter")}
                  </span>
                  <PatientBadge tone={VISIT_STATUS_TONES[appointment.status]}>
                    {t(appointment.status)}
                  </PatientBadge>
                </div>
                <AppointmentTokenPass appointment={appointment} />
              </>
            )}

            {/* The pass already names the clinician, session, time and
                facility, so alongside it this card carries only what the pass
                leaves out — and for an upcoming visit with no reason recorded
                that is nothing worth a card. A past visit carries the lot. */}
            {(!isPassVisible || !!appointment.note) && (
              <div className="flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-white p-4">
                {!isPassVisible && (
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={formatScheduleResourceName(appointment)}
                      colors={CLINICIAN_AVATAR_COLORS}
                      className="size-11 shrink-0 rounded-full"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-bold text-gray-900">
                        {formatScheduleResourceName(appointment)}
                      </span>
                      {/* The shell's header carries no subtitle, so the visit's
                        date is the context this line has to hold. */}
                      <span className="truncate text-xs text-gray-600">
                        {visitDate?.format("DD MMM YYYY · h:mm A") ?? "-"}
                      </span>
                    </div>
                    <PatientBadge tone={VISIT_STATUS_TONES[appointment.status]}>
                      {t(appointment.status)}
                    </PatientBadge>
                  </div>
                )}
                <div
                  className={cn(
                    "grid grid-cols-2 gap-2.5",
                    !isPassVisible && "border-t border-gray-100 pt-2.5",
                  )}
                >
                  {!isPassVisible && (
                    <>
                      <MetaField
                        label={t("facility")}
                        value={appointment.facility.name}
                      />
                      <MetaField
                        label={t("session")}
                        value={appointment.token_slot.availability.name}
                      />
                    </>
                  )}
                  {appointment.token && !isPassVisible && (
                    <MetaField
                      label={t("token")}
                      value={renderTokenNumber(appointment.token)}
                    />
                  )}
                  {!isPassVisible && (
                    <MetaField
                      label={t("booked_on")}
                      value={dayjs(appointment.booked_on).format("DD MMM YYYY")}
                    />
                  )}
                  {appointment.note && (
                    <div className="col-span-2">
                      <MetaField
                        label={t("patient_visits__reason")}
                        value={appointment.note}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {isLoadingRecords && (
              <Skeleton className="h-[62px] w-full rounded-[14px]" />
            )}

            {(visitPrescriptions.length > 0 || visitReports.length > 0) && (
              <>
                <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-gray-500">
                  {t("patient_visits__from_this_visit")}
                </span>

                {visitPrescriptions.map((prescription) => {
                  // The list payload carries no medications, so the prescriber
                  // is the most useful second line available.
                  const prescribedBy = formatName(prescription.prescribed_by);
                  return (
                    <Link
                      key={prescription.id}
                      href={`/patient/records/prescriptions/${prescription.id}`}
                      className="flex items-center gap-3 rounded-[14px] border border-gray-200 bg-white px-4 py-3 hover:border-gray-300"
                    >
                      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary-50">
                        <FileText
                          className="size-4.5 text-primary-700"
                          strokeWidth={1.9}
                        />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {prescription.name || t("prescription")}
                        </span>
                        <span className="truncate text-xs text-gray-600">
                          {prescribedBy === "-"
                            ? t(prescription.status)
                            : prescribedBy}
                        </span>
                      </div>
                      <ChevronRight className="size-4.5 shrink-0 text-gray-600" />
                    </Link>
                  );
                })}

                {visitReports.map((report) => {
                  const title = reportTitle(report, t);
                  const category = report.category?.display;
                  return (
                    <Link
                      key={report.id}
                      href={`/patient/records/reports/${report.id}`}
                      className="flex items-center gap-3 rounded-[14px] border border-gray-200 bg-white px-4 py-3 hover:border-gray-300"
                    >
                      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary-50">
                        <Activity
                          className="size-4.5 text-primary-700"
                          strokeWidth={1.9}
                        />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {title}
                        </span>
                        <span className="truncate text-xs text-gray-600">
                          {/* `reportTitle` may already have fallen back to the
                              category — don't repeat it. */}
                          {category && category !== title
                            ? category
                            : t(report.status)}
                        </span>
                      </div>
                      <ChevronRight className="size-4.5 shrink-0 text-gray-600" />
                    </Link>
                  );
                })}
              </>
            )}

            {/* Every action for this appointment collects here, off the list
                cards, so changing a booking is a deliberate step. */}
            <div className="mt-auto flex flex-col gap-2 pt-4">
              {canReschedule && (
                <Button className="min-h-11 w-full" asChild>
                  <Link
                    href={`/facility/${appointment.facility.id}/appointments/${appointment.resource.id}/reschedule/${appointment.id}`}
                  >
                    {t("reschedule")}
                  </Link>
                </Button>
              )}
              {canRebook && !isUpcoming && (
                <Button variant="outline" className="min-h-11 w-full" asChild>
                  <Link
                    href={`/facility/${appointment.facility.id}/appointments/${appointment.resource.id}/book-appointment`}
                  >
                    {t("patient_visits__book_follow_up")}
                  </Link>
                </Button>
              )}
              {isAppointmentCancellable(appointment) && (
                <CancelAppointmentButton
                  appointment={appointment}
                  variant="ghost"
                  className="min-h-11 w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                  onCancelled={() => navigate("/patient/visits")}
                />
              )}
            </div>
          </>
        )}
      </div>
    </PatientAppShell>
  );
}
