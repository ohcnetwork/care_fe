import { Code } from "@/types/base/code/code";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import { Status as ServiceRequestStatus } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenStatus } from "@/types/emr/specimen/specimen";

import { DiagnosticReportFormProps } from "./diagnosticReportFormTypes";

export function reportCodeKey(code: Code) {
  return JSON.stringify([code.system, code.code]);
}

export function getDiagnosticReportCreationState({
  activityDefinition,
  specimens,
  diagnosticReports,
  serviceRequestStatus,
}: Pick<
  DiagnosticReportFormProps,
  | "activityDefinition"
  | "specimens"
  | "diagnosticReports"
  | "serviceRequestStatus"
>) {
  const hasCollectedSpecimens = (
    activityDefinition?.specimen_requirements ?? []
  ).every((requirement) =>
    specimens.some(
      (specimen) =>
        specimen.specimen_definition?.id === requirement.id &&
        specimen.status === SpecimenStatus.available,
    ),
  );

  const isMultipleDiagnosticReport =
    !!activityDefinition?.diagnostic_report_codes &&
    activityDefinition.diagnostic_report_codes.length > 0;

  // Report codes already used by existing diagnostic reports
  const usedReportCodes = new Set(
    diagnosticReports
      .map((report) => report.code && reportCodeKey(report.code))
      .filter((code): code is string => !!code),
  );

  // Report codes still available to create a new diagnostic report for
  const availableReportCodes =
    activityDefinition?.diagnostic_report_codes?.filter(
      (code) => !usedReportCodes.has(reportCodeKey(code)),
    ) ?? [];

  const activeDiagnosticReports = diagnosticReports.filter(
    (report) => report.status !== DiagnosticReportStatus.final,
  );

  // Show the "create report" form only when appropriate for the SR type:
  // - Single-report SR: show only when no report exists yet.
  // - Multi-report SR: show when codes remain AND no report is currently in progress.
  // Never show once the service request is completed.
  const showCreateReportForm =
    serviceRequestStatus !== ServiceRequestStatus.completed &&
    (isMultipleDiagnosticReport
      ? availableReportCodes.length > 0 && activeDiagnosticReports.length === 0
      : diagnosticReports.length === 0);

  return {
    hasCollectedSpecimens,
    isMultipleDiagnosticReport,
    availableReportCodes,
    activeDiagnosticReports,
    showCreateReportForm,
  };
}
