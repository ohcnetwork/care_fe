import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

/**
 * Backend E2E fixture questionnaires seeded by
 * `care/fixtures/scripts/questionnaire_e2e_fixtures.py`.
 *
 * Every field here matches the running backend fixture data. `label` is the
 * question's `text`, which `questionBlock` matches exactly against the
 * rendered `<label>`, so backend-side fixture rewording should be reflected in
 * this one file.
 *
 * Fixture facts this helper depends on:
 * - `linkId` is `"q-structured"` for every fixture below.
 * - `label` is `"<Type> section"` (e.g. `"Time of Death section"`).
 * - `subjectType` is `"encounter"` for every fixture, including
 *   `time_of_death`.
 * - No patient-subject structured fixture currently exists; the
 *   patient-subject questionnaire fixture `e2e-subject-patient` only contains
 *   plain questions.
 */
export interface StructuredFixture {
  slug: string;
  /** The question's `text` — the exact string `questionBlock` matches. */
  label: string;
  linkId: string;
  required: boolean;
  subjectType: "patient" | "encounter";
}

/**
 * The single-question fixtures (`q-note` + one `q-structured` question) that
 * fit `StructuredFixture`'s one-type-per-fixture shape, including `unknown`,
 * the missing-plugin degradation fixture, and every `-required`/`-optional`
 * sibling that exists on the backend. `charge_item` has no `-required`
 * sibling in the fixture set, so none is added here.
 *
 * `kitchen_sink` (seven questions, five structured types) and
 * `patient_subject` (no patient-subject structured fixture exists — see
 * `patientFixtureUrl`'s doc comment) do not fit this shape; see
 * `KITCHEN_SINK_FIXTURE` below.
 */
export const STRUCTURED_FIXTURES = {
  time_of_death: {
    slug: "e2e-structured-time_of_death",
    label: "Time of Death section",
    linkId: "q-structured",
    required: false,
    subjectType: "encounter",
  },
  time_of_death_required: {
    slug: "e2e-structured-time_of_death-required",
    label: "Time of Death section",
    linkId: "q-structured",
    required: true,
    subjectType: "encounter",
  },
  appointment: {
    slug: "e2e-structured-appointment",
    label: "Appointment section",
    linkId: "q-structured",
    required: false,
    subjectType: "encounter",
  },
  appointment_required: {
    slug: "e2e-structured-appointment-required",
    label: "Appointment section",
    linkId: "q-structured",
    required: true,
    subjectType: "encounter",
  },
  /** No `-required` sibling exists in the fixture set — see this
   *  constant's own doc comment above. */
  charge_item: {
    slug: "e2e-structured-charge_item",
    label: "Charge Item section",
    linkId: "q-structured",
    required: false,
    subjectType: "encounter",
  },
  encounter: {
    slug: "e2e-structured-encounter",
    label: "Encounter section",
    linkId: "q-structured",
    required: false,
    subjectType: "encounter",
  },
  encounter_required: {
    slug: "e2e-structured-encounter-required",
    label: "Encounter section",
    linkId: "q-structured",
    required: true,
    subjectType: "encounter",
  },
  files: {
    slug: "e2e-structured-files",
    label: "Files section",
    linkId: "q-structured",
    required: false,
    subjectType: "encounter",
  },
  files_required: {
    slug: "e2e-structured-files-required",
    label: "Files section",
    linkId: "q-structured",
    required: true,
    subjectType: "encounter",
  },
  /** `structured_type: "x_e2e.missing"` — no plugin registers it, so the
   *  slot renders the "requires a plugin that isn't enabled" degradation
   *  notice on every mount. `required: true` (verified) — the negative
   *  case this fixture exists for is rendering, not submission, but the
   *  flag is recorded accurately regardless. Note the INVERTED naming vs.
   *  every other type here: the base slug is the REQUIRED one; the
   *  optional variant is the one carrying the `-optional` suffix — that is
   *  how the backend fixture script actually named these two, not a typo. */
  unknown: {
    slug: "e2e-structured-unknown",
    label: "Missing Plugin Section",
    linkId: "q-structured",
    required: true,
    subjectType: "encounter",
  },
  unknown_optional: {
    slug: "e2e-structured-unknown-optional",
    label: "Missing Plugin Section",
    linkId: "q-structured",
    required: false,
    subjectType: "encounter",
  },
} as const satisfies Record<string, StructuredFixture>;

export type StructuredFixtureKey = keyof typeof STRUCTURED_FIXTURES;

/** Encounter-subject fill URL for a resolved fixture questionnaire id. */
export function structuredFixtureUrl(questionnaireId: string): string {
  return `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
}
