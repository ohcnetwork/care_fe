import { AllergyIntolerance } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { Diagnosis } from "@/types/emr/diagnosis/diagnosis";
import { DiagnosticReportBase } from "@/types/emr/diagnosticReport/diagnosticReport";
import { ImmunizationRead } from "@/types/emr/immunization/immunization";
import { ObservationRead } from "@/types/emr/observation/observation";
import { BaseServiceRequestSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenBase } from "@/types/emr/specimen/specimen";
import { FileRead } from "@/types/files/file";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import { Appointment } from "@/types/scheduling/schedule";

import { ReferralRead } from "./referral";

export const REFERRAL_RESOURCE_TYPES = [
  "diagnostic_report",
  "observation",
  "condition",
  "allergy_intolerance",
  "service_request",
  "specimen",
  "questionnaire_response",
  "file_upload",
  "immunization",
  "appointment",
  "referral",
] as const;
export type ReferralResourceType = (typeof REFERRAL_RESOURCE_TYPES)[number];

// The initial attachment picker is intentionally narrower than the backend
// resource model. Keep the full union for existing records and native workflows.
export const REFERRAL_ATTACHABLE_RESOURCE_TYPES = [
  "condition",
  "questionnaire_response",
  "diagnostic_report",
  "file_upload",
  "specimen",
  "referral",
] as const satisfies readonly ReferralResourceType[];

export const REFERRAL_RESOURCE_CATEGORIES = [
  "source",
  "response",
  "metadata",
] as const;
export type ReferralResourceCategory =
  (typeof REFERRAL_RESOURCE_CATEGORIES)[number];

export interface ReferralResourceCreate {
  resource_type: ReferralResourceType;
  resource_id: string;
  attachment_type: ReferralResourceCategory;
  metadata?: { facility_id?: string; facility_name?: string };
}

export interface ReferralResource extends ReferralResourceCreate {
  id: string;
  referral: string;
  created_date: string;
  modified_date: string;
}

// Resolve deliberately returns minimum read specs; do not assume direct-read
// relationships (or permission to fetch them) from this delegated response.
interface ReferralResourceMap {
  diagnostic_report: DiagnosticReportBase;
  observation: ObservationRead;
  condition: Diagnosis;
  allergy_intolerance: AllergyIntolerance;
  service_request: BaseServiceRequestSpec;
  specimen: SpecimenBase;
  questionnaire_response: QuestionnaireResponse;
  file_upload: FileRead;
  immunization: ImmunizationRead;
  appointment: Pick<
    Appointment,
    "id" | "token_slot" | "booked_on" | "status" | "note"
  >;
  referral: ReferralRead;
}

export type ResolvedReferralResource = {
  [K in ReferralResourceType]: {
    resource_type: K;
    resource: ReferralResourceMap[K];
  };
}[ReferralResourceType];
