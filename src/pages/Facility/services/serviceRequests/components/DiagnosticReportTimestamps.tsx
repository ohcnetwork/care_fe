import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";

interface DiagnosticReportTimestampsProps {
  report: Pick<DiagnosticReportRead, "created_date" | "modified_date">;
}

export function DiagnosticReportTimestamps({
  report,
}: DiagnosticReportTimestampsProps) {
  const { t } = useTranslation();
  const createdAt = format(report.created_date, "MMM d, yyyy, h:mm a");
  const updatedAt = format(report.modified_date, "MMM d, yyyy, h:mm a");

  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-normal text-gray-500">
      <span>
        {t("created")}: <time dateTime={report.created_date}>{createdAt}</time>
      </span>
      {updatedAt !== createdAt && (
        <span>
          {t("last_updated")}:{" "}
          <time dateTime={report.modified_date}>{updatedAt}</time>
        </span>
      )}
    </span>
  );
}
