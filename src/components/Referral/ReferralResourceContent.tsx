import { TriangleAlert } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/Utils/utils";
import { DiagnosisCard } from "@/components/Patient/diagnosis/DiagnosisTable";
import { Badge } from "@/components/ui/badge";
import { DiagnosticReportSummary } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportSummary";
import { SpecimenDetails } from "@/pages/Facility/services/serviceRequests/components/SpecimenDetails";
import { Code } from "@/types/base/code/code";
import { ResolvedReferralResource } from "@/types/emr/referral/referralResource";
import { QuestionnaireResponse } from "@/types/questionnaire/form";

import { QuestionnaireResponseContent } from "@/components/Facility/ConsultationDetails/QuestionnaireResponseContent";
import { ReferralStatusBadge } from "./ReferralStatusBadge";

const displayCode = (code?: Code | null) => code?.display || code?.code || "";

// The surrounding CareUI record group owns the surface and spacing. Keep the
// encounter renderer's clinical content without nesting another card in it.
const embeddedCard =
  "rounded-none border-0 bg-transparent p-0 shadow-none [&>[data-slot=card-header]]:p-0 [&>[data-slot=card-header]]:pb-4 [&>[data-slot=card-content]]:p-0";

export function referralResourceTitle(data: ResolvedReferralResource): string {
  switch (data.resource_type) {
    case "diagnostic_report":
      return (
        displayCode(data.resource.code) || displayCode(data.resource.category)
      );
    case "observation":
      return (
        displayCode(data.resource.main_code) ||
        data.resource.alternate_coding?.text ||
        ""
      );
    case "condition":
    case "allergy_intolerance":
    case "immunization":
      return displayCode(data.resource.code);
    case "service_request":
    case "referral":
      return data.resource.title;
    case "specimen":
      return (
        displayCode(data.resource.specimen_type) ||
        data.resource.accession_identifier
      );
    case "questionnaire_response":
      return data.resource.questionnaire?.title || "";
    case "file_upload":
      return data.resource.name;
    case "appointment":
      return (
        data.resource.token_slot.availability.schedule.name ||
        data.resource.token_slot.availability.name
      );
  }
}

function hasStructuredAnswers(responses: QuestionnaireResponse[]): boolean {
  return responses.some(
    (answer) =>
      (answer.values ?? []).some(
        (value) =>
          value.value != null &&
          typeof value.value === "object" &&
          !(value.value instanceof Date),
      ) || (answer.sub_results ?? []).some(hasStructuredAnswers),
  );
}

export function ReferralResourceContent({
  data,
}: {
  data: ResolvedReferralResource;
}) {
  const { t } = useTranslation();
  const rows: [string, ReactNode, boolean][] = [];
  const add = (key: string, value: ReactNode) => {
    if (value !== undefined && value !== null && value !== "")
      rows.push([t(key), value, ["note", "patient_instruction"].includes(key)]);
  };
  const status = (value?: string | null) =>
    value ? t(value, { defaultValue: value.replaceAll("_", " ") }) : "";
  const date = (value?: string | null) => (value ? formatDateTime(value) : "");
  let extra: ReactNode;
  switch (data.resource_type) {
    case "file_upload":
      return null;
    case "questionnaire_response": {
      const response = data.resource;
      add("status", status(response.status));
      extra = (
        <div className="space-y-4">
          {(hasStructuredAnswers(response.responses) ||
            Object.keys(response.structured_responses ?? {}).length > 0) && (
            <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
              {t("referral_structured_response_notice")}
            </p>
          )}
          <QuestionnaireResponseContent
            formResponse={response}
            variant="inline"
          />
        </div>
      );
      break;
    }
    case "appointment": {
      const booking = data.resource;
      add("status", status(booking.status));
      add(
        "referral_appointment_start",
        date(booking.token_slot.start_datetime),
      );
      add("referral_appointment_end", date(booking.token_slot.end_datetime));
      add("note", booking.note);
      break;
    }
    case "referral": {
      add("status", <ReferralStatusBadge status={data.resource.status} />);
      add("referral_destination", data.resource.availability_name);
      add("created_date", date(data.resource.created_date));
      add("modified_date", date(data.resource.modified_date));
      add("note", data.resource.note);
      break;
    }
    case "diagnostic_report": {
      return (
        <DiagnosticReportSummary
          report={data.resource}
          className={embeddedCard}
        />
      );
    }
    case "condition": {
      return (
        <DiagnosisCard
          diagnosis={data.resource}
          compact
          alwaysShowDetails
          className={embeddedCard}
        />
      );
    }
    case "allergy_intolerance": {
      const record = data.resource;
      add("clinical_status", status(record.clinical_status));
      add("verification_status", status(record.verification_status));
      add("criticality", status(record.criticality));
      add("category", status(record.category));
      add("note", record.note);
      break;
    }
    case "immunization": {
      const record = data.resource;
      add("status", status(record.status));
      add("date", date(record.occurrence));
      add("body_site", displayCode(record.site));
      add("route", displayCode(record.route));
      add("note", record.note);
      break;
    }
    case "service_request": {
      const record = data.resource;
      add("status", status(record.status));
      add("priority", status(record.priority));
      add("intent", status(record.intent));
      add("body_site", displayCode(record.body_site));
      add("patient_instruction", record.patient_instruction);
      add("note", record.note);
      break;
    }
    case "specimen": {
      return (
        <SpecimenDetails specimen={data.resource} className={embeddedCard} />
      );
    }
    case "observation": {
      const record = data.resource;
      const value = (answer: typeof record.value) =>
        [
          answer.coding ? displayCode(answer.coding) : answer.value,
          displayCode(answer.unit),
        ]
          .filter((value) => value != null && value !== "")
          .join(" ");
      add("status", status(record.status));
      add("date", date(record.effective_datetime));
      add("value", value(record.value));
      add("body_site", displayCode(record.body_site));
      add("method", displayCode(record.method));
      add("note", record.note);
      extra = record.component?.length ? (
        <dl className="grid gap-3">
          {record.component.map((component, index) => (
            <div key={index}>
              <dt className="text-sm text-muted-foreground">
                {displayCode(component.code) ||
                  t("referral_observation_component")}
              </dt>
              <dd className="text-sm">{value(component.value)}</dd>
              {component.note && (
                <dd className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {component.note}
                </dd>
              )}
            </div>
          ))}
        </dl>
      ) : null;
      break;
    }
  }
  return (
    <div className="space-y-4">
      {data.resource_type === "service_request" &&
        data.resource.do_not_perform && (
          <Badge variant="destructive" size="lg" role="alert">
            <TriangleAlert aria-hidden="true" />
            {t("do not perform")}
          </Badge>
        )}
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value, fullWidth], index) => (
          <div
            key={index}
            className={fullWidth ? "min-w-0 sm:col-span-2" : "min-w-0"}
          >
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="whitespace-pre-wrap break-words text-sm">{value}</dd>
          </div>
        ))}
      </dl>
      {extra}
    </div>
  );
}
