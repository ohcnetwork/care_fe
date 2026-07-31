import dayjs from "dayjs";
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  FileText,
  Info,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { PatientAppShell } from "@/components/Patient/PatientAppShell";
import { PatientBadge } from "@/components/Patient/PatientBadge";
import { patientMetaLine } from "@/components/Patient/PatientProfileCard";
import { PrescriptionRow } from "@/components/Patient/PrescriptionRow";

import {
  usePatientAppointments,
  usePatientDiagnosticReports,
  usePatientPrescriptions,
} from "@/hooks/usePatientPortalData";
import { usePatientContext } from "@/hooks/usePatientUser";

import { formatSlotTimeRange } from "@/pages/Appointments/utils";
import { PrescritionList } from "@/types/emr/prescription/prescription";
import {
  PublicAppointment,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";

import { reportFlagSummary, reportTitle } from "./records/reportUtils";

/**
 * Four tiles share a 390px row, so each label has to hold one line — the full
 * destination names ("Diagnostic Reports") wrap to three and triple the tile.
 */
const QUICK_ACTIONS = [
  {
    key: "book_appointment",
    label: "patient_home__quick_book_op",
    href: "/nearby_facilities",
    icon: CalendarPlus,
  },
  {
    key: "prescriptions",
    label: "patient_home__quick_rx",
    href: "/patient/records?tab=prescriptions",
    icon: FileText,
  },
  {
    key: "diagnostic_reports",
    label: "reports",
    href: "/patient/records?tab=reports",
    icon: Activity,
  },
  {
    key: "visits",
    label: "visits",
    href: "/patient/visits",
    icon: CalendarDays,
  },
] as const;

/**
 * Reschedule and cancel are deliberately absent: the home card is a glance, and
 * both actions want the full appointment in front of you. They live on the
 * visit screen this card opens.
 */
function UpcomingAppointmentCard({
  appointment,
}: {
  appointment: PublicAppointment;
}) {
  const { t } = useTranslation();
  const start = dayjs(appointment.token_slot.start_datetime);

  return (
    <Link
      href={`/patient/visits/${appointment.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-linear-to-r from-primary-100/50 to-transparent p-4 hover:border-primary-700"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-primary-700">
          {t("patient_home__upcoming_appointment")}
        </span>
        {/* Long statuses ("In Consultation") push the pills onto their own
            line rather than breaking the eyebrow label mid-word. */}
        <div className="flex items-center gap-1.5">
          <PatientBadge tone="neutral">{t(appointment.status)}</PatientBadge>
          {appointment.token && (
            <PatientBadge tone="solid">
              {t("token")} {renderTokenNumber(appointment.token)}
            </PatientBadge>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-13 shrink-0 rounded-xl border border-primary-200 bg-white py-1.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-primary-700">
            {start.format("ddd")}
          </div>
          <div className="text-xl font-bold leading-tight text-gray-900">
            {start.format("DD")}
          </div>
          <div className="text-[10px] text-gray-500">{start.format("MMM")}</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-bold text-gray-900">
            {formatScheduleResourceName(appointment)}
          </span>
          <span className="truncate text-sm text-gray-600">
            {appointment.token_slot.availability.name} ·{" "}
            {formatSlotTimeRange(appointment.token_slot)}
          </span>
          <span className="truncate text-sm text-gray-600">
            {appointment.facility.name}
          </span>
        </div>
        <ChevronRight className="mt-0.5 size-4.5 shrink-0 text-primary-700" />
      </div>
    </Link>
  );
}

/**
 * The section lists prescriptions, not the medicines inside them: a
 * prescription is the thing the patient was handed and the thing "See all"
 * opens, and flattening several of them into one medicine list left no way to
 * tell which visit a medicine came from.
 */
function RecentPrescriptionsPreview({
  prescriptions,
}: {
  prescriptions: PrescritionList[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {prescriptions.map((prescription) => (
        <PrescriptionRow key={prescription.id} prescription={prescription} />
      ))}
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-base font-bold text-gray-900">{title}</span>
      {/* The negative margin keeps the 44px hit area without inflating the row. */}
      <Link
        href={href}
        className="-my-3 flex min-h-11 items-center text-sm font-semibold text-primary-700"
      >
        {t("see_all")}
      </Link>
    </div>
  );
}

function PatientPortalIndex() {
  const { t } = useTranslation();
  const { patients, selectedPatient, isLoadingPatients } = usePatientContext();

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

  // Greeting the account holder by name only makes sense on their own profile:
  // after a switch the home has to identify whose records are on screen.
  // Nothing in the payload flags the account holder, so fall back to the same
  // assumption `PatientUserProvider` makes for the default selection.
  const isOwnProfile =
    !patients?.length || selectedPatient?.id === patients[0]?.id;

  return (
    <PatientAppShell>
      <div className="flex flex-col gap-3 px-[18px] pb-2 pt-[18px]">
        <div>
          <h2 className="mb-0.5 text-[22px] font-bold tracking-tight text-gray-900">
            {isOwnProfile
              ? t("patient_home__greeting", { name: firstName })
              : selectedPatient?.name}
          </h2>
          <p className="text-sm text-gray-600">
            {isOwnProfile
              ? `${dayjs().format("dddd, D MMMM")}${
                  selectedPatient?.geo_organization?.name
                    ? ` · ${selectedPatient.geo_organization.name}`
                    : ""
                }`
              : selectedPatient && patientMetaLine(selectedPatient, t)}
          </p>
        </div>

        {isLoading ? (
          <>
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : hasNothingRecorded ? (
          <>
            <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-gray-300 bg-white px-5 py-7 text-center">
              <span className="flex size-[62px] items-center justify-center rounded-[20px] bg-gray-100">
                <CalendarDays
                  className="size-7 text-gray-400"
                  strokeWidth={1.6}
                />
              </span>
              <div>
                <span className="block text-lg font-bold text-gray-900">
                  {t("patient_home__empty_heading")}
                </span>
                <span className="mt-1 block text-sm leading-normal text-gray-600">
                  {t("patient_home__empty_description", { name: firstName })}
                </span>
              </div>
              <Button className="mt-1 w-full" asChild>
                <Link href="/nearby_facilities">
                  {t("patient_home__book_first_appointment")}
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-3 rounded-[13px] bg-gray-100 p-[13px]">
              <Info
                className="size-[18px] shrink-0 text-gray-600"
                strokeWidth={1.9}
              />
              <span className="text-xs leading-snug text-gray-600">
                {t("patient_home__records_digitisation_note")}
              </span>
            </div>
          </>
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
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-1 py-4 hover:border-primary-200 hover:bg-primary-50"
                  >
                    <Icon
                      className="size-5 text-primary-700"
                      strokeWidth={1.8}
                    />
                    <span className="text-center text-xs font-semibold leading-tight text-gray-900">
                      {t(action.label)}
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
                <RecentPrescriptionsPreview
                  prescriptions={prescriptions.slice(0, 3)}
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
                      className="flex items-center gap-3 rounded-[13px] border border-gray-200 bg-white px-[13px] py-3 hover:border-gray-300"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {reportTitle(report, t)}
                        </span>
                        <span className="truncate text-xs text-gray-600">
                          {[
                            dayjs(report.created_date).format("DD MMM YYYY"),
                            report.encounter?.facility?.name,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                      {flags > 0 ? (
                        <PatientBadge tone="warning">
                          {t("patient_records__flagged_count", {
                            count: flags,
                          })}
                        </PatientBadge>
                      ) : (
                        <PatientBadge tone="success">
                          {t("normal")}
                        </PatientBadge>
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
