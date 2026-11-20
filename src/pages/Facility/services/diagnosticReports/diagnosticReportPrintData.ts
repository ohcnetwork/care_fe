import { format } from "date-fns";
import type { TFunction } from "i18next";

import {
  type PrintDetailRow,
  type PrintPatientHeader,
  buildPatientHeader,
} from "@/print/patientDetails";
import {
  type Condition,
  ConditionOperation,
} from "@/types/base/condition/condition";
import type {
  Interpretation,
  QualifiedRange,
} from "@/types/base/qualifiedRange/qualifiedRange";
import type { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import {
  type ObservationRead,
  type ObservationReferenceRange,
  ObservationStatus,
} from "@/types/emr/observation/observation";
import type { PatientRead } from "@/types/emr/patient/patient";
import { formatName, formatPatientAge } from "@/Utils/utils";

export interface DiagnosticReportPrintContent {
  heading: string;
  patient: PrintPatientHeader;
  patient_label: string;
  patient_rows: PrintDetailRow[];
  reports: {
    title: string;
    rows: PrintDetailRow[];
    results: {
      header: string[];
      rows: {
        /** A component is shown indented under its observation. */
        component: boolean;
        /** Test, result, reference range and, if any, interpretation. */
        cells: string[];
        /** Bold result and interpretation. */
        highlight: boolean;
      }[];
    } | null;
    note: { label: string; text: string } | null;
    conclusion: { label: string; text: string } | null;
    /** Paths of the attachment page images, one page each. */
    attachments: string[];
  }[];
  footer: { left: string; right: string };
}

const rangeLines = (ranges: ObservationReferenceRange[] | undefined) =>
  (ranges ?? [])
    .map((range) => {
      let text = "";
      if (range.min != null && range.max != null) {
        text = `${range.min} - ${range.max}`;
      } else if (range.min != null) {
        text = `> ${range.min}`;
      } else if (range.max != null) {
        text = `< ${range.max}`;
      }
      const label = range.interpretation?.display;
      return label || text ? `${label ? `${label}: ` : ""}${text}` : "";
    })
    .filter(Boolean)
    .join("\n");

/** Like `ConditionOperationSummary` in short form. Tag conditions need tag lookups and are left out. */
function conditionText(condition: Condition, t: TFunction) {
  if (condition.operation === ConditionOperation.equality) {
    const value =
      typeof condition.value === "object" && "value" in condition.value
        ? condition.value.value
        : condition.value;
    let display = String(value);
    if (condition.metric === "patient_gender") {
      display = t(`GENDER__${value}`);
    } else if (condition.metric === "encounter_class") {
      display = t(`encounter_class__${value}`);
    }
    const valueType =
      typeof condition.value === "object" && "value_type" in condition.value
        ? condition.value.value_type
        : "";
    return `${display} ${valueType}`.trim();
  }
  if (condition.operation === ConditionOperation.in_range) {
    const valueType =
      "value_type" in condition.value ? condition.value.value_type : "";
    return `${condition.value.min} to ${condition.value.max} ${valueType}`.trim();
  }
  return "";
}

function qualifiedRangeLines(
  qualifiedRanges: QualifiedRange[] | undefined,
  t: TFunction,
) {
  if (!qualifiedRanges?.length) return "-";
  return qualifiedRanges
    .map((qualified) => {
      const conditions = (qualified.conditions ?? [])
        .map((condition) => conditionText(condition, t))
        .filter(Boolean)
        .join(" | ");
      const ranges = (qualified.ranges ?? [])
        .map((range) => {
          let text = "";
          if (range.min != null && range.max != null) {
            text = `${range.min} - ${range.max}`;
          } else if (range.min != null) {
            text = `> ${range.min}`;
          } else if (range.max != null) {
            text = `< ${range.max}`;
          }
          const label = range.interpretation?.display;
          return label || text ? `${label ? `${label}: ` : ""}${text}` : "";
        })
        .filter(Boolean);
      return [conditions, ...ranges].filter(Boolean).join("\n");
    })
    .join("\n");
}

const interpretationText = (interpretation: Interpretation | undefined) =>
  interpretation ? interpretation.code?.display || interpretation.display : "";

const valueText = (value: {
  value?: unknown;
  unit?: { code?: string; display?: string };
}) =>
  [value.value, value.unit?.code || value.unit?.display]
    .filter((part) => part != null && part !== "")
    .join(" ");

function buildResults(observations: ObservationRead[], t: TFunction) {
  const shown = observations.filter(
    (observation) => observation.status !== ObservationStatus.ENTERED_IN_ERROR,
  );
  if (!shown.length) return null;

  const showInterpretation = shown.some(
    (observation) =>
      observation.interpretation?.display ||
      observation.component?.some(
        (component) => component.interpretation?.display,
      ),
  );
  const cells = (row: string[]) => (showInterpretation ? row : row.slice(0, 3));

  const rows: NonNullable<
    DiagnosticReportPrintContent["reports"][number]["results"]
  >["rows"] = [];
  for (const observation of shown) {
    const hasComponents = !!observation.component?.length;
    const definition = observation.observation_definition;
    rows.push({
      component: false,
      highlight: observation.interpretation?.highlight ?? false,
      cells: cells([
        definition?.title || definition?.code?.display || t("observation"),
        hasComponents ? "" : valueText(observation.value),
        hasComponents
          ? ""
          : observation.reference_range?.length
            ? rangeLines(observation.reference_range)
            : definition
              ? qualifiedRangeLines(definition.qualified_ranges, t)
              : "",
        hasComponents ? "" : interpretationText(observation.interpretation),
      ]),
    });
    for (const component of observation.component ?? []) {
      const qualified = definition?.component?.find(
        (c) => c.code?.code === component.code?.code,
      )?.qualified_ranges;
      rows.push({
        component: true,
        highlight: component.interpretation?.highlight ?? false,
        cells: cells([
          component.code?.display ?? "",
          valueText(component.value),
          component.reference_range?.length
            ? rangeLines(component.reference_range)
            : qualifiedRangeLines(qualified, t),
          interpretationText(component.interpretation),
        ]),
      });
    }
  }

  return {
    header: cells([
      t("test"),
      t("result"),
      t("reference_range"),
      t("interpretation"),
    ]),
    rows,
  };
}

export function buildDiagnosticReportPrintContent({
  diagnosticReports,
  attachmentPaths,
  printedBy,
  t,
}: {
  diagnosticReports: DiagnosticReportRead[];
  attachmentPaths: Record<string, string[]>;
  printedBy: string;
  t: TFunction;
}): DiagnosticReportPrintContent {
  const first = diagnosticReports[0];
  const patient = first.encounter.patient as PatientRead;
  const patientHeader = buildPatientHeader(patient);

  return {
    heading:
      first.service_request?.title || t("diagnostic_report", { count: 1 }),
    patient: patientHeader,
    patient_label: t("patient"),
    patient_rows: [
      { label: t("patient"), value: patient.name },
      ...patientHeader.identifiers.map(({ label, value }) => ({
        label,
        value,
      })),
      {
        label: `${t("age")} / ${t("sex")}`,
        value: `${formatPatientAge(patient, true)} / ${t(`GENDER__${patient.gender}`)}`,
      },
    ],
    reports: diagnosticReports.map((report) => ({
      title: report.code?.display ?? report.service_request?.title ?? "",
      rows: [
        { label: t("category"), value: report.category?.display || "-" },
        {
          label: t("report_date"),
          value: report.created_date
            ? format(report.created_date, "dd-MM-yyyy")
            : null,
        },
        { label: t("requested_by"), value: formatName(report.requester) },
        ...(report.encounter?.current_location
          ? [
              {
                label: t("location"),
                value: report.encounter.current_location.name,
              },
            ]
          : []),
      ],
      results: report.observations
        ? buildResults(report.observations, t)
        : null,
      note: report.note ? { label: t("notes"), text: report.note } : null,
      conclusion: report.conclusion
        ? { label: t("conclusion"), text: report.conclusion }
        : null,
      attachments: attachmentPaths[report.id] ?? [],
    })),
    footer: {
      left: `${t("printed_by")} ${printedBy}`,
      right: `${t("generated_on")} ${format(new Date(), "PPP 'at' p")}`,
    },
  };
}
