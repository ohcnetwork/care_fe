import { CodeConceptMinimal, Designation } from "@/types/base/code/code";
import {
  ArchiveIcon,
  FileCheckIcon,
  HelpCircle,
  NotepadTextDashedIcon,
} from "lucide-react";

export enum ValueSetStatus {
  ACTIVE = "active",
  DRAFT = "draft",
  RETIRED = "retired",
  UNKNOWN = "unknown",
}

export const VALUESET_STATUS_COLORS = {
  [ValueSetStatus.ACTIVE]: "primary",
  [ValueSetStatus.DRAFT]: "yellow",
  [ValueSetStatus.RETIRED]: "destructive",
  [ValueSetStatus.UNKNOWN]: "secondary",
} as const;

export const VALUESET_STATUS_ICONS = {
  [ValueSetStatus.ACTIVE]: FileCheckIcon,
  [ValueSetStatus.DRAFT]: NotepadTextDashedIcon,
  [ValueSetStatus.RETIRED]: ArchiveIcon,
  [ValueSetStatus.UNKNOWN]: HelpCircle,
} as const;

export interface ValueSetFilter {
  op: string;
  value: string;
  property: string;
}

export interface ValueSetConcept {
  code: string;
  display: string;
}

export interface ValueSetInclude {
  filter?: ValueSetFilter[];
  system: string;
  version: string | null;
  concept?: ValueSetConcept[];
}

interface ValueSetCompose {
  exclude: ValueSetInclude[];
  include: ValueSetInclude[];
}

export interface ValueSetBase {
  slug: string;
  name: string;
  description: string;
  compose: ValueSetCompose;
  status: ValueSetStatus;
  is_system_defined: boolean;
}

export interface ValueSetRead extends ValueSetBase {
  id: string;
  created_by: string | null;
  updated_by: string | null;
}

export type ValueSetAuthContext =
  "instance" | "facility_organization" | "facility" | "user";

export interface ValueSetCreate extends ValueSetBase {
  auth_context: ValueSetAuthContext;
  inherited: boolean;
  facility?: string;
  facility_organization?: string;
  parent?: string;
}

/**
 * Where a value-set management surface is mounted. Mirrors
 * `QuestionnaireScope`: the admin area manages instance-level sets, a
 * facility's settings manage that facility's own sets. `facilityId` is
 * declared (as `undefined`) on the instance branch so consumers can read
 * `scope.facilityId` without narrowing first.
 */
export type ValueSetScope = {
  /** e.g. `/facility/{id}/settings/valuesets` or `/admin/valuesets` */
  basePath: string;
} & (
  | { authContext: "instance"; facilityId?: undefined }
  | { authContext: "facility"; facilityId: string }
);

/** Who a value set created from `scope` belongs to. The backend only lets
 *  superusers create in the `instance` context, so a facility mount must
 *  file under its own facility or every create 403s. */
export type ValueSetCreateContext = Pick<
  ValueSetCreate,
  "auth_context" | "facility" | "facility_organization"
>;

export function scopeCreateContext(
  scope: ValueSetScope,
): ValueSetCreateContext {
  return scope.authContext === "facility"
    ? { auth_context: "facility", facility: scope.facilityId }
    : { auth_context: "instance" };
}

export const INSTANCE_VALUESET_SCOPE: ValueSetScope = {
  authContext: "instance",
  basePath: "/admin/valuesets",
};

/** The value-set scope a surface inside `facilityId` works in — or the
 *  admin (instance) scope when there is no facility, e.g. the admin
 *  questionnaire studio. Both mounts' canonical paths live here. */
export function valueSetScopeForFacility(facilityId?: string): ValueSetScope {
  return facilityId
    ? {
        authContext: "facility",
        facilityId,
        basePath: `/facility/${facilityId}/settings/valuesets`,
      }
    : INSTANCE_VALUESET_SCOPE;
}

/** Records the current user's choice of which value set resolves `slug`
 *  inside `facility` (see `get_closest_valueset` on the backend). */
export interface SetSlugPreferenceRequest {
  slug: string;
  facility: string;
}

export interface ValueSetSetFacilityOrganizations {
  facility_organizations: string[];
}

export interface ValueSetUpdate extends ValueSetBase {
  id: string;
}

export interface ExpandRequest {
  search: string;
  count: number;
}

export interface ExpandSlugRequest extends ExpandRequest {
  slug: string;
  facility?: string;
}

export interface ExpandSlugResponse {
  valueset: ValueSetRead;
  results: CodeConceptMinimal[];
}

export interface ValueSetConfig {
  slug?: string;
  external_id?: string;
}

/**
 * How a question references a chosen value set. An instance-level set is
 * referenced by slug alone, so a facility's override of that slug (an
 * `inherited` child) and the user's own preference apply when the form is
 * filled. Anything else must be pinned by id — the backend only resolves
 * slug-only references at instance level.
 */
export function valueSetBinding(
  valueset: Pick<ValueSetRead, "id" | "slug">,
  authContext: ValueSetAuthContext,
): ValueSetConfig {
  return authContext === "instance"
    ? { slug: valueset.slug }
    : { slug: valueset.slug, external_id: valueset.id };
}

export interface ValueSetCodeMetadata {
  code: string;
  display: string;
  name: string;
  system: string;
  version: string;
  inactive: boolean;
}

export interface DesignationItem {
  details: Designation;
  context: Record<string, unknown>;
}

export interface ValueSetLookupResponse {
  designations: DesignationItem[];
  metadata: ValueSetCodeMetadata;
  properties: Record<string, unknown>;
}

export interface ValueSetLookupRequest {
  system: string;
  code: string;
}

export const TERMINOLOGY_SYSTEMS = {
  LOINC: "http://loinc.org",
  SNOMED: "http://snomed.info/sct",
  UCUM: "http://unitsofmeasure.org",
} as const;

export type TerminologySystem = keyof typeof TERMINOLOGY_SYSTEMS;
