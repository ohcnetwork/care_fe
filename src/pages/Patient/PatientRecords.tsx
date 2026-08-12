import dayjs from "dayjs";
import { FileText } from "lucide-react";
import { useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { InfiniteScrollSentinel } from "@/components/Common/InfiniteScrollSentinel";
import { DiagnosticReportRow } from "@/components/Patient/DiagnosticReportRow";
import {
  PatientAppShell,
  PatientHeaderTabs,
} from "@/components/Patient/PatientAppShell";
import { PrescriptionRow } from "@/components/Patient/PrescriptionRow";

import {
  PRESCRIPTION_STATUSES,
  PROCESSING_REPORT_STATUSES,
  READY_REPORT_STATUSES,
  usePatientDiagnosticReports,
  usePatientPrescriptions,
} from "@/hooks/usePatientPortalData";
import { usePatientContext } from "@/hooks/usePatientUser";

// import { dateQueryString } from "@/Utils/utils";

type RecordsTab = "prescriptions" | "reports";
type ReportFilter = "all" | "ready" | "processing";

// Records already arrive newest-first from the API, so grouping only needs to
// collapse consecutive same-day entries rather than re-sort them.
function groupByDate<T extends { created_date: string }>(items: T[]) {
  const groups: { date: string; items: T[] }[] = [];
  for (const item of items) {
    const date = dayjs(item.created_date).format("DD MMM YYYY");
    const lastGroup = groups.at(-1);
    if (lastGroup?.date === date) {
      lastGroup.items.push(item);
    } else {
      groups.push({ date, items: [item] });
    }
  }
  return groups;
}

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

export default function PatientRecords() {
  const { t } = useTranslation();
  const { selectedPatient } = usePatientContext();
  const [{ tab }, setQueryParams] = useQueryParams<{ tab?: RecordsTab }>();

  const activeTab: RecordsTab = tab === "reports" ? "reports" : "prescriptions";
  const [reportFilter, setReportFilter] = useState<ReportFilter>("all");
  // A single created_date filter, shared across both tabs since both OTP
  // endpoints accept the same created_date_after/before query params.
  // const [dateRange, setDateRange] = useState<FilterDateRange>({});
  // const createdDateAfter = dateRange.from
  //   ? dateQueryString(dateRange.from)
  //   : undefined;
  // const createdDateBefore = dateRange.to
  //   ? dateQueryString(dateRange.to)
  //   : undefined;

  const {
    prescriptions,
    isLoading: isLoadingPrescriptions,
    ...prescriptionPages
  } = usePatientPrescriptions({
    status: PRESCRIPTION_STATUSES,
    // createdDateAfter,
    // createdDateBefore,
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
    // createdDateAfter,
    // createdDateBefore,
    enabled: activeTab === "reports",
  });

  const setTab = (next: RecordsTab) =>
    setQueryParams({ tab: next }, { replace: true });

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
        {/* <RecordsDateFilter
          value={dateRange}
          onChange={setDateRange}
          className="self-start"
        /> */}
        {activeTab === "prescriptions" ? (
          <>
            {isLoadingPrescriptions ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : prescriptions.length ? (
              <>
                {groupByDate(prescriptions).map(({ date, items }) => (
                  <div key={date} className="flex flex-col gap-2.5">
                    <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-gray-500">
                      {date}
                    </span>
                    {items.map((prescription) => (
                      <PrescriptionRow
                        key={prescription.id}
                        prescription={prescription}
                      />
                    ))}
                  </div>
                ))}
                <InfiniteScrollSentinel {...prescriptionPages} />
              </>
            ) : (
              <EmptyState
                icon={
                  <FileText
                    className="size-7 text-gray-500 mx-3"
                    strokeWidth={1.6}
                  />
                }
                title={
                  firstName
                    ? t("patient_records__no_prescriptions_for_name", {
                        name: firstName,
                      })
                    : t("no_medications_found")
                }
                description={t("patient_records__no_prescriptions_description")}
                className="gap-3 rounded-2xl border-gray-300 px-5 py-7 shadow-none"
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
                {groupByDate(reports).map(({ date, items }) => (
                  <div key={date} className="flex flex-col gap-2.5">
                    <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-gray-500">
                      {date}
                    </span>
                    {items.map((report) => (
                      <DiagnosticReportRow key={report.id} report={report} />
                    ))}
                  </div>
                ))}
                <InfiniteScrollSentinel {...reportPages} />
              </>
            ) : (
              <EmptyState
                className="gap-3 rounded-2xl border-gray-300 px-5 py-7 shadow-none"
                icon={
                  <FileText
                    className="size-7 text-gray-500 mx-3"
                    strokeWidth={1.6}
                  />
                }
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
