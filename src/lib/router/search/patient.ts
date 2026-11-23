import { z } from "zod";

import {
  paginationSearch,
  searchAppPath,
  searchBoolean,
  searchEnum,
  searchPositiveInt,
  searchString,
} from "@/lib/router/search/fields";

/** The patient search page (`PatientIndex`). */
export const patientSearchPageSearch = z.object({
  phone_number: searchString(),
});

/** The patient home page: the patient that the search page verified. */
export const patientHomePageSearch = z.object({
  phone_number: searchString(),
  year_of_birth: searchString(),
  /** The first characters of the patient id. */
  partial_id: searchString(),
  flow: searchEnum(["queue", "dispense"]),
  /** The action that opens when the page loads. */
  action: searchEnum(["schedule", "create_encounter"]),
  /** Set by the patient search page: its identifier config and value. */
  config: searchString(),
  value: searchString(),
  /** Set by the registration form with `flow`. */
  createEncounter: searchString(),
  /**
   * Set by the registration form. The book appointment sheet opens when it
   * is `true`.
   */
  open_schedule: searchString(),
  /** Set by the queue pages and the token form: the token of the patient. */
  queue_id: searchString(),
  token_id: searchString(),
});

/** The patient registration form: a new patient, or a patient to update. */
export const patientRegistrationSearch = z.object({
  /** The phone number that the new patient form starts with. */
  phone_number: searchString(),
  /** The flow that the home page continues after registration. */
  flow: searchEnum(["queue", "dispense"]),
});

/**
 * The patient page. Its tabs (encounters, files, accounts, referrals...)
 * share the query string and parse their own schemas. The route lists the
 * keys that all tabs read the same way.
 */
export const patientShowSearch = z.object({
  ...paginationSearch,
  /** The referral whose appointments the appointments tab shows. */
  referralId: searchString(),
});

/** The encounters tab of a patient. */
export const patientEncounterListSearch = z.object({
  page: searchPositiveInt(),
});

/**
 * The files tab of a patient or an encounter: `FilesTab` and its files and
 * reports sub tabs.
 */
export const fileListSearch = z.object({
  ...paginationSearch,
  /** The sub tab: `all`, `reports` or the name of a plugin tab. */
  file: searchString(),
  name: searchString(),
  /**
   * Text, not a boolean: the files and reports lists send it to the API as
   * is. No code reads `include_archived` or sends it to the API.
   */
  is_archived: searchEnum(["true", "false"]),
  /** Set with `is_archived` by the filter of the reports sub tab. */
  include_archived: searchBoolean(),
});

/** The clinical history page of a patient. */
export const clinicalHistoryPageSearch = z.object({
  /** The page that opened the history. The close button goes back to it. */
  sourceUrl: searchAppPath(),
});
