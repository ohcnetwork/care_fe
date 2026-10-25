import { Code } from "@/types/base/code/code";
import { UserReadMinimal } from "@/types/user/user";

import { QuestionnaireAction } from "./actions";
import { Question } from "./question";

/** Runtime source of truth for `SubjectType` — option lists and zod enums
 *  derive from this array so a new subject type cannot silently miss them. */
export const SUBJECT_TYPES = [
  "patient",
  "encounter",
  "location",
  "device",
  "facility",
] as const;

export type SubjectType = (typeof SUBJECT_TYPES)[number];

/** Runtime source of truth for `QuestionStatus` — status option lists, zod
 *  enums and the list page's tabs all derive from this array. */
export const QUESTIONNAIRE_STATUSES = ["active", "draft", "retired"] as const;

export type QuestionStatus = (typeof QUESTIONNAIRE_STATUSES)[number];

export type QuestionnaireAuthContext =
  "instance" | "facility" | "facility_organization" | "user";

/**
 * Where a v2 questionnaire page is mounted. Passed by the router; pages and
 * components never read route params directly so the same components can be
 * mounted at any auth context.
 *
 * Discriminated on `authContext` so a mount cannot omit the id its context
 * requires (`facility`/`user` need `facilityId`, `facility_organization`
 * needs `facilityOrganizationId`). Every key stays declared on every member,
 * so consumers can still read `scope.facilityId` without narrowing first.
 */
export type QuestionnaireScope = {
  /** e.g. `/facility/{id}/settings/questionnaires` or `/admin/questionnaires` */
  basePath: string;
} & (
  | {
      authContext: "instance";
      facilityId?: undefined;
      facilityOrganizationId?: undefined;
    }
  | {
      authContext: "facility";
      facilityId: string;
      facilityOrganizationId?: undefined;
    }
  | {
      authContext: "facility_organization";
      facilityId?: undefined;
      facilityOrganizationId: string;
    }
  | {
      authContext: "user";
      facilityId: string;
      facilityOrganizationId?: undefined;
    }
);

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

/**
 * Maps a scope to the create-body fields that encode the backend's
 * QuestionnaireCreateSpec.validate_keys scoping rules (`facility` only for
 * facility/user contexts, `facility_organization` only for that context).
 * Shared by the create page and the clone dialog so the two surfaces cannot
 * drift when the backend rules change.
 */
export function scopeCreateFields(
  scope: QuestionnaireScope,
): Pick<
  QuestionnaireCreateV2,
  "auth_context" | "facility" | "facility_organization"
> {
  return {
    auth_context: scope.authContext,
    facility:
      scope.authContext === "facility" || scope.authContext === "user"
        ? scope.facilityId
        : undefined,
    facility_organization:
      scope.authContext === "facility_organization"
        ? scope.facilityOrganizationId
        : undefined,
  };
}

export interface QuestionnaireBase {
  slug: string;
  version?: string;
  code?: Code;
  questions: Question[];
  title: string;
  description?: string;
  status: QuestionStatus;
  subject_type: SubjectType;
  /** Submit-time automations (see `./actions`). Omitted on the wire by
   *  questionnaires that never had any. */
  actions?: QuestionnaireAction[];
}

export interface QuestionnaireRead extends Omit<QuestionnaireBase, "version"> {
  /** The read endpoint can return a bare number (seen with fixture data such
   *  as `0.1`); the update schema requires a string, so writers must coerce
   *  via `String()` before echoing it back (see `buildUpdateBody`). */
  version?: string | number;
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

/** v2 create body — auth-context aware. */
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

/** The effective revision number: the backend omits `internal_revision` for
 *  never-revised questionnaires, which display (and sort) as revision 1. */
export const revisionOf = (
  questionnaire: Pick<QuestionnaireRead, "internal_revision">,
): number => questionnaire.internal_revision ?? 1;

/** Renders a revision number as `v{n}` with the shared `?? 1` fallback, so
 *  every displayed version badge agrees with `revisionOf`-based sorting. */
export function formatRevision(revision?: number): string {
  return `v${revision ?? 1}`;
}
