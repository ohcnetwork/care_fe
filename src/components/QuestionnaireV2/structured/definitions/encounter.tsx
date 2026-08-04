import { t } from "i18next";

import { EncounterEditor } from "@/components/QuestionnaireV2/structured/types/encounter/EncounterEditor";
import {
  blocksSaveForMissingDischargeDisposition,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/encounter/model";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";

function EncounterInput(props: StructuredInputProps) {
  if (!props.encounterId || !props.facilityId) return null;
  return <EncounterEditor {...props} />;
}

export const encounterDefinition: StructuredTypeDefinition<"encounter"> = {
  type: "encounter",
  component: EncounterInput,
  requires: ["encounterId", "facilityId"],
  subjects: ["encounter"],
  // D2. The row is seven JSON-safe fields, and — unlike v1 — the DRAFT
  // stores the edit log, not the prefetched encounter, so a restore can no
  // longer re-PUT a stale server row over someone else's change.
  draftPolicy: "serialize",
  contract: 2,
  toRequests,
  // PRODUCT DECISION (Task 8, stated explicitly per the brief): an
  // untouched section may NOT block Save — `edits.length > 0` gates the
  // error regardless of the question's own `required` flag. Blocking Save
  // over server data the clinician never touched — possibly on a
  // questionnaire that doesn't even carry an encounter question they meant
  // to open — would be a new, disruptive coupling this port does not
  // introduce.
  //
  // CORRECTED (post-Task-8-review, executed): this is NOT only a
  // safety net for an untouched row. `requiresDischargeDisposition`
  // (`structured/types/encounter/model.ts`) is guaranteed satisfied by
  // every row the editor touches ONLY on a deployment where
  // `careConfig.defaultDischargeDisposition` is configured. That value is
  // honestly `| undefined` (`care.config.ts:81-83`) and **this repo's own
  // `.env.local` does not set it** — on this deployment,
  // `blocksSaveForMissingDischargeDisposition` fires as LIVE
  // required-field enforcement on the primary discharge entry point (the
  // "Mark for discharge" click, or the `?toDischarge` seed), exact legacy
  // parity: the field renders with its placeholder and the bound error
  // renders beside it, so the clinician resolves it before Save proceeds.
  // See `blocksSaveForMissingDischargeDisposition`'s own doc comment in
  // model.ts for the full reasoning, including where it is NOT full
  // parity with `appointment`'s `needsSlot`.
  validate: (projection, edits, questionId) =>
    blocksSaveForMissingDischargeDisposition(projection[0], edits)
      ? [
          {
            question_id: questionId,
            field_key: "hospitalization.discharge_disposition",
            error: t("field_required"),
            required: true,
          },
        ]
      : [],
};
