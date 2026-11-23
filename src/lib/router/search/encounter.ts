import { z } from "zod";

import {
  paginationSearch,
  searchEnum,
  searchString,
} from "@/lib/router/search/fields";
import { ENCOUNTER_CLASS } from "@/types/emr/encounter/encounter";
import { Priority, Status } from "@/types/emr/serviceRequest/serviceRequest";
import { WORKSPACE_STATUSES } from "@/types/workspace/workspace";

/** The encounter list of the encounters overview (`EncounterList`). */
export const encounterListSearch = z.object({
  ...paginationSearch,
  name: searchString(),
  external_identifier: searchString(),
  /** Comma-separated `EncounterStatus` values, or `live` or `ended`. */
  status: searchString(),
  /** A lowercase `ENCOUNTER_PRIORITY` value. */
  priority: searchString(),
  /** Filters the All list; class-specific lists take the class from the route. */
  encounter_class: searchEnum(ENCOUNTER_CLASS),
  encounter_id: searchString(),
  patient_filter: searchString(),
  patient_name: searchString(),
  /** A `yyyy-MM-dd` date, or a date and time with its offset. */
  created_date_after: searchString(),
  created_date_before: searchString(),
  /** A facility organization id. */
  organization: searchString(),
  /** A username. */
  care_team_user: searchString(),
  /** Comma-separated tag ids. */
  tags: searchString(),
  tags_behavior: searchString(),
});

/**
 * The encounter page. Its tabs (files, consents, service requests,
 * diagnostic reports, plots, responses, referrals...) share the query
 * string and parse their own schemas. The route lists the keys that all
 * tabs read the same way.
 */
export const encounterShowSearch = z.object({
  ...paginationSearch,
  /** The encounter that the page shows, when not the encounter of the URL. */
  selectedEncounter: searchString(),
});

/** The consents tab of an encounter. */
export const consentListSearch = z.object({
  ...paginationSearch,
});

/** The service requests tab of an encounter. */
export const encounterServiceRequestListSearch = z.object({
  ...paginationSearch,
  status: searchEnum(Status),
  priority: searchEnum(Priority),
  search: searchString(),
});

/** The diagnostic reports tab, of an encounter or in the patient history. */
export const diagnosticReportListSearch = z.object({
  reportId: searchString(),
  /** The title of a service request; the list shows its reports. */
  activityDefinition: searchString(),
});

/** The plots tab of an encounter. */
export const plotsSearch = z.object({
  /** The id of a plot in the plots config. */
  plot: searchString(),
});

/** The responses tab, of an encounter or in the patient history. */
export const responseListSearch = z.object({
  questionnaireSlug: searchString(),
  questionnaireTitle: searchString(),
  responseId: searchString(),
  /** The id of an author role. */
  role: searchString(),
});

/** The encounter workspaces list, of the instance or of a facility. */
export const workspaceListSearch = z.object({
  ...paginationSearch,
  name: searchString(),
  status: searchEnum(WORKSPACE_STATUSES),
});
