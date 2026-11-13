import { cn } from "@/lib/utils";
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
import { getDiagnosticReportCreationState } from "./diagnosticReportCreation";

export const SERVICE_REQUEST_REPORT_SECTION_IDS = {
  results: "service-request-section-results",
  review: "service-request-section-review",
} as const;

// Mobile only: the section picked in the tab switcher
export const SECTION_HIGHLIGHT_CLASS =
  "rounded-lg max-sm:ring-2 max-sm:ring-primary-700 max-sm:ring-offset-2 max-sm:ring-offset-gray-50";

interface ServiceRequestReportWorkflowProps {
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
  diagnosticReports: DiagnosticReportRead[];
  pendingReports: number;
  activeSectionId: string | null;
  facilityId: string;
  serviceRequestId: string;
  disableEdit: boolean;
}

export function ServiceRequestReportWorkflow({
  request,
  activityDefinition,
  diagnosticReports,
  pendingReports,
  activeSectionId,
  facilityId,
  serviceRequestId,
  disableEdit,
}: ServiceRequestReportWorkflowProps) {
  const { t } = useTranslation();
  const [expandedReport, setExpandedReport] =
    useState<SavedReportSignal | null>(null);
  const observationRequirements =
    activityDefinition.observation_result_requirements ?? [];
  const { showResultsSection } = getDiagnosticReportCreationState({
    activityDefinition,
    specimens: request.specimens || [],
    diagnosticReports,
    serviceRequestStatus: request.status,
  });
  return (
    <>
      {showResultsSection && (
        <div
          id={SERVICE_REQUEST_REPORT_SECTION_IDS.results}
          className={cn(
            "scroll-mt-20 space-y-3 transition-shadow duration-500",
            activeSectionId === SERVICE_REQUEST_REPORT_SECTION_IDS.results &&
              SECTION_HIGHLIGHT_CLASS,
          )}
        >
          {pendingReports > 0 && (
            <h5 className="text-gray-950 font-semibold">
              {t("test_result_entries")}
            </h5>
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
        <div
          id={SERVICE_REQUEST_REPORT_SECTION_IDS.review}
          className={cn(
            "scroll-mt-20 transition-shadow duration-500",
            activeSectionId === SERVICE_REQUEST_REPORT_SECTION_IDS.review &&
              SECTION_HIGHLIGHT_CLASS,
          )}
        >
          <DiagnosticReportReview
            facilityId={facilityId}
            patientId={request.encounter.patient.id}
            diagnosticReports={diagnosticReports}
            observationDefinitions={observationRequirements}
            serviceRequestId={serviceRequestId}
            disableEdit={disableEdit}
            expandedReport={expandedReport}
          />
        </div>
      )}
    </>
  );
}
