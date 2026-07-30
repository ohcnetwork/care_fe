import { useQueries } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { formatDosage } from "@/components/Medicine/utils";
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
import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { displayMedicationName } from "@/types/emr/medicationRequest/medicationRequest";
import patientPortalApi from "@/types/emr/patientPortal/patientPortalApi";
import {
  PRESCRIPTION_STATUS_STYLES,
  PrescritionList,
} from "@/types/emr/prescription/prescription";
import {
  PublicAppointment,
  SchedulableResourceType,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";

import { reportFlagSummary, reportTitle } from "./records/reportUtils";

const QUICK_ACTIONS = [
  {
    key: "book_appointment",
    href: "/nearby_facilities",
    icon: CalendarPlus,
  },
  {
    key: "prescriptions",
    href: "/patient/records?tab=prescriptions",
    icon: FileText,
  },
  {
    key: "diagnostic_reports",
    href: "/patient/records?tab=reports",
    icon: Activity,
  },
  { key: "visits", href: "/patient/visits", icon: CalendarDays },
] as const;

function UpcomingAppointmentCard({
  appointment,
}: {
  appointment: PublicAppointment;
}) {
  const { t } = useTranslation();
  const start = dayjs(appointment.token_slot.start_datetime);

  // The reschedule route is practitioner-scoped, so only offer it for those.
  const canReschedule =
    appointment.resource_type === SchedulableResourceType.Practitioner;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-700">
          {t("patient_home__upcoming_appointment")}
        </span>
        {appointment.token && (
          <Badge variant="primary">
            {t("token")} {renderTokenNumber(appointment.token)}
          </Badge>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="w-[52px] shrink-0 rounded-xl border border-primary-200 bg-white py-1.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-primary-700">
            {start.format("ddd")}
          </div>
          <div className="text-xl font-bold leading-tight text-gray-900">
            {start.format("DD")}
          </div>
          <div className="text-[10px] text-gray-500">{start.format("MMM")}</div>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-bold text-gray-900">
            {formatScheduleResourceName(appointment)}
          </span>
          <span className="text-sm text-gray-600">
            {start.format("h:mm A")} · {appointment.facility.name}
          </span>
          <span className="text-sm text-gray-600">{t(appointment.status)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="min-h-11" asChild>
          <Link href={`/patient/visits/${appointment.id}`}>
            {t("view_details")}
          </Link>
        </Button>
        {canReschedule && (
          <Button size="sm" className="min-h-11" asChild>
            <Link
              href={`/facility/${appointment.facility.id}/appointments/${appointment.resource.id}/reschedule/${appointment.id}`}
            >
              {t("reschedule")}
            </Link>
          </Button>
        )}
        {isAppointmentCancellable(appointment) && (
          <CancelAppointmentButton
            appointment={appointment}
            size="sm"
            className="col-span-2 min-h-11"
          />
        )}
      </div>
    </div>
  );
}

/**
 * The prescription list payload carries no medicines, so the most recent
 * prescriptions are expanded to show what was actually prescribed.
 */
function RecentMedicinesPreview({
  prescriptions,
  token,
}: {
  prescriptions: PrescritionList[];
  token?: string;
}) {
  const { t } = useTranslation();

  const details = useQueries({
    queries: prescriptions.map((prescription) => ({
      queryKey: ["portal-prescription", prescription.id],
      queryFn: query(patientPortalApi.getPrescription, {
        pathParams: { id: prescription.id },
        headers: { Authorization: `Bearer ${token}` },
      }),
      enabled: !!token,
    })),
  });

  // Carry each prescription's status alongside its medicines so the badge
  // reflects reality rather than assuming everything shown is ongoing.
  const medications = details
    .flatMap((detail, index) =>
      (detail.data?.medications ?? []).map((medication) => ({
        medication,
        status: prescriptions[index]?.status,
      })),
    )
    .slice(0, 3);

  if (details.some((detail) => detail.isLoading)) {
    return <Skeleton className="h-14 w-full rounded-xl" />;
  }

  if (!medications.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {medications.map(({ medication, status }) => (
        <div
          key={medication.id}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5"
        >
          <span className="h-8 w-1.5 shrink-0 rounded-full bg-primary-700" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold text-gray-900">
              {displayMedicationName(medication)}
            </span>
            <span className="truncate text-xs text-gray-600">
              {formatDosage(medication.dosage_instruction?.[0]) || "-"}
            </span>
          </div>
          {status && (
            <Badge
              variant={PRESCRIPTION_STATUS_STYLES[status]}
              className="shrink-0"
            >
              {t(status)}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-bold text-gray-900">{title}</span>
      <Link
        href={href}
        className="flex min-h-11 items-center text-sm font-semibold text-primary-700"
      >
        {t("see_all")}
      </Link>
    </div>
  );
}

function PatientPortalIndex() {
  const { t } = useTranslation();
  const { selectedPatient, tokenData, isLoadingPatients } = usePatientContext();

  const { nextAppointment, isLoading: isLoadingAppointments } =
    usePatientAppointments();
  const { prescriptions, isLoading: isLoadingPrescriptions } =
    usePatientPrescriptions();
  const { ready: readyReports, isLoading: isLoadingReports } =
    usePatientDiagnosticReports();

  const isLoading =
    isLoadingPatients ||
    isLoadingAppointments ||
    isLoadingPrescriptions ||
    isLoadingReports;

  const hasNothingRecorded =
    !isLoading &&
    !nextAppointment &&
    !prescriptions.length &&
    !readyReports.length;

  const firstName = selectedPatient?.name.split(" ")[0] ?? "";

  return (
    <PatientAppShell>
      <div className="flex flex-col gap-4 p-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-gray-900">
            {t("patient_home__greeting", { name: firstName })}
          </h2>
          <p className="text-sm text-gray-600">
            {dayjs().format("dddd, D MMMM")}
            {selectedPatient?.geo_organization?.name &&
              ` · ${selectedPatient.geo_organization.name}`}
          </p>
        </div>

        {isLoading ? (
          <>
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : hasNothingRecorded ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-gray-300 bg-white px-5 py-7 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-gray-100">
              <CalendarDays
                className="size-7 text-gray-400"
                strokeWidth={1.6}
              />
            </span>
            <div>
              <span className="block text-lg font-bold text-gray-900">
                {t("patient_home__empty_heading")}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-gray-600">
                {t("patient_home__empty_description", { name: firstName })}
              </span>
            </div>
            <Button className="w-full" asChild>
              <Link href="/nearby_facilities">
                {t("patient_home__book_first_appointment")}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {nextAppointment && (
              <UpcomingAppointmentCard appointment={nextAppointment} />
            )}

            <div className="grid grid-cols-4 gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.key}
                    href={action.href}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-1 py-3 hover:border-primary-200 hover:bg-primary-50"
                  >
                    <Icon
                      className="size-5 text-primary-700"
                      strokeWidth={1.8}
                    />
                    <span className="text-center text-xs font-semibold leading-tight text-gray-900">
                      {t(action.key)}
                    </span>
                  </Link>
                );
              })}
            </div>

            {!!prescriptions.length && (
              <div className="flex flex-col gap-2">
                <SectionHeader
                  title={t("patient_home__recent_prescriptions")}
                  href="/patient/records?tab=prescriptions"
                />
                <RecentMedicinesPreview
                  prescriptions={prescriptions.slice(0, 2)}
                  token={tokenData?.token}
                />
              </div>
            )}

            {!!readyReports.length && (
              <div className="flex flex-col gap-2">
                <SectionHeader
                  title={t("patient_home__recent_reports")}
                  href="/patient/records?tab=reports"
                />
                {readyReports.slice(0, 2).map((report) => {
                  const flags = reportFlagSummary(report);
                  return (
                    <Link
                      key={report.id}
                      href={`/patient/records/reports/${report.id}`}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 hover:border-gray-300"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {reportTitle(report, t)}
                        </span>
                        <span className="truncate text-xs text-gray-600">
                          {dayjs(report.created_date).format("DD MMM YYYY")}
                        </span>
                      </div>
                      {flags > 0 ? (
                        <Badge variant="yellow">
                          {t("patient_records__flagged_count", {
                            count: flags,
                          })}
                        </Badge>
                      ) : (
                        <Badge variant="green">{t("normal")}</Badge>
                      )}
                      <ChevronRight className="size-4 shrink-0 text-gray-400" />
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </PatientAppShell>
  );
}

export default PatientPortalIndex;
