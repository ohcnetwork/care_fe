import { Code } from "@/types/base/code/code";
import { UserReadMinimal } from "@/types/user/user";

import { Question } from "./question";

export type SubjectType =
  "patient" | "encounter" | "location" | "device" | "facility";

export type QuestionStatus = "active" | "retired" | "draft";

export type QuestionnaireAuthContext =
  "instance" | "facility" | "facility_organization" | "user";

/**
 * Where a v2 questionnaire page is mounted. Passed by the router; pages and
 * components never read route params directly so the same components can be
 * mounted at any auth context.
 */
export interface QuestionnaireScope {
  authContext: QuestionnaireAuthContext;
  facilityId?: string;
  facilityOrganizationId?: string;
  /** e.g. `/facility/{id}/settings/questionnaires` or `/admin/questionnaires` */
  basePath: string;
}

/**
 * Patient questionnaires are instance-only (backend
 * QuestionnaireCreateSpec.validate_keys rejects them elsewhere).
 */
export const SUBJECT_TYPES_FOR_CONTEXT: Record<
  QuestionnaireAuthContext,
  SubjectType[]
> = {
  instance: ["patient", "encounter", "location", "device", "facility"],
  facility: ["encounter", "location", "device", "facility"],
  facility_organization: ["encounter", "location", "device", "facility"],
  user: ["encounter", "location", "device", "facility"],
};

export interface QuestionnaireBase {
  slug: string;
  version?: string;
  code?: Code;
  questions: Question[];
  title: string;
  description?: string;
  status: QuestionStatus;
  subject_type: SubjectType;
}

export interface QuestionnaireRead extends QuestionnaireBase {
  id: string;
  /** Not yet returned by QuestionnaireReadSpec — optional, forward-compat. */
  auth_context?: QuestionnaireAuthContext;
  internal_revision?: number;
  created_by?: UserReadMinimal;
  updated_by?: UserReadMinimal;
  modified_date?: string;
}

export interface QuestionnaireCreate extends QuestionnaireBase {
  organizations: string[];
}

/** v2 create body — auth-context aware (ENG-737 QuestionnaireCreateSpec). */
export interface QuestionnaireCreateV2 extends QuestionnaireBase {
  auth_context: QuestionnaireAuthContext;
  facility?: string;
  facility_organization?: string;
}

export type QuestionnaireUpdate = QuestionnaireBase;

export interface QuestionnaireSetOrganizations {
  organizations: string[];
}

export interface QuestionnaireSetFacilityOrganizations {
  facility_organizations: string[];
}

export const QUESTIONNAIRE_STATUS_COLORS = {
  active: "primary",
  draft: "yellow",
  retired: "destructive",
} as const;
