import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import query from "@/Utils/request/query";
import { DiagnosticReportPrintPreview } from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPrintPreview";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";

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

  if (!fullReport) {
    return <div>{t("diagnostic_report_not_found")}</div>;
  }

  return (
    <DiagnosticReportPrintPreview
      diagnosticReports={[fullReport]}
      isLoading={isLoadingReport}
    />
  );
}
