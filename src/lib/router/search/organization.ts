import { z } from "zod";

import {
  paginationSearch,
  searchEnum,
  searchString,
} from "@/lib/router/search/fields";

/** The sub-organizations of an organization: `OrganizationView`. */
export const organizationViewSearch = z.object({
  ...paginationSearch,
  name: searchString(),
});

/**
 * The users and service accounts of an organization: `OrganizationUsers`,
 * also on the landing page of a responsibility.
 */
export const organizationUserListSearch = z.object({
  ...paginationSearch,
  /** A username search. */
  name: searchString(),
  phone_number: searchString(),
  /** The open sheet: add a user, or link a user. */
  sheet: searchEnum(["add", "link"]),
  /** The user that the link sheet selects, after the add sheet creates it. */
  username: searchString(),
});

/** The patients of an organization: `OrganizationPatients`. */
export const organizationPatientListSearch = z.object({
  ...paginationSearch,
  name: searchString(),
  phone_number: searchString(),
});

/** The facilities of an organization: `OrganizationFacilities`. */
export const organizationFacilityListSearch = z.object({
  ...paginationSearch,
  name: searchString(),
});
