import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";

interface DiagnosticReportTimestampsProps {
  report: Pick<DiagnosticReportRead, "created_date" | "modified_date">;
  compact?: boolean;
}

export function DiagnosticReportTimestamps({
  report,
  compact = false,
}: DiagnosticReportTimestampsProps) {
  const { t } = useTranslation();
  const createdAt = format(report.created_date, "MMM d, yyyy, h:mm a");
  const updatedAt = format(report.modified_date, "MMM d, yyyy, h:mm a");
  const hasUpdate =
    new Date(report.modified_date).getTime() !==
    new Date(report.created_date).getTime();

  if (compact) {
    return (
      <span className="text-xs font-normal text-gray-500">
        {t(hasUpdate ? "updated" : "created")}:{" "}
        <time dateTime={hasUpdate ? report.modified_date : report.created_date}>
          {hasUpdate ? updatedAt : createdAt}
        </time>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-normal text-gray-500">
      <span>
        {t("created")}: <time dateTime={report.created_date}>{createdAt}</time>
      </span>
      {hasUpdate && (
        <span>
          {t("last_updated")}:{" "}
          <time dateTime={report.modified_date}>{updatedAt}</time>
        </span>
      )}
    </span>
  );
}
