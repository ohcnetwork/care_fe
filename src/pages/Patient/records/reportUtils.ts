import { Activity, FileText, type LucideIcon, SquarePlus } from "lucide-react";

import { isObservationFlagged } from "@/Utils/observationRange";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { ObservationRead } from "@/types/emr/observation/observation";

type Translate = (key: string) => string;

/** Best available human label for a report, preferring the ordered title. */
export function reportTitle(
  report: DiagnosticReportRead,
  t: Translate,
): string {
  return (
    report.service_request?.title ||
    report.code?.display ||
    report.category?.display ||
    t("diagnostic_report")
  );
}

/**
 * Glyph for the report's icon tile. The modality is spelled differently by
 * every source in the chain, so match on a substring of whichever one answers
 * first and fall back to the neutral document.
 */
export function reportIcon(report: DiagnosticReportRead): LucideIcon {
  const modality = (
    report.service_request?.activity_definition?.classification ||
    report.service_request?.category ||
    report.category?.display ||
    ""
  ).toLowerCase();

  if (modality.includes("imaging") || modality.includes("radiolog")) {
    return SquarePlus;
  }
  if (modality.includes("lab")) {
    return Activity;
  }
  return FileText;
}

export function observationLabel(
  observation: ObservationRead,
  t: Translate,
): string {
  return (
    observation.main_code?.display ||
    observation.alternate_coding?.text ||
    t("observation")
  );
}

export function reportFlagSummary(report: DiagnosticReportRead): number {
  return (report.observations ?? []).filter(
    (observation) =>
      isObservationFlagged(observation) ||
      (observation.component ?? []).some(isObservationFlagged),
  ).length;
}
