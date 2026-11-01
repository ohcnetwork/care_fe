import Loading from "@/components/Common/Loading";
import { DiagnosticReportPrintPreview } from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPrintPreview";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import fileApi from "@/types/files/fileApi";
import query from "@/Utils/request/query";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export const MultipleDiagnosticReportsPrint = ({
  serviceRequestId,
  patientId,
}: {
  serviceRequestId: string;
  patientId: string;
}) => {
  const { t } = useTranslation();
  const { data, isFetching, isError } = useQuery({
    queryKey: ["diagnosticReports", patientId, serviceRequestId, "print"],
    queryFn: query.paginated(diagnosticReportApi.listDiagnosticReports, {
      pathParams: { patient_external_id: patientId },
      queryParams: {
        service_request: serviceRequestId,
        status: DiagnosticReportStatus.final,
      },
    }),
  });

  // The backend may ignore the service_request filter; verify ownership before printing.
  const diagnosticReportResults = data?.results.filter(
    (report) =>
      report.service_request?.id === serviceRequestId &&
      report.status === DiagnosticReportStatus.final,
  );

  const { diagnosticReports, isLoadingReports, isReportsError } = useQueries({
    queries:
      diagnosticReportResults?.map((report) => ({
        queryKey: ["diagnosticReport", report.id],
        queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
          pathParams: {
            patient_external_id: patientId,
            external_id: report.id,
          },
        }),
      })) ?? [],
    combine: (results) => ({
      diagnosticReports: results
        .map((r) => r.data)
        .filter((data): data is DiagnosticReportRead => !!data),
      isLoadingReports: results.some((r) => r.isFetching),
      isReportsError: results.some((r) => r.isError),
    }),
  });

  const { allFiles, isLoadingFiles, isFilesError } = useQueries({
    queries: diagnosticReports.map((report) => ({
      queryKey: ["files", "diagnostic_report", report.id, "print"],
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
      isLoadingFiles: results.some((result) => result.isFetching),
      isFilesError: results.some((result) => result.isError),
    }),
  });

  if (isFetching || isLoadingReports) {
    return <Loading />;
  }

  if (isError || isReportsError || isFilesError) {
    return <div role="alert">{t("diagnostic_report_print_load_error")}</div>;
  }

  if (!diagnosticReports.length) {
    return <div>{t("no_diagnostic_reports_found")}</div>;
  }

  return (
    <DiagnosticReportPrintPreview
      diagnosticReports={diagnosticReports}
      allFiles={allFiles}
      isLoading={isLoadingFiles}
    />
  );
};
