import { useQuery } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import Loading from "@/components/Common/Loading";
import { DiagnosticReportPrintPreview } from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPrintPreview";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
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

  if (isLoadingReport) {
    return <Loading />;
  }

  if (!fullReport) {
    return <span>{t("diagnostic_report_not_found")}</span>;
  }

  return (
    <DiagnosticReportPrintPreview
      diagnosticReports={[fullReport]}
      isLoading={isLoadingReport}
    />
  );
}
