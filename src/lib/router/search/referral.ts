import { z } from "zod";

import {
  searchAppPath,
  searchBoolean,
  searchEnum,
  searchPositiveInt,
  searchString,
} from "@/lib/router/search/fields";
import { REFERRAL_STATUSES } from "@/types/emr/referral/referral";

/**
 * The referral list: `ReferralList`, on the referrals pages of a facility
 * and an organization, and in the referrals tabs of a patient and an
 * encounter. Its keys start with `referral`, so they do not clash with the
 * keys of the page around it.
 */
export const referralListSearch = z.object({
  referralStatus: searchEnum(REFERRAL_STATUSES),
  referralAssignedToMe: searchBoolean(),
  /** The department (facility organization) whose referrals are listed. */
  referralDepartment: searchString(),
  /** `facility` lists the facility's referrals, not the department's. */
  referralDestination: searchEnum(["department", "facility"]),
  referralPage: searchPositiveInt(),
  /**
   * The list that `referralPage` belongs to: `<entity type>:<id>`,
   * `encounter:<id>` or `patient:<id>`.
   */
  referralScope: searchString(),
});

/**
 * The referral context that the referral pages put in the links they open
 * (`referralNavigation.ts`, `useReferralResourceLink`): the referral pages,
 * and the appointment, booking and encounter pages that a referral opens.
 */
export const referralContextSearch = z.object({
  /** The page that opened the referral. The referral page links back to it. */
  sourceUrl: searchAppPath(),
  /** The referral that an appointment or encounter page works on. */
  referralId: searchString(),
  /** The `sourceUrl` of the referral, kept for the way back to it. */
  referralSourceUrl: searchAppPath(),
  /** The receiving visit. An empty value stays, so the page can reject it. */
  referralAppointmentId: searchString(),
  referralEncounterId: searchString(),
  referralFacilityId: searchString(),
});
