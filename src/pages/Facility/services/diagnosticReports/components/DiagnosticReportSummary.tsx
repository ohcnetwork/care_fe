import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportBase,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import { UserReadMinimal } from "@/types/user/user";
import { formatName } from "@/Utils/utils";

interface DiagnosticReportSummaryProps {
  report: DiagnosticReportBase;
  title?: string;
  createdDate?: string;
  requester?: UserReadMinimal | null;
  className?: string;
}

/** Report metadata only; results and files require their own authorized data. */
export function DiagnosticReportSummary({
  report,
  title,
  createdDate,
  requester,
  className,
}: DiagnosticReportSummaryProps) {
  const { t } = useTranslation();
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle className="break-words">
          {report.code ? (
            <div className="flex flex-col gap-1">
              {report.code.display || report.code.code}
              <span className="text-xs font-normal text-gray-500 break-all">
                {report.code.system} <br />
                {report.code.code}
              </span>
            </div>
          ) : (
            title || t("diagnostic_report", { count: 1 })
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-sm font-medium text-gray-500">
              {t("category")}
            </dt>
            <dd className="break-words">
              {report.category?.display || report.category?.code || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t("status")}</dt>
            <dd>
              <Badge variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}>
                {t(report.status)}
              </Badge>
            </dd>
          </div>
          {createdDate && (
            <div>
              <dt className="text-sm font-medium text-gray-500">
                {t("report_date")}
              </dt>
              <dd>{format(new Date(createdDate), "dd-MM-yyyy")}</dd>
            </div>
          )}
          {requester && (
            <div className="min-w-0">
              <dt className="text-sm font-medium text-gray-500">
                {t("requested_by")}
              </dt>
              <dd className="break-words">{formatName(requester)}</dd>
            </div>
          )}
          {report.note && (
            <div className="col-span-full min-w-0">
              <dt className="text-sm font-medium text-gray-500">
                {t("notes")}
              </dt>
              <dd className="whitespace-pre-wrap break-words">{report.note}</dd>
            </div>
          )}
          {report.conclusion && (
            <div className="col-span-full min-w-0">
              <dt className="text-sm font-medium text-gray-500">
                {t("conclusion")}
              </dt>
              <dd className="whitespace-pre-wrap break-words">
                {report.conclusion}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
