import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

/**
 * One backend E2E fixture questionnaire, as
 * `care/fixtures/scripts/questionnaire_e2e_fixtures.py` seeds it
 * (`bodhi/ENG-737-test-fixtures`, commits `20941c5a3`/`eb9623e08`).
 *
 * EVERY field here was read off a running backend (Task 1 Step 3 — direct
 * `psql` against the local Playwright DB, port 5433, db `care`), not
 * inferred from the frontend or copied from the task brief's draft: `label`
 * in particular is the question's `text`, which `questionBlock`
 * (`tests/helper/questionnaireV2.ts:181`) matches EXACTLY via an xpath
 * `normalize-space(.)=` comparison against the rendered `<label>`, so a
 * fixture reworded backend-side breaks every locator until this file is
 * updated. That is deliberate — one file to fix, not fifteen specs.
 *
 * DIVERGENCE FROM THE TASK BRIEF'S DRAFT (`.superpowers/sdd/task-1-brief.md`
 * Step 4 / `docs/superpowers/plans/2026-08-04-phase2-ports-simple.md:148`),
 * recorded here rather than silently fixed, per Step 3's instruction to
 * "record the real value and proceed":
 *  - `linkId` is `"q-structured"` for every fixture below, not `"1.1"` —
 *    the brief's draft was a placeholder, never verified against the
 *    backend.
 *  - `label` is `"<Type> section"` (e.g. `"Time of Death section"`), not
 *    the bare type name the brief assumed.
 *  - `subjectType` is `"encounter"` for EVERY fixture, including
 *    `time_of_death` — the brief's draft assumed `time_of_death` was
 *    patient-subject. It is not: `select subject_type from
 *    emr_questionnaire where slug = 'e2e-structured-time_of_death'` returns
 *    `encounter`, same as every other `e2e-structured-*` row. There is
 *    currently NO patient-subject fixture questionnaire in the backend
 *    inventory at all — see `patientFixtureUrl`'s doc comment below.
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
 * The six single-question fixtures (`q-note` + one `q-structured`
 * question) that fit `StructuredFixture`'s one-type-per-fixture shape:
 * the five simple ports (`2026-08-04-phase2-ports-simple.md`) plus
 * `unknown`, the missing-plugin degradation fixture. `kitchen_sink` (seven
 * questions, five structured types) and `patient_subject` (no such backend
 * fixture exists) do NOT fit this shape — see `KITCHEN_SINK_FIXTURE` below
 * and `patientFixtureUrl`'s doc comment respectively. The task brief's
 * "Produces" line names both as keys of this record; this is the recorded,
 * evidence-based divergence from that line, not an oversight.
 */
export const STRUCTURED_FIXTURES = {
  time_of_death: {
    slug: "e2e-structured-time_of_death",
    label: "Time of Death section",
    linkId: "q-structured",
    required: false,
    subjectType: "encounter",
  },
  appointment: {
    slug: "e2e-structured-appointment",
    label: "Appointment section",
    linkId: "q-structured",
    required: false,
    subjectType: "encounter",
  },
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
  files: {
    slug: "e2e-structured-files",
    label: "Files section",
    linkId: "q-structured",
    required: false,
    subjectType: "encounter",
  },
  /** `structured_type: "x_e2e.missing"` — no plugin registers it, so the
   *  slot renders the "requires a plugin that isn't enabled" degradation
   *  notice on every mount. `required: true` (verified) — the negative
   *  case this fixture exists for is rendering, not submission, but the
   *  flag is recorded accurately regardless. */
  unknown: {
    slug: "e2e-structured-unknown",
    label: "Missing Plugin Section",
    linkId: "q-structured",
    required: true,
    subjectType: "encounter",
  },
} as const satisfies Record<string, StructuredFixture>;

export type StructuredFixtureKey = keyof typeof STRUCTURED_FIXTURES;

/**
 * `e2e-structured-kitchen-sink` — one encounter-subject questionnaire
 * mixing five structured types with a boolean and a plain-text question
 * (design spec §7's "structured kitchen-sink... for session/draft/merge
 * specs"). It does not fit `StructuredFixture` (one structured question
 * per fixture), so it gets its own shape instead of being forced into
 * `STRUCTURED_FIXTURES` under a lie. Verified against the running backend
 * exactly like every fixture above — every `linkId`/`label` pair below is
 * a `psql` read, not a guess. A consuming task (10-12) that needs a
 * different shape should feel free to replace this rather than contort it.
 */
export const KITCHEN_SINK_FIXTURE = {
  slug: "e2e-structured-kitchen-sink",
  subjectType: "encounter",
  questions: {
    allergy_intolerance: { linkId: "q-allergy", label: "Allergies" },
    ready_for_discharge: {
      linkId: "q-boolean",
      label: "Ready for discharge?",
    },
    diagnosis: { linkId: "q-diagnosis", label: "Diagnoses" },
    encounter: { linkId: "q-encounter", label: "Encounter details" },
    files: { linkId: "q-files", label: "Attachments" },
    medication_request: {
      linkId: "q-medication-request",
      label: "Medications",
    },
    note: { linkId: "q-note", label: "Chief complaint" },
  },
} as const;

/** Encounter-subject fill URL for a resolved fixture questionnaire id. */
export function structuredFixtureUrl(questionnaireId: string): string {
  return `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
}

/**
 * Patient-subject fill URL, for whenever a patient-subject fixture
 * questionnaire exists to point it at.
 *
 * NONE DOES TODAY: every `e2e-structured-*` row in the backend inventory
 * (Task 1 Step 3) — including `time_of_death`, which the task brief's draft
 * assumed was the patient-subject case — is `subject_type: "encounter"`.
 * `fillPatientSubject.spec.ts`'s live authoring of a patient-subject
 * questionnaire therefore has NOT moved onto a backend fixture; this
 * function is kept, unused, for whichever later task adds one
 * backend-side, rather than deleted and re-invented.
 */
export function patientFixtureUrl(questionnaireId: string): string {
  return `/facility/${getFacilityId()}/patient/${getPatientId()}/questionnaire/${questionnaireId}`;
}
