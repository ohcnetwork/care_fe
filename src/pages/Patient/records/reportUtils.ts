import { Activity, FileText, type LucideIcon, SquarePlus } from "lucide-react";

import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import {
  ObservationRead,
  ObservationReferenceRange,
} from "@/types/emr/observation/observation";

type Translate = (key: string) => string;

/** Interpretation labels that mean "nothing to worry about". */
const NORMAL_INTERPRETATION = /^norm/i;

/**
 * `reference_range` bounds come back as strings from the API even though the
 * shared type declares numbers, so coerce defensively.
 */
const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Best available human label for a report, falling back down the code chain. */
export function reportTitle(
  report: DiagnosticReportRead,
  t: Translate,
): string {
  return (
    report.code?.display ||
    report.service_request?.title ||
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

/**
 * `reference_range` is a set of labelled bands spanning the whole scale — Low,
 * Normal, High — not a list of acceptable ranges. Find the band the result
 * actually falls into.
 */
function matchingBand(
  observation: ObservationRead,
): ObservationReferenceRange | undefined {
  const value = toNumber(observation.value?.value);
  if (value === undefined) {
    return undefined;
  }

  return (observation.reference_range ?? []).find((range) => {
    const min = toNumber(range.min);
    const max = toNumber(range.max);
    return (
      (min === undefined || value >= min) && (max === undefined || value <= max)
    );
  });
}

/**
 * A result is flagged when the lab's interpretation — either stated on the
 * observation or implied by the band the value lands in — is not "normal".
 */
export function isObservationFlagged(observation: ObservationRead): boolean {
  if (observation.interpretation?.highlight) {
    return true;
  }

  const interpretation =
    observation.interpretation?.display ??
    matchingBand(observation)?.interpretation?.display;

  return !!interpretation && !NORMAL_INTERPRETATION.test(interpretation);
}

export function reportFlagSummary(report: DiagnosticReportRead): number {
  return (report.observations ?? []).filter(isObservationFlagged).length;
}

/**
 * The reference shown to the patient is the *normal* band — quoting the Low
 * band ("< 70") next to a high result would read as though it were the target.
 */
export function referenceRangeLabel(
  observation: ObservationRead,
): string | undefined {
  const ranges = observation.reference_range ?? [];
  if (!ranges.length) {
    return undefined;
  }

  const normal =
    ranges.find(
      (range) =>
        range.interpretation?.display &&
        NORMAL_INTERPRETATION.test(range.interpretation.display),
    ) ?? (ranges.length === 1 ? ranges[0] : undefined);

  if (!normal) {
    return undefined;
  }

  const min = toNumber(normal.min);
  const max = toNumber(normal.max);
  const unit = observation.value?.unit?.display;
  const suffix = unit ? ` ${unit}` : "";

  if (min !== undefined && max !== undefined) {
    return `${min} - ${max}${suffix}`;
  }
  if (max !== undefined) {
    return `< ${max}${suffix}`;
  }
  if (min !== undefined) {
    return `> ${min}${suffix}`;
  }
  return undefined;
}

/** The lab's own wording for the result, e.g. `High`. */
export function observationInterpretation(
  observation: ObservationRead,
): string | undefined {
  return (
    observation.interpretation?.display ??
    matchingBand(observation)?.interpretation?.display
  );
}

export function observationValueLabel(observation: ObservationRead): string {
  const value = observation.value?.value ?? observation.value?.coding?.display;
  return value ? String(value) : "-";
}
