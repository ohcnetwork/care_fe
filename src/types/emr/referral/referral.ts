import { Code } from "@/types/base/code/code";
import { CareTeamMember, CareTeamResponse } from "@/types/careTeam/careTeam";
import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import { UserReadMinimal } from "@/types/user/user";
import type { ReferralResourceCreate } from "./referralResource";

export const REFERRAL_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];
export const REFERRAL_DIRECTIONS = ["all", "incoming", "outgoing"] as const;
export type ReferralDirection = (typeof REFERRAL_DIRECTIONS)[number];
export type ReferralDestinationType =
  "facility" | "internal_organization" | "external_organization";
export type ReferralEntityType = ReferralDestinationType | "external";
export type ReferralType = "consultation" | "lab";
export type ReferralAvailabilityStatus = "draft" | "active" | "inactive";
export type ReferralQuestionnaireType = "request" | "response";

export interface ReferralQuestionnaireMapping {
  questionnaire: string;
  questionnaire_type: ReferralQuestionnaireType;
}

export interface ReferralDestinationOption {
  id: string;
  name: string;
}

export interface ReferralAvailabilityRead {
  id: string;
  name: string;
  description: string;
  status: ReferralAvailabilityStatus;
  is_public: boolean;
  referral_type: ReferralType;
  entity_type: ReferralEntityType;
  facility: string | null;
  internal_organization: string | null;
  external_organization: string | null;
  external_entity: Record<string, unknown>;
  destination: ReferralEndpoint;
  care_team: CareTeamResponse[];
  created_date: string;
  modified_date: string;
  created_by: UserReadMinimal | null;
  updated_by: UserReadMinimal | null;
}

export interface ReferralAvailabilityRetrieve extends ReferralAvailabilityRead {
  questionnaires: {
    id: string;
    slug: string;
    title: string;
    status: string;
    questionnaire_type: ReferralQuestionnaireType;
  }[];
}

export interface ReferralAvailabilityCreate {
  name: string;
  description: string;
  status: ReferralAvailabilityStatus;
  is_public: boolean;
  referral_type: ReferralType;
  entity_type: ReferralDestinationType;
  facility?: string | null;
  internal_organization?: string | null;
  external_organization?: string | null;
  care_team: CareTeamMember[];
  questionnaires: ReferralQuestionnaireMapping[];
}

export type ReferralAvailabilityUpdate = Partial<
  Pick<
    ReferralAvailabilityCreate,
    | "name"
    | "description"
    | "status"
    | "is_public"
    | "care_team"
    | "questionnaires"
  >
>;

export interface ReferralQuestionnaire extends QuestionnaireRead {
  questionnaire_type: ReferralQuestionnaireType;
}

export interface ReferralQuestionnaireResult {
  question_id: string;
  values: { value?: string | null; unit?: Code | null; coding?: Code | null }[];
  note?: string | null;
  taken_at?: string | null;
  body_site?: Code | null;
  method?: Code | null;
  sub_results?: ReferralQuestionnaireResult[][];
}

export interface ReferralQuestionnaireSubmission {
  results: ReferralQuestionnaireResult[];
}

export interface ReferralQuestionnaireResponse {
  id: string;
  questionnaire: string;
  status: "completed" | "entered_in_error";
  questionnaire_type: ReferralQuestionnaireType;
  questionnaire_response: ReferralQuestionnaireSubmission & {
    cleaned_response?: Record<string, unknown>;
  };
  questionnaire_revision: number;
  questionnaire_snapshot: QuestionnaireRead;
  created_date: string;
  modified_date: string;
  created_by: UserReadMinimal | null;
  updated_by: UserReadMinimal | null;
}

export interface ReferralEndpoint {
  facility: { id: string; name: string } | null;
  departments: { id: string; name: string }[];
  organization: { id: string; name: string } | null;
  external_name: string | null;
}

export interface ReferralRead {
  id: string;
  title: string;
  note: string;
  availability: string;
  availability_name: string;
  source: ReferralEndpoint | null;
  destination: ReferralEndpoint;
  patient: string;
  patient_name: string;
  status: ReferralStatus;
  assignees: CareTeamResponse[];
  created_date: string;
  modified_date: string;
}

export interface ReferralRetrieve extends ReferralRead {
  permissions: string[];
  encounter: string | null;
  thread: string | null;
  thread_title: string | null;
  questionnaire_responses: ReferralQuestionnaireResponse[];
  created_by: UserReadMinimal | null;
  updated_by: UserReadMinimal | null;
}

export interface ReferralUpdate {
  title?: string;
  note?: string;
  status?: ReferralStatus;
  assignees?: CareTeamMember[];
}

export interface ReferralResponseCreate {
  questionnaire: string;
  questionnaire_response: ReferralQuestionnaireSubmission;
}

export interface ReferralCreate {
  availability: string;
  patient: string;
  encounter?: string;
  title: string;
  note: string;
  questionnaire: string;
  questionnaire_response: ReferralQuestionnaireSubmission;
  resources?: ReferralResourceCreate[];
}
