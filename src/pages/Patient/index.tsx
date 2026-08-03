import dayjs from "dayjs";
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  FileText,
  Info,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { DiagnosticReportRow } from "@/components/Patient/DiagnosticReportRow";
import { PatientAppShell } from "@/components/Patient/PatientAppShell";
import { patientMetaLine } from "@/components/Patient/PatientProfileCard";
import { PrescriptionRow } from "@/components/Patient/PrescriptionRow";
import { VisitCard } from "@/components/Patient/VisitCard";

import {
  READY_REPORT_STATUSES,
  usePatientAppointments,
  usePatientDiagnosticReports,
  usePatientPrescriptions,
} from "@/hooks/usePatientPortalData";
import { usePatientContext } from "@/hooks/usePatientUser";

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
  const { reports: readyReports, isLoading: isLoadingReports } =
    usePatientDiagnosticReports({ status: READY_REPORT_STATUSES });

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

  const isOwnProfile =
    !patients?.length || selectedPatient?.id === patients[0]?.id;

  return (
    <PatientAppShell>
      <div className="flex flex-col gap-3 px-4.5 pb-2 pt-4.5">
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
              <span className="flex size-15.5 items-center justify-center rounded-[20px] bg-gray-100">
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
                className="size-4.5 shrink-0 text-gray-600"
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
              <VisitCard
                variant="upcoming"
                appointment={nextAppointment}
                eyebrow={t("patient_home__upcoming_appointment")}
              />
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
                {prescriptions.slice(0, 2).map((prescription) => (
                  <PrescriptionRow
                    key={prescription.id}
                    prescription={prescription}
                  />
                ))}
              </div>
            )}

            {!!readyReports.length && (
              <div className="flex flex-col gap-2">
                <SectionHeader
                  title={t("patient_home__recent_reports")}
                  href="/patient/records?tab=reports"
                />
                {readyReports.slice(0, 2).map((report) => (
                  <DiagnosticReportRow key={report.id} report={report} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PatientAppShell>
  );
}

export default PatientPortalIndex;
