import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { Markdown } from "@/components/ui/markdown";

import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { formatName } from "@/Utils/utils";

interface DiagnosticReportMetadataProps {
  report: DiagnosticReportRead;
}

export function DiagnosticReportMetadata({
  report,
}: DiagnosticReportMetadataProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      {report.code?.display && (
        <div>
          <div className="text-gray-500">{t("report")}</div>
          <div className="font-medium">
            <span>{report.code.display}</span>
          </div>
        </div>
      )}
      {report.service_request?.code?.display && (
        <div>
          <div className="text-gray-500">{t("procedure")}</div>
          <div className="font-medium">
            {report.service_request.code.display}
            {report.service_request.code.code && (
              <span className="text-xs text-gray-500 ml-2">
                ({report.service_request.code.code})
              </span>
            )}
          </div>
        </div>
      )}
      <div>
        <div className="text-gray-500">{t("category")}</div>
        <div className="font-medium">{report.category?.display || "-"}</div>
      </div>
      <div>
        <div className="text-gray-500">{t("report_date")}</div>
        <div className="font-medium">
          {format(new Date(report.created_date), "dd-MM-yyyy HH:mm")}
        </div>
      </div>
      <div>
        <div className="text-gray-500">{t("requested_by")}</div>
        <div className="font-medium">{formatName(report.requester)}</div>
      </div>
      <div>
        <div className="text-gray-500">{t("filed_by")}</div>
        <div className="font-medium">{formatName(report.created_by)}</div>
      </div>
      {report.note && (
        <div className="col-span-full">
          <div className="text-gray-500">{t("notes")}</div>
          <div className="font-medium whitespace-pre-wrap">{report.note}</div>
        </div>
      )}
      {report.conclusion && (
        <div className="col-span-full min-w-0">
          <div className="text-gray-500">{t("conclusion")}</div>
          <Markdown
            richText
            content={report.conclusion}
            className="prose-sm wrap-anywhere [&>:first-child]:mt-0 [&>:last-child]:mb-0"
          />
        </div>
      )}
    </div>
  );
}
