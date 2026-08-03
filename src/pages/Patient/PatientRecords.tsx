import { FileText } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { InfiniteScrollSentinel } from "@/components/Common/InfiniteScrollSentinel";
import { DiagnosticReportRow } from "@/components/Patient/DiagnosticReportRow";
import {
  PatientAppShell,
  PatientHeaderTabs,
  usePatientShell,
} from "@/components/Patient/PatientAppShell";
import { PrescriptionRow } from "@/components/Patient/PrescriptionRow";

import {
  ACTIVE_PRESCRIPTION_STATUSES,
  PAST_PRESCRIPTION_STATUSES,
  PROCESSING_REPORT_STATUSES,
  READY_REPORT_STATUSES,
  usePatientDiagnosticReports,
  usePatientPrescriptions,
} from "@/hooks/usePatientPortalData";
import { usePatientContext } from "@/hooks/usePatientUser";

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
  const { openSwitcher, canSwitch } = usePatientShell();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3.5 p-8 text-center max-w-md mx-auto">
      <span className="flex size-18 items-center justify-center rounded-[22px] bg-gray-100">
        <FileText className="size-8 text-gray-400" strokeWidth={1.6} />
      </span>
      <div>
        <h3 className="mb-1.5 text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-pretty text-sm leading-normal text-gray-600">
          {description}
        </p>
      </div>
      <div className="mt-1.5 flex w-full flex-col gap-2.5">
        <Button asChild className="min-h-11 w-full">
          <Link href="/nearby_facilities">
            {t("patient_records__book_first_appointment")}
          </Link>
        </Button>
        {(patients?.length ?? 0) > 1 && canSwitch && (
          <Button
            variant="ghost"
            className="min-h-11 w-full"
            onClick={openSwitcher}
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
    prescriptions,
    count: prescriptionCount,
    isLoading: isLoadingPrescriptions,
    ...prescriptionPages
  } = usePatientPrescriptions({
    status:
      prescriptionFilter === "active"
        ? ACTIVE_PRESCRIPTION_STATUSES
        : PAST_PRESCRIPTION_STATUSES,
    enabled: activeTab === "prescriptions",
  });
  const {
    reports,
    count: reportCount,
    isLoading: isLoadingReports,
    ...reportPages
  } = usePatientDiagnosticReports({
    status:
      reportFilter === "ready"
        ? READY_REPORT_STATUSES
        : reportFilter === "processing"
          ? PROCESSING_REPORT_STATUSES
          : [...READY_REPORT_STATUSES, ...PROCESSING_REPORT_STATUSES],
    enabled: activeTab === "reports",
  });

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
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 pt-4.5">
        {activeTab === "prescriptions" ? (
          <>
            <div className="flex gap-2">
              <FilterChip
                active={prescriptionFilter === "active"}
                onClick={() => setPrescriptionFilter("active")}
              >
                {t("active")}
                {prescriptionFilter === "active" && ` · ${prescriptionCount}`}
              </FilterChip>
              <FilterChip
                active={prescriptionFilter === "past"}
                onClick={() => setPrescriptionFilter("past")}
              >
                {t("past")}
                {prescriptionFilter === "past" && ` · ${prescriptionCount}`}
              </FilterChip>
            </div>

            {isLoadingPrescriptions ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : prescriptions.length ? (
              <>
                {prescriptionFilter === "past" && (
                  <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-gray-500">
                    {t("patient_records__earlier")}
                  </span>
                )}
                {prescriptions.map((prescription) => (
                  <PrescriptionRow
                    key={prescription.id}
                    prescription={prescription}
                  />
                ))}
                <InfiniteScrollSentinel {...prescriptionPages} />
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
                {t("all")}
                {reportFilter === "all" && ` · ${reportCount}`}
              </FilterChip>
              <FilterChip
                active={reportFilter === "ready"}
                onClick={() => setReportFilter("ready")}
              >
                {t("patient_records__ready")}
                {reportFilter === "ready" && ` · ${reportCount}`}
              </FilterChip>
              <FilterChip
                active={reportFilter === "processing"}
                onClick={() => setReportFilter("processing")}
              >
                {t("patient_records__processing")}
                {reportFilter === "processing" && ` · ${reportCount}`}
              </FilterChip>
            </div>

            {isLoadingReports ? (
              <Skeleton className="h-20 w-full rounded-2xl" />
            ) : reports.length ? (
              <>
                {reports.map((report) => (
                  <DiagnosticReportRow key={report.id} report={report} />
                ))}
                <InfiniteScrollSentinel {...reportPages} />
              </>
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
