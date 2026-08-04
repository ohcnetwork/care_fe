import { DiagnosticReportPrintPreview } from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPrintPreview";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import query from "@/Utils/request/query";
import { useQueries, useQuery } from "@tanstack/react-query";

export const MultipleDiagnosticReportsPrint = ({
  serviceRequestId,
  patientId,
  facilityId,
}: {
  serviceRequestId: string;
  patientId: string;
  facilityId: string;
}) => {
  const { data } = useQuery({
    queryKey: ["diagnosticReports", patientId, serviceRequestId],
    queryFn: query(diagnosticReportApi.listDiagnosticReports, {
      pathParams: { patient_external_id: patientId },
      queryParams: {
        service_request: serviceRequestId,
      },
    }),
  });

  const diagnosticReportResults = data?.results;

  const { allDiagnosticReports, isLoading: isLoadingReports } = useQueries({
    queries:
      diagnosticReportResults?.map((report) => ({
        queryKey: ["diagnosticReport", report.id, patientId, facilityId],
        queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
          pathParams: {
            patient_external_id: patientId,
            external_id: report.id,
          },
          queryParams: { facility: facilityId },
        }),
      })) ?? [],
    combine: (results) => ({
      allDiagnosticReports: results
        .map((r) => r.data)
        .filter((data): data is DiagnosticReportRead => !!data),
      isLoading: results.some((r) => r.isLoading || r.isFetching),
    }),
  });

  const diagnosticReports = allDiagnosticReports.filter(
    (report) => report.status === DiagnosticReportStatus.final,
  );

  return (
    <DiagnosticReportPrintPreview
      diagnosticReports={diagnosticReports}
      isLoading={isLoadingReports}
    />
  );
};
