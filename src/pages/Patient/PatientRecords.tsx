import dayjs from "dayjs";
import { ChevronRight, Clock, FileText } from "lucide-react";
import { Link, navigate, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  PatientAppShell,
  PatientHeaderTabs,
} from "@/components/Patient/PatientAppShell";
import { PatientBadge } from "@/components/Patient/PatientBadge";

import {
  usePatientDiagnosticReports,
  usePatientPrescriptions,
} from "@/hooks/usePatientPortalData";
import { usePatientContext } from "@/hooks/usePatientUser";

import { formatName } from "@/Utils/utils";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";

import {
  reportFlagSummary,
  reportIcon,
  reportTitle,
} from "./records/reportUtils";

type RecordsTab = "prescriptions" | "reports";
type PrescriptionFilter = "active" | "past";
type ReportFilter = "all" | "ready" | "processing";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  // The hit area stays 44px while the pill itself is the design's 27px; the
  // negative margin keeps the taller box from opening a gap above the list.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="group -my-2 inline-flex min-h-11 items-center rounded-full focus-visible:outline-none"
    >
      <span
        className={cn(
          "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors group-focus-visible:ring-2 group-focus-visible:ring-primary-700 group-focus-visible:ring-offset-2",
          active
            ? "bg-gray-900 text-white"
            : "border border-gray-200 bg-white text-gray-900 group-hover:border-gray-300",
        )}
      >
        {children}
      </span>
    </button>
  );
}

/**
 * The portal's full-height empty panel. The shared `EmptyState` card reads as a
 * short box pinned to the top of the page; these screens have nothing else on
 * them, so the panel centres and offers the two ways forward.
 */
function RecordsEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useTranslation();
  const { patients } = usePatientContext();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3.5 p-8 text-center">
      <span className="flex size-[72px] items-center justify-center rounded-[22px] bg-gray-100">
        <FileText className="size-8 text-gray-400" strokeWidth={1.6} />
      </span>
      <div>
        <h3 className="mb-1.5 text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-pretty text-sm leading-[1.5] text-gray-600">
          {description}
        </p>
      </div>
      <div className="mt-1.5 flex w-full flex-col gap-2.5">
        <Button asChild className="min-h-11 w-full">
          <Link href="/nearby_facilities">
            {t("patient_records__book_first_appointment")}
          </Link>
        </Button>
        {(patients?.length ?? 0) > 1 && (
          <Button
            variant="ghost"
            className="min-h-11 w-full"
            onClick={() => navigate("/patient/select-profile")}
          >
            {t("patient_records__switch_patient")}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PatientRecords() {
  const { t } = useTranslation();
  const { selectedPatient } = usePatientContext();
  const [{ tab }, setQueryParams] = useQueryParams<{ tab?: RecordsTab }>();

  const activeTab: RecordsTab = tab === "reports" ? "reports" : "prescriptions";
  const [prescriptionFilter, setPrescriptionFilter] =
    useState<PrescriptionFilter>("active");
  const [reportFilter, setReportFilter] = useState<ReportFilter>("all");

  const {
    active: activePrescriptions,
    past: pastPrescriptions,
    isLoading: isLoadingPrescriptions,
  } = usePatientPrescriptions();
  const {
    reports,
    ready: readyReports,
    processing: processingReports,
    isLoading: isLoadingReports,
  } = usePatientDiagnosticReports();

  const shownPrescriptions =
    prescriptionFilter === "active" ? activePrescriptions : pastPrescriptions;

  const shownReports =
    reportFilter === "ready"
      ? readyReports
      : reportFilter === "processing"
        ? processingReports
        : reports;

  const setTab = (next: RecordsTab) =>
    setQueryParams({ tab: next }, { replace: true });

  // The empty states address the patient by name, so fall back to the generic
  // headings rather than greeting a blank.
  const firstName = selectedPatient?.name.trim().split(/\s+/)[0];

  return (
    <PatientAppShell
      title={t("records")}
      headerTabs={
        <PatientHeaderTabs
          value={activeTab}
          onChange={setTab}
          tabs={[
            { key: "prescriptions", label: t("prescriptions") },
            { key: "reports", label: t("diagnostic_reports") },
          ]}
        />
      }
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 pt-[18px]">
        {activeTab === "prescriptions" ? (
          <>
            <div className="flex gap-2">
              <FilterChip
                active={prescriptionFilter === "active"}
                onClick={() => setPrescriptionFilter("active")}
              >
                {t("active")} · {activePrescriptions.length}
              </FilterChip>
              <FilterChip
                active={prescriptionFilter === "past"}
                onClick={() => setPrescriptionFilter("past")}
              >
                {t("past")} · {pastPrescriptions.length}
              </FilterChip>
            </div>

            {isLoadingPrescriptions ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : shownPrescriptions.length ? (
              <>
                {prescriptionFilter === "past" && (
                  <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-gray-500">
                    {t("patient_records__earlier")}
                  </span>
                )}
                {shownPrescriptions.map((prescription) => {
                  const isActive =
                    prescription.status === PrescriptionStatus.active;
                  return (
                    <Link
                      key={prescription.id}
                      href={`/patient/records/prescriptions/${prescription.id}`}
                      className={cn(
                        "flex items-center gap-2.5 rounded-2xl border bg-white p-4 hover:border-gray-300",
                        isActive
                          ? "border-primary-200"
                          : "border-gray-200 opacity-80",
                      )}
                    >
                      {/* The design lists each prescription's medicines here,
                          but the list payload carries only the header fields —
                          the medicines arrive with the detail request. So this
                          stays the design's compact card rather than a rich one
                          with an empty band where the medicines would go. */}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-bold text-gray-900">
                          {formatName(prescription.prescribed_by)}
                        </span>
                        <span className="truncate text-xs text-gray-600">
                          {[
                            dayjs(prescription.created_date).format(
                              "DD MMM YYYY",
                            ),
                            prescription.encounter?.facility?.name,
                            prescription.name,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                      <PatientBadge
                        tone={
                          isActive
                            ? "success"
                            : prescription.status ===
                                PrescriptionStatus.cancelled
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {t(prescription.status)}
                      </PatientBadge>
                      <ChevronRight
                        className="size-[17px] shrink-0 text-gray-600"
                        strokeWidth={2.1}
                        aria-hidden
                      />
                    </Link>
                  );
                })}
              </>
            ) : (
              <RecordsEmptyState
                title={
                  firstName
                    ? t("patient_records__no_prescriptions_for_name", {
                        name: firstName,
                      })
                    : t("no_medications_found")
                }
                description={t("patient_records__no_prescriptions_description")}
              />
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={reportFilter === "all"}
                onClick={() => setReportFilter("all")}
              >
                {t("all")} · {reports.length}
              </FilterChip>
              <FilterChip
                active={reportFilter === "ready"}
                onClick={() => setReportFilter("ready")}
              >
                {t("patient_records__ready")} · {readyReports.length}
              </FilterChip>
              <FilterChip
                active={reportFilter === "processing"}
                onClick={() => setReportFilter("processing")}
              >
                {t("patient_records__processing")} · {processingReports.length}
              </FilterChip>
            </div>

            {isLoadingReports ? (
              <Skeleton className="h-20 w-full rounded-2xl" />
            ) : shownReports.length ? (
              shownReports.map((report) => {
                const isReady = readyReports.includes(report);
                const flags = reportFlagSummary(report);
                const Icon = isReady ? reportIcon(report) : Clock;
                return (
                  <Link
                    key={report.id}
                    href={`/patient/records/reports/${report.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border bg-white p-4 hover:border-gray-300",
                      !isReady
                        ? "border-dashed border-gray-300 bg-gray-50"
                        : flags > 0
                          ? "border-warning-200"
                          : "border-gray-200",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-[42px] shrink-0 items-center justify-center rounded-xl",
                        isReady ? "bg-gray-100" : "bg-white",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5",
                          isReady ? "text-gray-900" : "text-gray-400",
                        )}
                        strokeWidth={isReady ? 1.8 : 1.9}
                      />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-bold text-gray-900">
                        {reportTitle(report, t)}
                      </span>
                      <span className="truncate text-xs text-gray-600">
                        {dayjs(report.created_date).format("DD MMM YYYY")}
                        {report.encounter?.facility?.name &&
                          ` · ${report.encounter.facility.name}`}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {!isReady ? (
                        <PatientBadge tone="info">
                          {t("patient_records__processing")}
                        </PatientBadge>
                      ) : flags > 0 ? (
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
                      <ChevronRight
                        className="size-4 text-gray-600"
                        strokeWidth={2.1}
                      />
                    </div>
                  </Link>
                );
              })
            ) : (
              <RecordsEmptyState
                title={
                  firstName
                    ? t("patient_records__no_reports_for_name", {
                        name: firstName,
                      })
                    : t("patient_records__no_reports")
                }
                description={t("patient_records__no_reports_description")}
              />
            )}
          </>
        )}
      </div>
    </PatientAppShell>
  );
}
