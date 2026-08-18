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

export const MultipleDiagnosticReportsPrint = ({
  serviceRequestId,
  patientId,
}: {
  serviceRequestId: string;
  patientId: string;
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["diagnosticReports", patientId, serviceRequestId],
    queryFn: query(diagnosticReportApi.listDiagnosticReports, {
      pathParams: { patient_external_id: patientId },
      queryParams: {
        service_request: serviceRequestId,
        status: DiagnosticReportStatus.final,
      },
    }),
  });

  const diagnosticReportResults = data?.results;

  const { diagnosticReports, isLoading: isLoadingReports } = useQueries({
    queries:
      diagnosticReportResults?.map((report) => ({
        queryKey: ["diagnosticReport", report.id, patientId],
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
      isLoading: results.some((r) => r.isLoading),
    }),
  });

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

  if (isLoading || isLoadingReports) {
    return <Loading />;
  }

  return (
    <DiagnosticReportPrintPreview
      diagnosticReports={diagnosticReports}
      allFiles={allFiles}
      isLoading={isLoadingFiles}
    />
  );
};
