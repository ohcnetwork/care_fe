import { z } from "zod";

import {
  paginationSearch,
  searchInt,
  searchString,
} from "@/lib/router/search/fields";

/** The public facility list: `FacilitiesPage`. */
export const facilitiesPageSearch = z.object({
  ...paginationSearch,
  name: searchString(),
  /** The id of a `FACILITY_TYPES` entry. */
  facility_type: searchInt(),
  /** The government organization that the facilities belong to. */
  organization: searchString(),
});

/** The public page of a facility: `FacilityDetailsPage`. */
export const facilityDetailsPageSearch = z.object({
  ...paginationSearch,
});

/** The users of a facility: `FacilityUsers`. */
export const facilityUserListSearch = z.object({
  ...paginationSearch,
  username: searchString(),
});

/** The departments tab of a user: `UserDepartmentsTab`. */
export const userDepartmentListSearch = z.object({
  ...paginationSearch,
});
