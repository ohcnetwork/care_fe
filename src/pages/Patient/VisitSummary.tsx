import dayjs from "dayjs";
import { Activity, ChevronRight, FileText } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { Avatar } from "@/components/Common/Avatar";
import {
  CancelAppointmentButton,
  isAppointmentCancellable,
} from "@/components/Patient/CancelAppointmentButton";
import { PatientAppShell } from "@/components/Patient/PatientAppShell";

import {
  usePatientAppointments,
  usePatientDiagnosticReports,
  usePatientPrescriptions,
} from "@/hooks/usePatientPortalData";

import {
  APPOINTMENT_STATUS_COLORS,
  SchedulableResourceType,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";

import { reportTitle } from "./records/reportUtils";

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className="text-[13px] font-semibold text-gray-900">{value}</span>
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
  const { prescriptions } = usePatientPrescriptions();
  const { reports } = usePatientDiagnosticReports();

  const appointment = appointments.find((entry) => entry.id === appointmentId);

  // The OTP portal exposes no encounter link on appointments, so records are
  // matched to the visit by date rather than by encounter id.
  const visitDate = appointment
    ? dayjs(appointment.token_slot.start_datetime)
    : undefined;

  const sameDay = (isoDate: string) =>
    !!visitDate && dayjs(isoDate).isSame(visitDate, "day");

  const visitPrescriptions = prescriptions.filter((prescription) =>
    sameDay(prescription.created_date),
  );
  const visitReports = reports.filter((report) => sameDay(report.created_date));

  const canRebook =
    appointment?.resource_type === SchedulableResourceType.Practitioner;

  return (
    <PatientAppShell
      title={t("patient_visits__summary")}
      backTo="/patient/visits"
      hideTabs
    >
      <div className="flex flex-col gap-3 p-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : !appointment ? (
          <p className="py-10 text-center text-sm text-gray-600">
            {t("patient_visits__not_found")}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={formatScheduleResourceName(appointment)}
                  className="size-11 shrink-0 rounded-full"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-bold text-gray-900">
                    {formatScheduleResourceName(appointment)}
                  </span>
                  <span className="truncate text-[12.5px] text-gray-600">
                    {appointment.facility.name}
                  </span>
                </div>
                <Badge variant={APPOINTMENT_STATUS_COLORS[appointment.status]}>
                  {t(appointment.status)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2.5 border-t border-gray-100 pt-2.5">
                <MetaField
                  label={t("date")}
                  value={visitDate?.format("DD MMM YYYY, h:mm A") ?? "-"}
                />
                {appointment.token && (
                  <MetaField
                    label={t("token")}
                    value={renderTokenNumber(appointment.token)}
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

            {(visitPrescriptions.length > 0 || visitReports.length > 0) && (
              <>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {t("patient_visits__from_this_visit")}
                </span>

                {visitPrescriptions.map((prescription) => (
                  <Link
                    key={prescription.id}
                    href={`/patient/records/prescriptions/${prescription.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 hover:border-gray-300"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                      <FileText
                        className="size-4.5 text-primary-700"
                        strokeWidth={1.9}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                      {prescription.name || t("prescription")}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-gray-400" />
                  </Link>
                ))}

                {visitReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/patient/records/reports/${report.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 hover:border-gray-300"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                      <Activity
                        className="size-4.5 text-primary-700"
                        strokeWidth={1.9}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                      {reportTitle(report, t)}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-gray-400" />
                  </Link>
                ))}
              </>
            )}

            <div className="mt-2 flex flex-col gap-2">
              {canRebook && (
                <Button variant="outline" className="w-full" asChild>
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
                  className="w-full"
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
