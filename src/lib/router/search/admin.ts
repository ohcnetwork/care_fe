import { z } from "zod";

import {
  paginationSearch,
  searchEnum,
  searchString,
} from "@/lib/router/search/fields";
import {
  TagCategory,
  TagResource,
  TagStatus,
} from "@/types/emr/tagConfig/tagConfig";
import { PatientIdentifierConfigStatus } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import {
  QUESTIONNAIRE_STATUSES,
  SUBJECT_TYPES,
} from "@/types/questionnaire/questionnaire";
import { ValueSetStatus } from "@/types/valueSet/valueSet";

/**
 * Pages of the admin area. Some of them also render in the facility
 * settings (questionnaires, value sets, tag configs, immunization policies
 * and patient identifier configs); both routes use the same schema.
 */

/** The questionnaire list. */
export const questionnaireListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
  status: searchEnum(QUESTIONNAIRE_STATUSES),
  subject_type: searchEnum(SUBJECT_TYPES),
});

/** The questionnaire page. */
export const questionnaireShowSearch = z.object({
  /**
   * The open tab. The revision page links back with `versions`, so the page
   * opens on the versions tab.
   */
  tab: searchEnum(["questions", "versions"]),
});

/** The questionnaire studio. Set by the questionnaire page's links. */
export const questionnaireStudioSearch = z.object({
  mode: searchEnum(["edit", "preview"]),
  /** `1` opens the import questions dialog. */
  import: searchString(),
  /** The id of the question to open. */
  question: searchString(),
});

/** The value set list. */
export const valueSetListSearch = z.object({
  ...paginationSearch,
  name: searchString(),
  status: searchEnum(ValueSetStatus),
  /** The catalogue of the facility settings list. */
  source: searchEnum(["facility", "instance"]),
});

/** The create and edit value set pages (`ValueSetEditor`). */
export const valueSetEditorSearch = z.object({
  /**
   * The id of the value set that a new facility value set customizes. Set by
   * the Customize action of the value set list.
   */
  parent: searchString(),
});

/** The permissions page: the roles and their permissions. */
export const permissionListSearch = z.object({
  ...paginationSearch,
  name: searchString(),
});

/** The role list. */
export const roleListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
});

/** The tag config list. */
export const tagConfigListSearch = z.object({
  ...paginationSearch,
  display: searchString(),
  status: searchEnum(TagStatus),
  category: searchEnum(TagCategory),
  resource: searchEnum(TagResource),
});

/** The action configuration list. */
export const actionConfigurationListSearch = z.object({
  ...paginationSearch,
});

/** The child organizations of a government organization. */
export const adminOrganizationListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
});

/** The apps page. */
export const plugConfigListSearch = z.object({
  tab: searchEnum(["installed", "available"]),
});

/** The app config page. */
export const plugConfigEditSearch = z.object({
  /** The app store id of the app. Set by the links of the apps page. */
  appId: searchString(),
});

/** The immunization policy list. */
export const immunizationPolicyListSearch = z.object({
  ...paginationSearch,
  name: searchString(),
});

/** The patient identifier config list. */
export const patientIdentifierConfigListSearch = z.object({
  ...paginationSearch,
  display: searchString(),
  status: searchEnum(PatientIdentifierConfigStatus),
});
