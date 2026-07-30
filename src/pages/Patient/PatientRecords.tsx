import dayjs from "dayjs";
import { Activity, ChevronRight, Clock, FileText } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import {
  PatientAppShell,
  PatientHeaderTabs,
} from "@/components/Patient/PatientAppShell";

import {
  usePatientDiagnosticReports,
  usePatientPrescriptions,
} from "@/hooks/usePatientPortalData";

import { formatName } from "@/Utils/utils";
import { PRESCRIPTION_STATUS_STYLES } from "@/types/emr/prescription/prescription";

import { reportFlagSummary, reportTitle } from "./records/reportUtils";

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
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-4 text-xs font-semibold transition-colors",
        active
          ? "bg-gray-900 text-white"
          : "border border-gray-200 bg-white text-gray-900 hover:border-gray-300",
      )}
    >
      {children}
    </button>
  );
}

export default function PatientRecords() {
  const { t } = useTranslation();
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
      <div className="flex min-w-0 flex-col gap-3.5 p-4">
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
              shownPrescriptions.map((prescription) => (
                <Link
                  key={prescription.id}
                  href={`/patient/records/prescriptions/${prescription.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 hover:border-gray-300"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-bold text-gray-900">
                        {formatName(prescription.prescribed_by)}
                      </span>
                      <span className="truncate text-xs text-gray-600">
                        {dayjs(prescription.created_date).format("DD MMM YYYY")}
                        {prescription.encounter?.facility?.name &&
                          ` · ${prescription.encounter.facility.name}`}
                      </span>
                    </div>
                    <Badge
                      variant={PRESCRIPTION_STATUS_STYLES[prescription.status]}
                    >
                      {t(prescription.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                    <span className="truncate text-xs text-gray-600">
                      {prescription.name || t("prescription")}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700">
                      {t("view")}
                      <ChevronRight className="size-3.5" strokeWidth={2.2} />
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                icon={<FileText className="size-6 text-primary-700" />}
                title={t("no_medications_found")}
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
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      {isReady ? (
                        <Activity
                          className="size-5 text-gray-900"
                          strokeWidth={1.8}
                        />
                      ) : (
                        <Clock
                          className="size-5 text-gray-400"
                          strokeWidth={1.9}
                        />
                      )}
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
                    {!isReady ? (
                      <Badge variant="blue">
                        {t("patient_records__processing")}
                      </Badge>
                    ) : flags > 0 ? (
                      <Badge variant="yellow">
                        {t("patient_records__flagged_count", { count: flags })}
                      </Badge>
                    ) : (
                      <Badge variant="green">{t("normal")}</Badge>
                    )}
                  </Link>
                );
              })
            ) : (
              <EmptyState
                icon={<Activity className="size-6 text-primary-700" />}
                title={t("patient_records__no_reports")}
                description={t("patient_records__no_reports_description")}
              />
            )}
          </>
        )}
      </div>
    </PatientAppShell>
  );
}
