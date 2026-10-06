import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DiagnosticReportForm,
  type SavedReportSignal,
} from "./DiagnosticReportForm";
import { DiagnosticReportReview } from "./DiagnosticReportReview";

interface ServiceRequestReportWorkflowProps {
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
  diagnosticReports: DiagnosticReportRead[];
  pendingReports: number;
  facilityId: string;
  serviceRequestId: string;
  disableEdit: boolean;
}

export function ServiceRequestReportWorkflow({
  request,
  activityDefinition,
  diagnosticReports,
  pendingReports,
  facilityId,
  serviceRequestId,
  disableEdit,
}: ServiceRequestReportWorkflowProps) {
  const { t } = useTranslation();
  const [expandedReport, setExpandedReport] =
    useState<SavedReportSignal | null>(null);
  const observationRequirements =
    activityDefinition.observation_result_requirements ?? [];
  const canHaveDiagnosticReports =
    diagnosticReports.length > 0 ||
    observationRequirements.length > 0 ||
    (activityDefinition.diagnostic_report_codes?.length ?? 0) > 0;
  return (
    <>
      {canHaveDiagnosticReports && (
        <div className="space-y-3">
          {(observationRequirements.length > 0 || pendingReports > 0) && (
            <h2 className="text-xl font-semibold">{t("test_results")}</h2>
          )}

          <DiagnosticReportForm
            patientId={request.encounter.patient.id}
            facilityId={facilityId}
            serviceRequestId={serviceRequestId}
            observationDefinitions={observationRequirements}
            diagnosticReports={diagnosticReports}
            activityDefinition={activityDefinition}
            specimens={request.specimens || []}
            disableEdit={disableEdit}
            serviceRequestStatus={request.status}
            onReportSaved={setExpandedReport}
          />
        </div>
      )}
      {diagnosticReports.length > 0 && (
        <DiagnosticReportReview
          facilityId={facilityId}
          patientId={request.encounter.patient.id}
          diagnosticReports={diagnosticReports}
          observationDefinitions={observationRequirements}
          serviceRequestId={serviceRequestId}
          disableEdit={disableEdit}
          expandedReport={expandedReport}
        />
      )}
    </>
  );
}
