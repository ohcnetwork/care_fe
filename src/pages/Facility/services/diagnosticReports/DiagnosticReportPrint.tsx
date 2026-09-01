import { useQueries, useQuery } from "@tanstack/react-query";

import Loading from "@/components/Common/Loading";
import "@/lib/pdfWorker";
import { DiagnosticReportPrintPreview } from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPrintPreview";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import fileApi from "@/types/files/fileApi";
import query from "@/Utils/request/query";
import { useTranslation } from "react-i18next";

export default function DiagnosticReportPrint({
  patientId,
  diagnosticReportId,
}: {
  patientId: string;
  diagnosticReportId: string;
}) {
  const { t } = useTranslation();

  const { data: fullReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ["diagnosticReport", diagnosticReportId],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: diagnosticReportId,
      },
    }),
  });

  const diagnosticReports = fullReport ? [fullReport] : [];

  const { allFiles, isLoadingFiles } = useQueries({
    queries: diagnosticReports.map((report) => ({
      queryKey: ["files", "diagnostic_report", report.id],
      queryFn: query.paginated(fileApi.list, {
        queryParams: {
          file_type: "diagnostic_report",
          associating_id: report.id,
        },
      }),
    })),
    combine: (results) => ({
      allFiles: diagnosticReports.flatMap((report, index) =>
        (results[index]?.data?.results ?? []).map((file) => ({
          reportId: report.id,
          file,
        })),
      ),
      isLoadingFiles: results.some((result) => result.isLoading),
    }),
  });

  if (isLoadingReport) {
    return <Loading />;
  }

  if (!fullReport) {
    return <span>{t("diagnostic_report_not_found")}</span>;
  }

  return (
    <DiagnosticReportPrintPreview
      diagnosticReports={diagnosticReports}
      allFiles={allFiles}
      isLoading={isLoadingFiles}
    />
  );
}
