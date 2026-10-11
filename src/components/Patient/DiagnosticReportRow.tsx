import dayjs from "dayjs";
import { ChevronRight, Clock } from "lucide-react";
import { Link } from "raviger";
import { createElement } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { PatientBadge } from "@/components/Patient/PatientBadge";

import { READY_REPORT_STATUSES } from "@/hooks/usePatientPortalData";
import {
  reportFlagSummary,
  reportIcon,
  reportTitle,
} from "@/pages/Patient/records/reportUtils";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";

/**
 * One diagnostic report in a list — shared by the records hub and the home
 * preview so the same record does not describe itself two different ways.
 */
export function DiagnosticReportRow({
  report,
  className,
}: {
  report: DiagnosticReportRead;
  className?: string;
}) {
  const { t } = useTranslation();
  const isReady = READY_REPORT_STATUSES.includes(report.status);
  const flags = reportFlagSummary(report);

  const content = (
    <>
      <span
        className={cn(
          "flex size-10.5 shrink-0 items-center justify-center rounded-xl",
          isReady ? "bg-gray-100" : "bg-white",
        )}
      >
        {/* createElement, not JSX: reportIcon() picks between icons at runtime */}
        {createElement(isReady ? reportIcon(report) : Clock, {
          className: cn("size-5", isReady ? "text-gray-900" : "text-gray-400"),
          strokeWidth: isReady ? 1.8 : 1.9,
        })}
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
        ) : (
          flags > 0 && (
            <PatientBadge tone="warning">
              {t("patient_records__flagged_count", { count: flags })}
            </PatientBadge>
          )
        )}
        {isReady && (
          <ChevronRight className="size-4 text-gray-600" strokeWidth={2.1} />
        )}
      </div>
    </>
  );

  const rowClassName = cn(
    "flex items-center gap-3 rounded-2xl border bg-white p-4",
    !isReady && "border-dashed border-gray-300 bg-gray-50",
    isReady && "hover:border-gray-300",
    isReady && (flags > 0 ? "border-warning-200" : "border-gray-200"),
    className,
  );

  if (!isReady) {
    return <div className={rowClassName}>{content}</div>;
  }

  return (
    <Link
      href={`/patient/records/reports/${report.id}`}
      className={rowClassName}
    >
      {content}
    </Link>
  );
}
