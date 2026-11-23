import { z } from "zod";

import {
  paginationSearch,
  searchDate,
  searchEnum,
  searchString,
} from "@/lib/router/search/fields";
import { Priority, Status } from "@/types/emr/serviceRequest/serviceRequest";

/** The healthcare services of a facility (`FacilityServices`). */
export const facilityServicesSearch = z.object({
  ...paginationSearch,
  search: searchString(),
});

/** The service requests of a location (`ServiceRequestList`). */
export const serviceRequestListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
  status: searchEnum(Status),
  priority: searchEnum(Priority),
  patient: searchString(),
  patient_name: searchString(),
  /** One of `careConfig.encounterClasses`. */
  encounter_class: searchString(),
  /** Comma-separated tag ids. */
  tags: searchString(),
  tags_behavior: searchString(),
  /** An activity definition slug. */
  activity_definition: searchString(),
  created_date_after: searchDate(),
  created_date_before: searchDate(),
});

/** The bed availability dashboard of a facility. */
export const bedAvailabilitySearch = z.object({
  search: searchString(),
  /** A ward (location) id. */
  ward: searchString(),
  status: searchEnum(["available", "occupied", "reserved"]),
  /** The time of the last refresh. A new value refetches the beds. */
  refresh: searchString(),
});
